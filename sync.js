(() => {
  'use strict';

  const app = window.jagadReading;
  const $ = id => document.getElementById(id);
  const clientId = $('drive-oauth-client').content.trim();
  const status = $('cloud-status');
  const connect = $('connect-drive');
  const disconnect = $('disconnect-drive');
  const syncButton = $('sync-now');
  const scope = 'https://www.googleapis.com/auth/drive.appdata';
  const drive = 'https://www.googleapis.com/drive/v3';
  const upload = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const keyPrefix = 'jagad-reading-drive-change:';
  const accountKey = 'jagad-reading-drive-account';
  const migratedKey = 'jagad-reading-drive-migrated';
  const fileName = 'jagad-reading-progress-changes.json';
  const schema = 'jagad-reading-drive-changes';
  const memoryQueue = new Map();
  const downloaded = new Map();
  let token = '';
  let account = '';
  let tokenClient;
  let connecting = false;
  let busy = false;
  let queued = false;
  let timer;

  function show(message, warning = false) {
    status.textContent = message;
    status.classList.toggle('warning', warning);
  }

  function readLocal(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function writeLocal(key, value) {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  }

  function remember(patches, at = new Date().toISOString()) {
    if (!Object.keys(patches).length) return true;
    const event = { id: crypto.randomUUID(), at, patches };
    if (writeLocal(keyPrefix + event.id, JSON.stringify(event))) return true;
    memoryQueue.set(event.id, event);
    return false;
  }

  function pending() {
    const events = new Map(memoryQueue);
    try {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith(keyPrefix)) continue;
        const value = readLocal(key);
        if (!value) continue;
        const event = validateEvent(JSON.parse(value));
        events.set(event.id, event);
      }
    } catch (error) {
      if (error.name !== 'SecurityError') throw error;
    }
    return events;
  }

  function acknowledge(events) {
    for (const { id } of events) {
      memoryQueue.delete(id);
      try { localStorage.removeItem(keyPrefix + id); } catch { /* Already stored in Drive. */ }
    }
  }

  function validateEvent(event) {
    if (!event || !/^[a-f0-9-]{36}$/.test(event.id) ||
        !(event.at === null || Number.isFinite(Date.parse(event.at)))) {
      throw Error('Riwayat progres di Drive atau browser tidak valid.');
    }
    return { id: event.id, at: event.at, patches: app.validatePatches(event.patches) };
  }

  function latestPatches(events) {
    const winners = {};
    for (const { id, at, patches } of events) {
      for (const [readingId, fields] of Object.entries(patches)) {
        for (const [field, record] of Object.entries(fields)) {
          const date = Date.parse(at || record.updatedAt);
          if (!Number.isFinite(date)) continue;
          const current = (winners[readingId] ||= {})[field];
          if (!current || date > current.date || (date === current.date && id > current.id)) {
            winners[readingId][field] = { date, id, record };
          }
        }
      }
    }
    return Object.fromEntries(Object.entries(winners).map(([id, fields]) =>
      [id, Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.record]))]));
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers: { ...options.headers, Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) {
      const messages = {
        401: 'Sesi Google berakhir. Hubungkan Google Drive kembali.',
        403: 'Google Drive menolak akses. Periksa izin Drive dan konfigurasi aplikasi.',
        429: 'Google Drive sedang membatasi permintaan. Coba lagi sebentar.'
      };
      const error = Error(messages[response.status] || 'Google Drive merespons ' + response.status + '.');
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  async function readHistory() {
    const history = new Map();
    const query = new URLSearchParams({
      spaces: 'appDataFolder',
      q: "name = '" + fileName + "' and trashed = false",
      fields: 'nextPageToken,files(id)',
      pageSize: '100'
    });
    do {
      const page = await request(drive + '/files?' + query);
      const missing = (page.files || []).filter(file => !downloaded.has(file.id));
      for (let offset = 0; offset < missing.length; offset += 6) {
        await Promise.all(missing.slice(offset, offset + 6).map(async ({ id }) => {
          const data = await request(drive + '/files/' + encodeURIComponent(id) + '?alt=media');
          if (data.schema !== schema || !Array.isArray(data.events)) {
            throw Error('Format riwayat progres di Drive tidak valid.');
          }
          downloaded.set(id, data.events.map(validateEvent));
        }));
      }
      if (!page.nextPageToken) break;
      query.set('pageToken', page.nextPageToken);
    } while (true);
    for (const events of downloaded.values()) {
      for (const event of events) history.set(event.id, event);
    }
    return history;
  }

  async function append(events) {
    const boundary = 'jagad_' + crypto.randomUUID();
    const metadata = { name: fileName, parents: ['appDataFolder'], mimeType: 'application/json' };
    const body = [
      '--' + boundary, 'Content-Type: application/json; charset=UTF-8', '',
      JSON.stringify(metadata),
      '--' + boundary, 'Content-Type: application/json; charset=UTF-8', '',
      JSON.stringify({ schema, events }),
      '--' + boundary + '--', ''
    ].join('\r\n');
    const file = await request(upload + '&fields=id', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
      body
    });
    downloaded.set(file.id, events);
  }

  function setConnected(connected) {
    connect.hidden = connected;
    disconnect.hidden = !connected;
    syncButton.hidden = !connected;
    disconnect.disabled = busy;
  }

  function fail(error) {
    if (error.status === 401) {
      token = '';
      setConnected(false);
    }
    const message = navigator.onLine ? error.message : 'Sedang luring.';
    show(message + ' Perubahan lokal akan dicoba lagi saat terhubung.', true);
  }

  async function sync() {
    if (!token || connecting) return;
    if (busy) { queued = true; return; }

    busy = true;
    disconnect.disabled = true;
    show('Menyinkronkan progres dengan Google Drive…');
    try {
      const history = await readHistory();
      const seed = pending();
      const missing = [...seed.values()].filter(event => !history.has(event.id));
      if (missing.length) await append(missing);
      for (const event of seed.values()) history.set(event.id, event);
      acknowledge(seed.values());
      const outstanding = pending();
      for (const event of outstanding.values()) history.set(event.id, event);
      app.apply(app.merge({}, latestPatches(history.values())));
      if (outstanding.size) queued = true;
      show(outstanding.size ? 'Menyimpan perubahan berikutnya…' :
        'Tersinkron ke Google Drive · ' + new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit', minute: '2-digit'
        }));
    } catch (error) {
      fail(error);
    } finally {
      busy = false;
      disconnect.disabled = false;
      if (queued) { queued = false; void sync(); }
    }
  }

  async function authorize(response) {
    try {
      if (response.error || !response.access_token) throw Error('Izin Google Drive belum diberikan.');
      token = response.access_token;
      const { user } = await request(drive + '/about?fields=user(permissionId)');
      const previous = readLocal(accountKey) || account;
      if (!user?.permissionId) throw Error('Akun Google Drive belum dapat dikenali.');
      if (previous && previous !== user.permissionId) {
        throw Error('Browser ini sudah memakai akun Google lain untuk monitor. Gunakan profil browser terpisah untuk akun berbeda.');
      }
      account = user.permissionId;
      writeLocal(accountKey, account);
      if (!readLocal(migratedKey)) {
        const patches = app.diff({}, app.get().entries);
        if (remember(patches, null)) writeLocal(migratedKey, '1');
      }
      setConnected(true);
    } catch (error) {
      token = '';
      setConnected(false);
      show(error.message, true);
    } finally {
      connecting = false;
      connect.disabled = false;
    }
    if (token) void sync();
  }

  if (!clientId) {
    show('Google Drive menunggu konfigurasi aplikasi. Progres sementara tersimpan di browser.');
    connect.hidden = true;
    return;
  }

  window.addEventListener('reading-change', event => {
    const saved = remember(event.detail);
    if (!saved) {
      show('Antrean sinkronisasi hanya tersimpan di tab ini. Sinkronkan atau ekspor sebelum menutup tab.', true);
    } else if (!token) {
      show('Perubahan tersimpan di perangkat ini. Hubungkan Google Drive untuk menyinkronkan.');
    }
    if (token) {
      clearTimeout(timer);
      timer = setTimeout(sync, 650);
    }
  });

  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope,
      callback: authorize,
      error_callback: () => {
        connecting = false;
        connect.disabled = false;
        show('Jendela Google tidak terbuka atau ditutup. Tekan Hubungkan Google Drive untuk mencoba lagi.', true);
      }
    });
    connect.disabled = false;
    show('Hubungkan Google Drive untuk membuka progres dari perangkat lain.');
  };
  script.onerror = () => show('Layanan login Google belum termuat. Muat ulang halaman ketika internet tersedia.', true);
  document.head.append(script);

  connect.addEventListener('click', () => {
    connecting = true;
    connect.disabled = true;
    try {
      tokenClient.requestAccessToken({ prompt: '' });
    } catch {
      connecting = false;
      connect.disabled = false;
      show('Login Google belum dapat dibuka. Muat ulang halaman lalu coba lagi.', true);
    }
  });
  disconnect.addEventListener('click', () => {
    token = '';
    downloaded.clear();
    clearTimeout(timer);
    setConnected(false);
    show('Google Drive diputus dari tab ini. Progres di browser tetap tersedia.');
  });
  syncButton.addEventListener('click', sync);
  window.addEventListener('online', sync);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void sync();
  });
  setInterval(() => {
    if (document.visibilityState === 'visible') void sync();
  }, 45000);
})();
