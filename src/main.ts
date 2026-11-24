import {
  brand,
  waNumber,
  services,
  units,
  prices,
  packages,
  kinds,
  type KindId,
  type Pkg,
  type Service,
  type ServiceId,
  type Unit,
} from "./config";

/* ---------- helpers ---------- */

const rupiah = (n: number): string => "Rp " + n.toLocaleString("id-ID");

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[c] ?? c;
  });

function q<T extends Element>(sel: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error("Elemen tidak ditemukan: " + sel);
  return el;
}

const qa = <T extends Element>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(sel));

const waUrl = (text: string): string => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

/* ---------- state ---------- */

interface Trip {
  service: ServiceId;
  date: string;
  time: string;
  days: number;
  pax: number;
  dest: string;
  allIn: boolean;
}

interface Pick {
  unit: Unit;
  count: number;
}

const LIMITS = { days: { min: 1, max: 14 }, pax: { min: 1, max: 40 } } as const;
const ALL_IN_SURCHARGE = 250000;

const trip: Trip = { service: "harian", date: "", time: "08:00", days: 1, pax: 4, dest: "", allIn: false };
let lastTotalText = "";

function svcOf(id: ServiceId): Service {
  const s = services.find((x) => x.id === id);
  if (!s) throw new Error("Layanan tidak dikenal: " + id);
  return s;
}

const bySeats = [...units].sort((a, b) => a.seats - b.seats);

function recommend(pax: number): Pick {
  const fit = bySeats.find((u) => u.seats >= pax);
  if (fit) return { unit: fit, count: 1 };
  const biggest = bySeats[bySeats.length - 1];
  if (!biggest) throw new Error("Daftar unit kosong");
  return { unit: biggest, count: Math.ceil(pax / biggest.seats) };
}

const pickFor = (u: Unit): Pick => ({ unit: u, count: Math.max(1, Math.ceil(trip.pax / u.seats)) });

function unitRateFor(unitId: Unit["id"]): number {
  return prices[trip.service][unitId] + (trip.allIn ? ALL_IN_SURCHARGE : 0);
}

function totalFor(p: Pick): number {
  const svc = svcOf(trip.service);
  return unitRateFor(p.unit.id) * (svc.hasDays ? trip.days : 1) * p.count;
}

function dateText(): string {
  if (!trip.date) return "belum ditentukan";
  const [y, m, d] = trip.date.split("-").map(Number);
  if (!y || !m || !d) return "belum ditentukan";
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function tripMessage(p: Pick): string {
  const svc = svcOf(trip.service);
  const lines = [
    `Halo ${brand}, saya mau sewa mobil dengan sopir.`,
    `Jenis: ${svc.label}`,
    `Paket: ${trip.allIn ? "Terima Beres (All-In BBM & Tol)" : "Unit + Sopir Saja"}`,
    `Tanggal: ${dateText()}`,
    `Jam jemput: ${trip.time || "08:00"} WIB`,
  ];
  if (svc.hasDays) lines.push(`Lama: ${trip.days} hari`);
  lines.push(
    `Penumpang: ${trip.pax} orang`,
    `Tujuan: ${trip.dest.trim() || "belum ditentukan"}`,
    `Unit: ${p.count > 1 ? p.count + " x " : ""}${p.unit.name}`,
    `Estimasi: ${rupiah(totalFor(p))}`,
  );
  return lines.join("\n");
}

function packageMessage(p: Pkg): string {
  return [
    `Halo ${brand}, saya tertarik paket "${p.title}".`,
    `Paket: ${trip.allIn ? "Terima Beres (All-In)" : "Unit + Sopir Saja"}`,
    `Tanggal: ${dateText()}`,
    `Jam jemput: ${trip.time || "08:00"} WIB`,
    `Penumpang: ${trip.pax} orang`,
  ].join("\n");
}

function vehicleSymbolFor(u: Unit): string {
  if (u.seats >= 11) return "v-van";
  if (u.id.includes("suv") || u.id.includes("innova") || u.id.includes("fortuner") || u.id.includes("pajero")) return "v-suv";
  return "v-mpv";
}

/* ---------- build (sekali) ---------- */

function buildSeg(): void {
  const seg = q<HTMLElement>("#seg");
  seg.innerHTML = services
    .map(
      (s) =>
        `<label class="seg__opt"><input type="radio" name="service" value="${s.id}"${
          s.id === trip.service ? " checked" : ""
        }><span>${esc(s.label)}</span></label>`,
    )
    .join("");
}

function buildFleet(): void {
  q<HTMLElement>("#fleet").innerHTML = units
    .map((u) => {
      const seats = Array.from({ length: u.seats }, () => '<span class="seat"></span>').join("");
      const sym = vehicleSymbolFor(u);
      return `
      <article class="card unit" data-unit="${u.id}">
        <div class="unit__top">
          <div class="unit__art" aria-hidden="true"><svg><use href="#${sym}"/></svg></div>
          <p class="unit__badge" hidden>Disarankan</p>
        </div>
        <h3 class="unit__name">${esc(u.name)}</h3>
        <p class="unit__seats">Sopir dan ${u.seats} penumpang</p>
        <p class="unit__suits">${esc(u.suits)}</p>
        <div class="seatmap" role="img" aria-label="Denah ${u.seats} kursi penumpang"><span class="seat seat--driver"></span>${seats}</div>
        <p class="unit__price"><strong data-price></strong> <span data-rate></span></p>
        <a class="btn btn--line" data-unit-wa href="${waUrl("Halo " + brand)}">Tanya unit ini</a>
      </article>`;
    })
    .join("");
}

function buildTable(): void {
  const head = units.map((u) => `<th scope="col">${esc(u.name)}</th>`).join("");
  const rows = services
    .map(
      (s) => `
      <tr data-service="${s.id}">
        <th scope="row">${esc(s.label)}<small>${esc(s.rate)}</small></th>
        ${units.map((u) => `<td data-cell-unit="${u.id}">${rupiah(prices[s.id][u.id])}</td>`).join("")}
      </tr>`,
    )
    .join("");
  q<HTMLElement>("#tarifTable").innerHTML = `<thead><tr><th scope="col">Jenis perjalanan</th>${head}</tr></thead><tbody>${rows}</tbody>`;
}

function buildChips(): void {
  q<HTMLElement>("#chips").innerHTML = kinds
    .map((k) => `<button type="button" class="chip" data-kind="${k.id}" aria-pressed="${k.id === "semua"}">${esc(k.label)}</button>`)
    .join("");
}

function renderPackages(kind: KindId, animate = false): void {
  const list = kind === "semua" ? packages : packages.filter((p) => p.kind === kind);
  q<HTMLElement>("#pkgs").innerHTML = list
    .map(
      (p, idx) => `
      <article class="card pkg${animate ? " pop" : ""}"${animate ? ` style="animation-delay:${idx * 55}ms"` : ""}>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.blurb)}</p>
        <p class="pkg__meta">Durasi: ${esc(p.duration)}</p>
        <a class="btn btn--line" data-pkg-wa="${p.id}" href="${waUrl("Halo " + brand)}">Tanya paket ini</a>
      </article>`,
    )
    .join("");
  updateLinks();
}

/* ---------- update (tiap perubahan) ---------- */

function pulseTotal(el: HTMLElement): void {
  el.classList.remove("is-bump");
  void el.offsetWidth;
  el.classList.add("is-bump");
}

function updateResult(): void {
  const svc = svcOf(trip.service);
  const pick = recommend(trip.pax);
  const rate = unitRateFor(pick.unit.id);
  const days = svc.hasDays ? trip.days : 1;
  const totalStr = rupiah(totalFor(pick));

  q("#resUnit").textContent = (pick.count > 1 ? pick.count + " x " : "") + pick.unit.name;
  const totalEl = q<HTMLElement>("#resTotal");
  totalEl.textContent = totalStr;

  if (lastTotalText && lastTotalText !== totalStr) {
    pulseTotal(totalEl);
  }
  lastTotalText = totalStr;

  const parts = [svc.hasDays ? `${days} hari x ${rupiah(rate)}` : `Sekali jalan, ${rupiah(rate)}`];
  if (trip.allIn) parts.push("All-In BBM & tol");
  if (pick.count > 1) parts.push(`${pick.count} unit`);
  q("#resDetail").textContent = parts.join(" • ");
}

function updateFleet(): void {
  const svc = svcOf(trip.service);
  const pick = recommend(trip.pax);
  for (const card of qa<HTMLElement>(".unit")) {
    const unit = units.find((u) => u.id === card.dataset.unit);
    if (!unit) continue;
    const isPick = unit.id === pick.unit.id;
    card.classList.toggle("is-pick", isPick);
    q<HTMLElement>(".unit__badge", card).hidden = !isPick;
    q("[data-price]", card).textContent = rupiah(unitRateFor(unit.id));
    q("[data-rate]", card).textContent = svc.rate + (trip.allIn ? " (All-In)" : "");
    const filled = Math.min(trip.pax, unit.seats);
    qa<HTMLElement>(".seat:not(.seat--driver)", card).forEach((s, i) => s.classList.toggle("on", i < filled));
    q<HTMLAnchorElement>("[data-unit-wa]", card).href = waUrl(tripMessage(pickFor(unit)));
  }
}

function updateTable(): void {
  for (const row of qa<HTMLElement>("#tarifTable tr[data-service]")) {
    const svcId = row.dataset.service as ServiceId;
    row.classList.toggle("is-current", svcId === trip.service);
    for (const td of qa<HTMLElement>("td[data-cell-unit]", row)) {
      const unitId = td.dataset.cellUnit as Unit["id"];
      const val = prices[svcId][unitId] + (trip.allIn ? ALL_IN_SURCHARGE : 0);
      td.textContent = rupiah(val);
    }
  }
}

function updateLinks(): void {
  const general = waUrl(`Halo ${brand}, saya mau tanya sewa mobil dengan sopir.`);
  for (const a of qa<HTMLAnchorElement>("[data-wa-general]")) a.href = general;
  q<HTMLAnchorElement>("#sendWa").href = waUrl(tripMessage(recommend(trip.pax)));
  for (const a of qa<HTMLAnchorElement>("[data-pkg-wa]")) {
    const p = packages.find((x) => x.id === a.dataset.pkgWa);
    if (p) a.href = waUrl(packageMessage(p));
  }
}

function updateSteppers(): void {
  const svc = svcOf(trip.service);
  q<HTMLElement>("#daysField").hidden = !svc.hasDays;
  q("#daysVal").textContent = String(trip.days);
  q("#paxVal").textContent = String(trip.pax);
  for (const b of qa<HTMLButtonElement>("[data-step]")) {
    const field = b.dataset.step as "days" | "pax";
    const dir = Number(b.dataset.dir);
    const next = trip[field] + dir;
    b.disabled = next < LIMITS[field].min || next > LIMITS[field].max;
  }
}

function update(): void {
  updateSteppers();
  updateResult();
  updateFleet();
  updateTable();
  updateLinks();
}

/* ---------- events ---------- */

function bindEstimator(): void {
  const form = q<HTMLFormElement>("#estimasi");
  const date = q<HTMLInputElement>("#date");
  const time = q<HTMLInputElement>("#time");
  const dest = q<HTMLInputElement>("#dest");
  const allIn = q<HTMLInputElement>("#allIn");

  const now = new Date();
  date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  form.addEventListener("submit", (e) => e.preventDefault());

  form.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === "service") {
      trip.service = t.value as ServiceId;
      if (!svcOf(trip.service).hasDays) trip.days = 1;
      update();
    } else if (t === allIn) {
      trip.allIn = allIn.checked;
      update();
    }
  });

  date.addEventListener("input", () => {
    trip.date = date.value;
    updateLinks();
    updateFleet();
  });

  time.addEventListener("input", () => {
    trip.time = time.value;
    updateLinks();
    updateFleet();
  });

  dest.addEventListener("input", () => {
    trip.dest = dest.value;
    updateLinks();
    updateFleet();
  });

  form.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-step]");
    if (!btn || btn.disabled) return;
    const field = btn.dataset.step as "days" | "pax";
    const next = trip[field] + Number(btn.dataset.dir);
    trip[field] = Math.min(LIMITS[field].max, Math.max(LIMITS[field].min, next));
    update();
  });
}

function bindChips(): void {
  const chips = q<HTMLElement>("#chips");
  chips.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-kind]");
    if (!btn) return;
    for (const c of qa<HTMLButtonElement>(".chip", chips)) c.setAttribute("aria-pressed", String(c === btn));
    renderPackages(btn.dataset.kind as KindId, true);
  });
}

/* ---------- momen: jalan yang tergambar saat bagian "Cara pesan" terlihat ---------- */

function initRoad(): void {
  const road = q<HTMLElement>("#road");
  const stops = qa<HTMLElement>(".stop", road);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const set = (p: number): void => {
    road.style.setProperty("--p", p.toFixed(3));
    stops.forEach((s, i) => s.classList.toggle("on", p > 0.02 && p >= (i / (stops.length - 1)) * 0.98));
  };

  const measure = (): void => {
    const last = stops[stops.length - 1];
    const dot = last ? last.querySelector<HTMLElement>(".stop__dot") : null;
    if (!dot) return;
    const d = dot.getBoundingClientRect();
    const end = road.getBoundingClientRect().bottom - (d.top + d.height / 2);
    road.style.setProperty("--end", Math.max(0, end).toFixed(1) + "px");
  };

  road.classList.add("is-live");
  measure();
  window.addEventListener("resize", measure);
  if (reduce) {
    set(1);
    return;
  }

  let queued = false;
  const calc = (): void => {
    queued = false;
    const r = road.getBoundingClientRect();
    const p = (window.innerHeight * 0.72 - r.top) / (r.height * 0.85);
    set(Math.min(1, Math.max(0, p)));
  };
  const onScroll = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(calc);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  calc();
}

/* ---------- scroll reveal berurutan ---------- */

function initReveal(): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const groups = [
    ".services .service",
    ".fleet .unit",
    ".pkgs .pkg",
    ".tablewrap",
    ".incl > div",
    ".faq details",
    ".close__in > *",
  ];

  const targets: HTMLElement[] = [];
  for (const sel of groups) {
    qa<HTMLElement>(sel).forEach((el, idx) => {
      el.classList.add("reveal");
      el.style.setProperty("--stagger", `${Math.min(idx, 5) * 75}ms`);
      targets.push(el);
    });
  }

  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  for (const el of targets) io.observe(el);
}

/* ---------- start ---------- */

function init(): void {
  for (const el of qa<HTMLElement>("[data-brand]")) el.textContent = brand;
  for (const el of qa<HTMLElement>("[data-wa-number]")) el.textContent = "+" + waNumber;
  for (const el of qa<HTMLElement>("[data-year]")) el.textContent = String(new Date().getFullYear());

  buildSeg();
  buildFleet();
  buildTable();
  buildChips();
  renderPackages("semua");
  bindEstimator();
  bindChips();
  initRoad();
  update();
  initReveal();
}

init();