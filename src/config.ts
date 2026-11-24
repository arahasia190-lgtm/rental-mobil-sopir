// Semua yang perlu Anda ganti ada di file ini: nama usaha, nomor WhatsApp, tarif, unit, paket wisata.
// Setelah mengubah file ini, jalankan:  bun run build   (hasilnya ke dist/main.js)

export type ServiceId = "harian" | "luarKota" | "bandara" | "wisata";
export type UnitId = "mpv" | "premium" | "minibus";
export type KindId = "semua" | "alam" | "keluarga" | "religi" | "kota";

export interface Service {
  id: ServiceId;
  label: string;
  /** Satuan tarif yang tampil di samping harga. */
  rate: string;
  /** false = tarif sekali jalan, jumlah hari tidak dihitung. */
  hasDays: boolean;
}

export interface Unit {
  id: UnitId;
  name: string;
  /** Jumlah penumpang di luar sopir. */
  seats: number;
  suits: string;
}

export interface Pkg {
  id: string;
  kind: Exclude<KindId, "semua">;
  title: string;
  blurb: string;
  duration: string;
}

export const brand = "Kenzo Mobil";

// Format internasional tanpa "+" dan tanpa spasi. Nomor di bawah ini kosong sengaja,
// ganti dengan nomor WhatsApp Anda sebelum halaman dipublikasikan.
export const waNumber = "628989123423432";

export const services: Service[] = [
  { id: "harian", label: "Harian dalam kota", rate: "per hari (12 jam)", hasDays: true },
  { id: "luarKota", label: "Luar kota", rate: "per hari", hasDays: true },
  { id: "bandara", label: "Antar bandara", rate: "sekali jalan", hasDays: false },
  { id: "wisata", label: "Paket wisata", rate: "per hari", hasDays: true },
];

export const units: Unit[] = [
  { id: "mpv", name: "MPV keluarga", seats: 6, suits: "Keluarga kecil, perjalanan dinas, antar-jemput bandara." },
  { id: "premium", name: "MPV premium", seats: 7, suits: "Tamu, keluarga dengan banyak barang, wisata beberapa hari." },
  { id: "minibus", name: "Minibus rombongan", seats: 14, suits: "Keluarga besar, kantor, dan tamu acara dalam satu kendaraan." },
];

// TARIF CONTOH. Ganti dengan tarif Anda yang sebenarnya (rupiah per satuan di atas).
export const prices: Record<ServiceId, Record<UnitId, number>> = {
  harian: { mpv: 450000, premium: 750000, minibus: 1200000 },
  luarKota: { mpv: 650000, premium: 950000, minibus: 1600000 },
  bandara: { mpv: 250000, premium: 400000, minibus: 700000 },
  wisata: { mpv: 700000, premium: 1000000, minibus: 1700000 },
};

export const kinds: { id: KindId; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "alam", label: "Alam" },
  { id: "keluarga", label: "Keluarga dan kuliner" },
  { id: "religi", label: "Religi" },
  { id: "kota", label: "Keliling kota" },
];

export const packages: Pkg[] = [
  {
    id: "alam",
    kind: "alam",
    title: "Wisata alam dan pegunungan",
    blurb: "Air terjun, kebun teh, danau, dan udara sejuk. Waktu berhenti menyesuaikan rombongan.",
    duration: "1 hari atau 2 hari 1 malam",
  },
  {
    id: "keluarga",
    kind: "keluarga",
    title: "Wisata keluarga dan kuliner",
    blurb: "Tempat bermain anak, rumah makan khas daerah, dan jadwal santai untuk semua usia.",
    duration: "1 hari",
  },
  {
    id: "religi",
    kind: "religi",
    title: "Wisata religi dan ziarah",
    blurb: "Rute ziarah dengan waktu ibadah yang diperhitungkan, untuk keluarga atau pengajian.",
    duration: "1 hari sampai 3 hari 2 malam",
  },
  {
    id: "kota",
    kind: "kota",
    title: "Keliling kota dan oleh-oleh",
    blurb: "Untuk tamu dari luar kota yang hanya punya satu hari. Sopir hafal jalan dan pusat oleh-oleh.",
    duration: "Setengah hari atau 1 hari",
  },
];
