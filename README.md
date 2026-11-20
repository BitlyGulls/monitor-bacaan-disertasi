# Monitor Bacaan Disertasi Jagad

Aplikasi web statis untuk dua checklist per artikel: **sudah *skimming*** dan **sudah *deep reading***, dengan grafik progres masing-masing pada 42 bacaan dan per kelompok, pencarian, serta ekspor–impor cadangan JSON.

## Penggunaan

Aplikasi memiliki dua halaman yang dapat dipilih melalui menu di atas: **Checklist Bacaan** untuk daftar artikel, pencarian, filter, dan kedua checkbox; serta **Monitor Bacaan Pribadi** untuk grafik progres total dan per kelompok. Keduanya menggunakan data yang sama. Rute `#checklist` dan `#monitor` menjaga jalur berkas lokal serta penyimpanan centang yang sudah ada.

Buka alamat GitHub Pages repositori ini. *Skimming* dipakai untuk memetakan masalah, data/metode utama, kontribusi, dan relevansi; *deep reading* mencatat penelaahan lebih rinci atas metode, asumsi, validasi, serta keterbatasan. Centang kedua tahap secara terpisah. Satu tahap tidak otomatis mencentang tahap lain.

Grafik tidak menggabungkan kedua tahap menjadi satu persentase. Penyebut 42 menunjukkan ukuran koleksi; ini bukan kewajiban membaca mendalam semua artikel. Gunakan filter **Sudah skimming, belum deep reading** untuk menyeleksi antrean pendalaman. Artikel inti dapat segera dibaca mendalam tanpa menunggu seluruh koleksi selesai dipetakan.

Halaman awal langsung membuka **Checklist Bacaan**. Setiap artikel memuat dua checkbox langsung di HTML, sehingga kotaknya tetap terlihat sebelum skrip berjalan. JavaScript diperlukan untuk perpindahan halaman, penyimpanan, dan pembaruan grafik. Uraian koleksi dapat dibuka melalui **Tentang koleksi dan cara membaca**. Ekspor–impor cadangan dan pengaturan sinkronisasi tersedia di bagian penyimpanan di atas kedua halaman.

Centang tersimpan di browser. Untuk memindahkan progres dari halaman lokal yang lama, pilih **Ekspor progres** di halaman lama, kemudian **Impor progres** di web ini. Cadangan versi 1 tetap diterima: status lama **selesai dibaca** dipertahankan sebagai centang lama yang belum diberi tahap, tanpa dianggap otomatis telah *skimming* atau *deep reading*. Cadangan baru memakai format versi 2 dan mempertahankan tanggal masing-masing tahap. Migrasi penyimpanan browser juga menyimpan salinan data versi 1 pada kunci cadangan `jagad-must-read-v1-progress-before-stages`.

## Sinkronisasi Google Drive

1. Buka monitor pada browser yang sudah memiliki progres, lalu pilih **Hubungkan Google Drive**. Centang lokal ikut digabung pada koneksi pertama.
2. Di perangkat lain, buka URL yang sama, hubungkan Google Drive, dan pilih akun Google yang sama. Tunggu status **Tersinkron ke Google Drive**.
3. Perubahan dikirim otomatis selama sesi Google aktif. Perubahan luring ikut tersimpan di browser dan dikirim ketika koneksi kembali. Bila sesi kedaluwarsa atau halaman dimuat ulang, hubungkan Google Drive kembali.
4. Untuk memindahkan progres dari berkas HTML atau browser berbeda, ekspor JSON di tempat asal dan impor di monitor. Impor mengganti progres saat ini sesuai dialog konfirmasi. Ekspor juga menyediakan cadangan yang bisa disimpan sebagai berkas biasa.

Drive menyimpan riwayat perubahan di ruang data privat aplikasi (`appDataFolder`). Centang dan pembatalan centang digabung per artikel dan tahap. Jika dua perangkat mengubah tahap yang sama saat luring, waktu perubahan menentukan hasil akhir. Gunakan pengaturan waktu otomatis pada perangkat.

### Konfigurasi Google Cloud

1. Buka [Google Cloud Console](https://console.cloud.google.com/), pilih proyek dan aktifkan [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com).
2. Di Google Auth Platform, atur Branding, Audience dan Data Access. Untuk penggunaan pribadi dengan Audience External dalam mode Testing, tambahkan akun Google pemilik Drive sebagai test user. Gunakan cakupan `https://www.googleapis.com/auth/drive.appdata`.
3. Buat OAuth Client ID tipe **Web application**. Tambahkan `https://bitlygulls.github.io` pada **Authorized JavaScript origins**. Alur ini memakai popup Google Identity Services.
4. Isi atribut `content` pada elemen `drive-oauth-client` di `index.html` dengan Client ID. Simpan Client Secret di Google Cloud. Bila origin lokal dibutuhkan untuk pengujian, tambahkan origin localhost dengan port server pengujian yang dipakai.

## Publikasi

GitHub Pages menggunakan cabang `main` dan folder root. Publikasi memakai berkas statis tanpa proses build. Penggunaan Drive membutuhkan Client ID yang dikonfigurasi sebelum publikasi.

## Isi bacaan

Pilihan bacaan berasal dari panduan Must Read_v1 tanggal 12 November 2026. Ini seleksi bacaan, bukan tinjauan sistematis maupun verifikasi ulang metadata penerbit. Pernyataan dan batas penerapan dalam panduan sumber dipertahankan.

PDF lokal, katalog berisi jalur sumber komputer, proposal, dan dokumen penelitian tidak disertakan. Judul membuka DOI penerbit atau pencarian judul apabila DOI belum terverifikasi. Akses teks lengkap mengikuti ketersediaan pada penerbit/perpustakaan.

Referensi teknis: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) dan [Google Drive appDataFolder](https://developers.google.com/workspace/drive/api/guides/appdata).
