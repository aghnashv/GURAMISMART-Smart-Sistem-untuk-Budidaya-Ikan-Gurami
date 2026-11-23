GURAMISMART DASHBOARD

Dashboard ini menyediakan visualisasi interaktif data hasil panen gurami, termasuk:
- Ringkasan KPI (total berat, total ikan, survival rate, jumlah siklus)
- Grafik tren tahunan berat panen
- Perbandingan hasil per kolam
- Analisis survival rate per kolam
- Rata‑rata berat panen berdasarkan durasi budidaya
- Tabel rinci tiap siklus panen yang dapat difilter berdasarkan tahun dan kolam

Penjelasan Dashboard GuramiSmart

Dashboard ini menyediakan visualisasi interaktif data hasil panen gurami, termasuk:
- Ringkasan KPI (total berat, total ikan, survival rate, jumlah siklus)
- Grafik tren tahunan berat panen
- Perbandingan hasil per kolam
- Analisis survival rate per kolam
- Rata‑rata berat panen berdasarkan durasi budidaya
- Tabel rinci tiap siklus panen yang dapat difilter berdasarkan tahun dan kolam

CARA MENJALANKAN

Isi folder:
- index.html  : struktur dashboard
- style.css   : desain dan tata letak
- script.js   : pembacaan CSV, filter, KPI, grafik, dan tabel

LANGKAH 1 - SIAPKAN CSV DARI GOOGLE COLAB
Di notebook, setelah Cell 23 yang menyimpan dashboard_guramismart.csv, jalankan:

from google.colab import files
files.download(str(output_path))

Simpan file dashboard_guramismart.csv ke folder ini (sejajar dengan index.html).

LANGKAH 2 - JALANKAN
1. Buka folder ini di Visual Studio Code.
2. Install ekstensi Live Server.
3. Klik kanan index.html.
4. Pilih Open with Live Server.
5. Klik tombol Pilih file CSV dan pilih dashboard_guramismart.csv.

CATATAN PRIVASI DAN AKSES
- Dashboard membaca file CSV yang dipilih langsung di browser. File tidak diunggah ke server oleh kode ini.
- Agar dapat digunakan pada perangkat lain, salin folder dashboard dan file CSV ke perangkat tersebut, lalu pilih kembali file CSV.
- Untuk membuat dashboard online yang dapat dibuka melalui tautan, HTML/CSS/JS dan CSV harus ditempatkan pada hosting. Jangan publikasikan data yang bersifat rahasia atau internal perusahaan.
- Koneksi internet diperlukan untuk memuat Chart.js, PapaParse, dan Google Fonts dari CDN.

KOLOM CSV YANG DIHARAPKAN
Siklus_ID, Kolam, Tahun_Panen, Tanggal_Panen, Total_Berat_Kg,
Total_Ikan_Ekor, Jumlah_Penimbangan, Rata_Berat_Ikan_Kg,
Benih_Awal, Ikan_Mati, Survival_Rate, Tanggal_Tebar,
Durasi_Budidaya_Bulan