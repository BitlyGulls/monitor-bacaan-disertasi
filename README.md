# Monitor Bacaan Disertasi Jagad

Aplikasi web statis dengan simpan manual ke Google Drive dan dua checklist per artikel: **sudah *skimming*** dan **sudah *deep reading***, dengan grafik progres masing-masing pada 42 bacaan dan per kelompok, pencarian, serta ekspor–impor cadangan JSON.

## Penggunaan

Aplikasi memiliki dua halaman yang dapat dipilih melalui menu di atas: **Checklist Bacaan** untuk daftar artikel, pencarian, filter, dan kedua checkbox; serta **Monitor Bacaan Pribadi** untuk grafik progres total dan per kelompok. Keduanya menggunakan data yang sama. Rute `#checklist` dan `#monitor` menjaga jalur berkas lokal serta penyimpanan centang yang sudah ada.

Buka alamat GitHub Pages repositori ini. *Skimming* dipakai untuk memetakan masalah, data/metode utama, kontribusi, dan relevansi; *deep reading* mencatat penelaahan lebih rinci atas metode, asumsi, validasi, serta keterbatasan. Centang kedua tahap secara terpisah. Satu tahap tidak otomatis mencentang tahap lain.

Grafik tidak menggabungkan kedua tahap menjadi satu persentase. Penyebut 42 menunjukkan ukuran koleksi; ini bukan kewajiban membaca mendalam semua artikel. Gunakan filter **Sudah skimming, belum deep reading** untuk menyeleksi antrean pendalaman. Artikel inti dapat segera dibaca mendalam tanpa menunggu seluruh koleksi selesai dipetakan.

Halaman awal langsung membuka **Checklist Bacaan**. Setiap artikel memuat dua checkbox langsung di HTML, sehingga kotaknya tetap terlihat sebelum skrip berjalan. JavaScript diperlukan untuk perpindahan halaman, penyimpanan, dan pembaruan grafik. Uraian koleksi dapat dibuka melalui **Tentang koleksi dan cara membaca**. Ekspor–impor cadangan dan pengaturan sinkronisasi tersedia di bagian penyimpanan di atas kedua halaman.

Centang tersimpan di browser. Untuk memindahkan progres dari halaman lokal yang lama, pilih **Ekspor progres** di halaman lama, kemudian **Impor progres** di web ini. Cadangan versi 1 tetap diterima: status lama **selesai dibaca** dipertahankan sebagai centang lama yang belum diberi tahap, tanpa dianggap otomatis telah *skimming* atau *deep reading*. Cadangan baru memakai format versi 2 dan mempertahankan tanggal masing-masing tahap. Migrasi penyimpanan browser juga menyimpan salinan data versi 1 pada kunci cadangan `jagad-must-read-v1-progress-before-stages`.

## Simpan dan lanjutkan melalui Google Drive

Alurnya mengikuti Planner Disertasi Jagad:

1. Klik **Buka Google Drive**, lalu pilih akun Google. Aplikasi membuka simpanan bacaan terakhir dari akun tersebut.
2. Centang *skimming* atau *deep reading*. Status berubah menjadi **Perubahan belum disimpan**.
3. Klik **Simpan ke Google Drive** dan tunggu status **Tersimpan di Google Drive**.
4. Pada perangkat lain, buka situs bacaan ini dan klik **Buka Google Drive** dengan akun yang sama.
5. Gunakan **Muat ulang dari Drive** untuk mengambil simpanan terbaru. Ctrl+S atau Cmd+S juga menjalankan simpan ke Drive pada situs daring.

**Tidak ada autosave ke Drive.** Mengubah centang, berpindah halaman, membuka tab, atau mengimpor JSON tidak mengunggah progres. Perubahan dikirim hanya melalui tombol Simpan, pilihan **Simpan versi ini** saat konflik, atau pintasan simpan.

Draf disimpan terpisah per akun pada browser. Draf lama tanpa akun tetap dipertahankan dan dapat dibawa ketika pertama kali membuka akun. Berpindah dari akun A ke B tidak menyalin draf A ke B. Setelah memuat ulang situs, buka Google Drive lagi untuk mengakses draf akun dan simpanannya.

Jika versi Drive berbeda dari versi perangkat, pilih **Buka versi Drive** atau **Simpan versi ini**. Simpanan yang berubah membuat snapshot baru; snapshot sebelumnya tidak ditimpa. Dua penyimpanan serentak dapat sama-sama tersimpan, dan yang memiliki waktu pembuatan terbaru dibuka berikutnya. Belum tersedia pemilih riwayat snapshot. Buka versi terbaru sebelum mengedit dari perangkat lain.

## Lokasi dan akses simpanan

Progres bacaan disimpan di folder data aplikasi pribadi di Google Drive (`appDataFolder`), tersembunyi dari daftar berkas Drive biasa dan dibuka melalui web bacaan. Aplikasi meminta akses data aplikasinya serta identitas dan email akun, bukan akses seluruh dokumen Drive. Lihat [penjelasan Google](https://developers.google.com/workspace/drive/api/guides/appdata).

Konfigurasi memakai klien OAuth publik yang sudah digunakan planner pada origin GitHub Pages yang sama. Bacaan memakai nama berkas `reading-jagad-must-read-v1.json` dan format `jagad-drive-reading-v1`; simpanan planner tetap terpisah. Token akses hanya berada di memori tab dan tidak masuk ke kode, GitHub, atau penyimpanan browser.

Penyimpanan progres ke GitHub dengan personal access token telah diganti oleh Google Drive. Cabang `reading-progress` lama dipertahankan sebagai arsip, tetapi tidak dibaca atau ditulis oleh versi baru. Progres pribadi yang disimpan melalui aplikasi baru tidak masuk ke repositori publik. Setiap snapshot dibatasi 5 MB dan menggunakan kapasitas akun Google.

Salinan HTML lokal tetap mendukung checklist, dua halaman, dan ekspor–impor JSON. Login dan penyimpanan Google Drive memerlukan situs daring. Untuk memindahkan draf dari HTML lokal, ekspor JSON, impor di situs daring, kemudian tekan **Simpan ke Google Drive**. Cadangkan data sebelum menghapus penyimpanan browser.

## Publikasi

GitHub Pages: cabang `main`, folder `/` (root). Berkas `.nojekyll` menonaktifkan pengolahan Jekyll. Tidak ada dependensi, layanan berbayar, atau proses build. Progres tersimpan di Google Drive; menyimpan centang tidak memicu publikasi ulang situs.

## Isi bacaan

Pilihan bacaan berasal dari panduan Must Read_v1 tanggal 12 November 2026. Ini seleksi bacaan, bukan tinjauan sistematis maupun verifikasi ulang metadata penerbit. Pernyataan dan batas penerapan dalam panduan sumber dipertahankan.

PDF lokal, katalog berisi jalur sumber komputer, proposal, dan dokumen penelitian tidak disertakan. Judul membuka DOI penerbit atau pencarian judul apabila DOI belum terverifikasi. Akses teks lengkap mengikuti ketersediaan pada penerbit/perpustakaan.

Referensi teknis: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) dan [GitHub Contents API](https://docs.github.com/en/rest/repos/contents).
