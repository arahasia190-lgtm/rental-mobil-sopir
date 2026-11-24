# Rental Mobil dengan Sopir dan Paket Wisata

Landing page satu halaman untuk usaha rental mobil dengan sopir. Pengunjung memilih jenis perjalanan, tanggal, lama sewa, dan jumlah penumpang. Halaman langsung menghitung estimasi tarif dan unit yang cocok, lalu tombol WhatsApp membuka chat dengan semua detail sudah terisi.

Dibuat dengan **TypeScript** dan **Bun**, tanpa framework dan tanpa dependensi saat berjalan. Hasil build (`dist/main.js`) sudah ikut di repo, jadi bisa langsung dipasang di GitHub Pages.

## Yang perlu Anda ganti dulu

Buka `src/config.ts`:

| Isi | Keterangan |
|---|---|
| `brand` | Nama usaha Anda |
| `waNumber` | Nomor WhatsApp, format `62812xxxxxxx` (tanpa `+` dan spasi). Nilai bawaan sengaja nomor kosong. |
| `prices` | Tarif per jenis perjalanan dan unit. **Angka bawaan hanya contoh.** |
| `units` | Jenis mobil, kapasitas penumpang, dan keterangannya |
| `packages` | Daftar paket wisata |

Lalu bangun ulang:

```bash
bun run build
```

Kalau belum punya Bun: `curl -fsSL https://bun.sh/install | bash`. Pengecekan tipe (opsional): `bun install && bun run typecheck`.

## Pasang di GitHub Pages

```bash
git init -b main          # lewati jika folder ini sudah repo git
git add .
git commit -m "Landing page rental mobil"
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Di GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**. Alamatnya jadi `https://USERNAME.github.io/NAMA-REPO/`.

Atau dengan GitHub CLI (setelah `gh auth login`):

```bash
gh repo create NAMA-REPO --public --source=. --push
gh api -X POST repos/USERNAME/NAMA-REPO/pages -f "source[branch]=main" -f "source[path]=/"
```

## Struktur

```
index.html      markup halaman
styles.css      semua gaya
src/config.ts   data usaha (ubah di sini)
src/main.ts     kalkulator, filter paket, tautan WhatsApp, animasi jalan
dist/main.js    hasil build, dipakai index.html
```

## Fitur interaktif

- Kalkulator estimasi: jenis perjalanan, tanggal, lama sewa, penumpang, tujuan.
- Unit yang disarankan dan total harga berubah saat input berubah. Di atas kapasitas satu unit, halaman menghitung beberapa unit.
- Kartu armada: kursi terisi sesuai jumlah penumpang, unit yang cocok ditandai.
- Tabel tarif: baris yang dipilih di kalkulator disorot.
- Paket wisata dengan filter jenis.
- Pesan WhatsApp otomatis berisi tanggal, tujuan, penumpang, unit, dan estimasi.
- Bagian "Cara pesan": jalan tergambar saat bagian itu digulir. Pengguna yang mematikan animasi di sistemnya melihat versi diam.
- Tombol WhatsApp tetap di bawah layar pada ponsel.
