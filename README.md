# Monitor Bacaan Disertasi Jagad

Aplikasi web statis untuk dua checklist per artikel: **sudah *skimming*** dan **sudah *deep reading***, dengan grafik progres masing-masing pada 42 bacaan dan per kelompok, pencarian, serta ekspor–impor cadangan JSON.

## Penggunaan

Aplikasi memiliki dua halaman yang dapat dipilih melalui menu di atas: **Checklist Bacaan** untuk daftar artikel, pencarian, filter, dan kedua checkbox; serta **Monitor Bacaan Pribadi** untuk grafik progres total dan per kelompok. Keduanya menggunakan data yang sama. Rute `#checklist` dan `#monitor` menjaga jalur berkas lokal serta penyimpanan centang yang sudah ada.

Buka alamat GitHub Pages repositori ini. *Skimming* dipakai untuk memetakan masalah, data/metode utama, kontribusi, dan relevansi; *deep reading* mencatat penelaahan lebih rinci atas metode, asumsi, validasi, serta keterbatasan. Centang kedua tahap secara terpisah. Satu tahap tidak otomatis mencentang tahap lain.

Grafik tidak menggabungkan kedua tahap menjadi satu persentase. Penyebut 42 menunjukkan ukuran koleksi; ini bukan kewajiban membaca mendalam semua artikel. Gunakan filter **Sudah skimming, belum deep reading** untuk menyeleksi antrean pendalaman. Artikel inti dapat segera dibaca mendalam tanpa menunggu seluruh koleksi selesai dipetakan.

Halaman awal langsung membuka **Checklist Bacaan**. Setiap artikel memuat dua checkbox langsung di HTML, sehingga kotaknya tetap terlihat sebelum skrip berjalan. JavaScript diperlukan untuk perpindahan halaman, penyimpanan, dan pembaruan grafik. Uraian koleksi dapat dibuka melalui **Tentang koleksi dan cara membaca**. Ekspor–impor cadangan dan pengaturan sinkronisasi tersedia di bagian penyimpanan di atas kedua halaman.

Centang tersimpan di browser. Untuk memindahkan progres dari halaman lokal yang lama, pilih **Ekspor progres** di halaman lama, kemudian **Impor progres** di web ini. Cadangan versi 1 tetap diterima: status lama **selesai dibaca** dipertahankan sebagai centang lama yang belum diberi tahap, tanpa dianggap otomatis telah *skimming* atau *deep reading*. Cadangan baru memakai format versi 2 dan mempertahankan tanggal masing-masing tahap. Migrasi penyimpanan browser juga menyimpan salinan data versi 1 pada kunci cadangan `jagad-must-read-v1-progress-before-stages`.

## Sinkronisasi antarperangkat

Snapshot progres bersama disimpan sebagai `progress.json` pada cabang `reading-progress`. Pengunjung dapat membacanya; penulisan memerlukan token milik BitlyGulls. Kode, panduan, dan progres pada repositori publik dapat dilihat siapa saja.

1. Di GitHub, buat *fine-grained personal access token* dengan akses **hanya repositori ini**, serta izin **Contents: Read and write** dan masa berlaku sesuai kebutuhan.
2. Buka **Sinkronisasi antarperangkat lewat GitHub** pada aplikasi dan masukkan token. Token hanya disimpan di memori tab, tidak dalam kode, URL, localStorage, atau berkas repositori. Hubungkan kembali setelah memuat ulang atau menutup tab.
3. Setelah terhubung, perubahan dikirim otomatis. Buka URL web yang sama di perangkat lain untuk melihatnya. Untuk mengubah progres dari perangkat itu, hubungkan token di sana juga.
4. Periksa status sinkronisasi. Jika internet terputus, perubahan tertunda disimpan lokal dan dikirim setelah koneksi kembali selama token masih terhubung. Ekspor JSON sebagai cadangan tambahan.

Setiap penyimpanan mengambil snapshot terbaru sebelum mengirim perubahan lokal. Penggabungan dilakukan per tahap: perubahan *skimming* dan *deep reading* pada artikel yang sama dari perangkat berbeda tetap dipertahankan. Pada tahap yang sama, perubahan terakhir yang berhasil dikirim menang. Pembatalan centang juga disinkronkan. Konflik SHA dicoba ulang hingga tiga kali. Progres tidak mengandung token.

Pengunjung tanpa token tidak dapat mengubah progres bersama. Centang mereka hanya tersimpan di browser masing-masing. Token dengan izin penulisan repositori ini juga dapat menulis berkas lain di repositori: batasi ke repositori ini dan jangan bagikan token.

## Publikasi

GitHub Pages: cabang `main`, folder `/` (root). Berkas `.nojekyll` menonaktifkan pengolahan Jekyll. Tidak ada dependensi, layanan berbayar, atau proses build. Cabang progres terpisah agar perubahan centang tidak memicu publikasi ulang situs.

## Isi bacaan

Pilihan bacaan berasal dari panduan Must Read_v1 tanggal 12 November 2026. Ini seleksi bacaan, bukan tinjauan sistematis maupun verifikasi ulang metadata penerbit. Pernyataan dan batas penerapan dalam panduan sumber dipertahankan.

PDF lokal, katalog berisi jalur sumber komputer, proposal, dan dokumen penelitian tidak disertakan. Judul membuka DOI penerbit atau pencarian judul apabila DOI belum terverifikasi. Akses teks lengkap mengikuti ketersediaan pada penerbit/perpustakaan.

Referensi teknis: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) dan [GitHub Contents API](https://docs.github.com/en/rest/repos/contents).
