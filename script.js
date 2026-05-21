const supabaseUrl = "https://cmdbhaepecnwpohrhrpm.supabase.co";
const supabaseKey = "sb_publishable_sa-LoFmpE84BZL3gYnxJFg_8Vwje970";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const hotels = [
  { id: "pera", name: "The Marmara Pera", rooms: 205 },
  { id: "camlica", name: "The Marmara Çamlıca", rooms: 87 },
  { id: "suadiye", name: "The Marmara Suadiye", rooms: 32 }
];

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const currentDate = new Date();
const currentMonth = currentDate.getMonth();
const currentYear = currentDate.getFullYear();

let selectedId = "pera";
let viewMode = "forecast";

const data = {
  pera: {
    selectedMonth: currentMonth,
    mtdOcc: 85.96,
    mtdAdr: 114.28,
    romOcc: 58.05,
    romAdr: 114.24,
    oooRn: 62,
    targetOcc: 85,
    targetAdr: 115,
    morningRn: 0,
    morningAdr: 0,
    morningRev: 0,
    currentRn: 0,
    currentAdr: 0,
    currentRev: 0
  },
  camlica: {
    selectedMonth: currentMonth,
    mtdOcc: 91.86,
    mtdAdr: 118,
    romOcc: 71.36,
    romAdr: 116,
    oooRn: 0,
    targetOcc: 90,
    targetAdr: 120,
    morningRn: 0,
    morningAdr: 0,
    morningRev: 0,
    currentRn: 0,
    currentAdr: 0,
    currentRev: 0
  },
  suadiye: {
    selectedMonth: currentMonth,
    mtdOcc: 83.07,
    mtdAdr: 134.12,
    romOcc: 56.67,
    romAdr: 145.42,
    oooRn: 0,
    targetOcc: 84,
    targetAdr: 138,
    morningRn: 0,
    morningAdr: 0,
    morningRev: 0,
    currentRn: 0,
    currentAdr: 0,
    currentRev: 0
  }
};

const app = document.getElementById("app");

function getMonthDays(monthIndex) {
  return new Date(currentYear, monthIndex + 1, 0).getDate();
}

function getMtdDays(monthIndex) {
  const mdays = getMonthDays(monthIndex);

  if (monthIndex === currentMonth) {
    return Math.max(currentDate.getDate() - 1, 0);
  }

  if (monthIndex > currentMonth) return 0;

  return mdays;
}

function money(v) {
  if (!isFinite(v)) return "-";
  return "€" + Number(v).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function num(v) {
  if (!isFinite(v)) return "-";
  return Math.round(v).toLocaleString("tr-TR");
}

function pct(v) {
  if (!isFinite(v)) return "-";
  return v.toFixed(2) + "%";
}

function calc(hotel) {
  const d = data[hotel.id];

  const selectedMonth = Number(d.selectedMonth);
  const mdays = getMonthDays(selectedMonth);
  const mtd = getMtdDays(selectedMonth);
  const remaining = mdays - mtd;

  const monthlyOoo = Number(d.oooRn || 0);
  const dailyOoo = mdays > 0 ? monthlyOoo / mdays : 0;
  const mtdOoo = dailyOoo * mtd;
  const romOoo = dailyOoo * remaining;

  const grossInventory = hotel.rooms * mdays;
  const netInventory = grossInventory - monthlyOoo;

  const mtdCap = hotel.rooms * mtd - mtdOoo;
  const romCap = hotel.rooms * remaining - romOoo;

  const mtdSold = mtdCap * Number(d.mtdOcc) / 100;
  const mtdRev = mtdSold * Number(d.mtdAdr);

  const romOtbRn = romCap * Number(d.romOcc) / 100;
  const romOtbRev = romOtbRn * Number(d.romAdr);

  const sellableRn = romCap - romOtbRn;

  const targetRn = netInventory * Number(d.targetOcc) / 100;
  const targetRev = targetRn * Number(d.targetAdr);

  const requiredRomRn = targetRn - mtdSold;
  const requiredRomRev = targetRev - mtdRev;

  const requiredRomAdr =
    requiredRomRn > 0 ? requiredRomRev / requiredRomRn : 0;

  const requiredRomOcc =
    romCap > 0 ? requiredRomRn / romCap * 100 : 0;

  const currentForecastRn = mtdSold + romOtbRn;
  const currentForecastRev = mtdRev + romOtbRev;

  const currentForecastOcc =
    netInventory > 0 ? currentForecastRn / netInventory * 100 : 0;

  const currentForecastAdr =
    currentForecastRn > 0 ? currentForecastRev / currentForecastRn : 0;

  let pickupRn = requiredRomRn - romOtbRn;
  let pickupRev = requiredRomRev - romOtbRev;

  let pickupAdr =
    pickupRn > 0 ? pickupRev / pickupRn : 0;

  let pickupPerDay =
    remaining > 0 ? pickupRn / remaining : 0;

  const achieved = pickupRn <= 0;
  const impossible = pickupRn > sellableRn || requiredRomOcc > 100;

  if (achieved) {
    pickupRn = 0;
    pickupRev = 0;
    pickupAdr = 0;
    pickupPerDay = 0;
  }

  const snapshotPickupRn =
    Number(d.currentRn || 0) - Number(d.morningRn || 0);

  const snapshotPickupRev =
    Number(d.currentRev || 0) - Number(d.morningRev || 0);

  const snapshotPickupAdr =
    snapshotPickupRn > 0 ? snapshotPickupRev / snapshotPickupRn : 0;

  const snapshotRnGrowth =
    Number(d.morningRn || 0) > 0
      ? snapshotPickupRn / Number(d.morningRn) * 100
      : 0;

  const snapshotRevGrowth =
    Number(d.morningRev || 0) > 0
      ? snapshotPickupRev / Number(d.morningRev) * 100
      : 0;

  return {
    selectedMonth,
    mdays,
    mtd,
    remaining,

    monthlyOoo,
    grossInventory,
    netInventory,
    mtdCap,
    romCap,

    mtdSold,
    mtdRev,
    romOtbRn,
    romOtbRev,
    sellableRn,

    targetRn,
    targetRev,

    requiredRomRn,
    requiredRomRev,
    requiredRomAdr,
    requiredRomOcc,

    currentForecastRn,
    currentForecastRev,
    currentForecastOcc,
    currentForecastAdr,

    pickupRn,
    pickupRev,
    pickupAdr,
    pickupPerDay,

    snapshotPickupRn,
    snapshotPickupRev,
    snapshotPickupAdr,
    snapshotRnGrowth,
    snapshotRevGrowth,

    achieved,
    impossible
  };
}

function render() {
  const selectedHotel = hotels.find(h => h.id === selectedId);
  const c = calc(selectedHotel);
  const d = data[selectedId];

  app.innerHTML = `
    <div class="title">ForCal</div>
    <div class="subtitle">Revenue Forecast Tool</div>

    <div class="hotel-grid">
      ${hotels.map(h => {
        const x = calc(h);

        return `
          <div class="card hotel-card ${h.id === selectedId ? "active" : ""}" onclick="selectHotel('${h.id}')">
            <div class="hotel-name">${h.name}</div>

            <div class="muted">
              ${h.rooms} oda • ${monthNames[x.selectedMonth]} •
              MTD 1-${x.mtd} • Kalan ${x.remaining} gün
            </div>

            <div class="kpi-label">Pickup Needed RN</div>
            <div class="kpi-value">
              ${x.achieved ? "✓" : x.impossible ? "-" : num(x.pickupRn)}
            </div>

            <br>

            <div class="kpi-label">Pickup ADR Needed</div>
            <div class="kpi-value">
              ${x.achieved ? "✓" : x.impossible ? "-" : money(x.pickupAdr)}
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <div class="card">
      <div class="hotel-name">${selectedHotel.name}</div>

      <div class="subtitle">
        ${selectedHotel.rooms} oda •
        ${monthNames[c.selectedMonth]} •
        ${c.mdays} gün •
        MTD 1-${c.mtd} •
        Kalan ${c.remaining} gün
      </div>

      <div class="input-grid">
        ${viewSelect()}
        ${monthSelect(d.selectedMonth)}

        ${viewMode === "forecast" ? forecastInputs(d) : snapshotInputs(d)}
      </div>

      <div class="result-grid">
        ${viewMode === "forecast"
          ? forecastResults(c, d)
          : snapshotResults(c, d)}
      </div>
    </div>

    <div class="footer-credit">
      Copyright Tolga Duman<span class="tm">c</span> 2026
    </div>
  `;
}

function forecastInputs(d) {
  return `
    ${input("MTD OCC %", "mtdOcc", d.mtdOcc)}
    ${input("MTD ADR", "mtdAdr", d.mtdAdr)}
    ${input("ROM OCC %", "romOcc", d.romOcc)}
    ${input("ROM ADR", "romAdr", d.romAdr)}
    ${input("Monthly OOO RN", "oooRn", d.oooRn)}
    ${input("Target OCC %", "targetOcc", d.targetOcc)}
    ${input("Target ADR", "targetAdr", d.targetAdr)}
  `;
}

function snapshotInputs(d) {
  return `
    ${input("Morning RN", "morningRn", d.morningRn)}
    ${input("Morning ADR", "morningAdr", d.morningAdr)}
    ${input("Morning REV", "morningRev", d.morningRev)}

    ${input("Current RN", "currentRn", d.currentRn)}
    ${input("Current ADR", "currentAdr", d.currentAdr)}
    ${input("Current REV", "currentRev", d.currentRev)}
  `;
}

function forecastResults(c, d) {
  return `
    ${statusCard(c)}

    ${result("OTB OCC", pct(c.currentForecastOcc))}
    ${result("OTB ADR", money(c.currentForecastAdr))}
    ${result("OTB Revenue", money(c.currentForecastRev))}

    ${result("Required ROM RN", num(c.requiredRomRn))}
    ${result("Required ROM ADR", money(c.requiredRomAdr))}
    ${result("Required ROM OCC", pct(c.requiredRomOcc))}

    ${result("ROM RN", num(c.romOtbRn))}
    ${result("ROM Revenue", money(c.romOtbRev))}
    ${result("Sellable Remaining RN", num(c.sellableRn))}

    ${result("Pickup Needed RN", c.achieved ? "0" : c.impossible ? "-" : num(c.pickupRn))}
    ${result("Pickup ADR Needed", c.achieved ? "0" : c.impossible ? "-" : money(c.pickupAdr))}
    ${result("Pickup / Day", c.achieved ? "0" : c.impossible ? "-" : c.pickupPerDay.toFixed(1))}
    ${result("Pickup Revenue Needed", c.achieved ? "0" : c.impossible ? "-" : money(c.pickupRev))}

    ${result("Gross Inventory", num(c.grossInventory))}
    ${result("Monthly OOO RN", num(c.monthlyOoo))}
    ${result("Net Inventory", num(c.netInventory))}

    ${result("Estimated RN", num(c.targetRn))}
    ${result("Estimated ADR", money(d.targetAdr))}
    ${result("Estimated Revenue", money(c.targetRev))}
  `;
}

function snapshotResults(c, d) {
  return `
    ${result(
  "Pickup / Day",
  c.achieved ? "0" : c.impossible ? "-" : c.pickupPerDay.toFixed(1)
)}

    ${result("Morning RN", num(d.morningRn))}
    ${result("Morning ADR", money(d.morningAdr))}
    ${result("Morning REV", money(d.morningRev))}

    ${result("Current RN", num(d.currentRn))}
    ${result("Current ADR", money(d.currentAdr))}
    ${result("Current REV", money(d.currentRev))}

    ${result("Snapshot Pickup RN", num(c.snapshotPickupRn))}
    ${result("Snapshot Pickup ADR", money(c.snapshotPickupAdr))}
    ${result("Snapshot Pickup REV", money(c.snapshotPickupRev))}

    ${result("RN Growth", pct(c.snapshotRnGrowth))}
    ${result("Revenue Growth", pct(c.snapshotRevGrowth))}
  `;
}

function viewSelect() {
  return `
    <div>
      <div class="kpi-label">View</div>
      <select
        onchange="changeViewMode(this.value)"
        style="
          width:100%;
          background:#111827;
          color:white;
          border:none;
          border-radius:10px;
          padding:12px;
          font-size:16px;
        "
      >
        <option value="forecast" ${viewMode === "forecast" ? "selected" : ""}>
          Forecast Calculator
        </option>
        <option value="snapshot" ${viewMode === "snapshot" ? "selected" : ""}>
          Snapshot Pick Up
        </option>
      </select>
    </div>
  `;
}

function monthSelect(value) {
  return `
    <div>
      <div class="kpi-label">Month</div>
      <select
        data-field="selectedMonth"
        onchange="updateFieldFromSelect(this)"
        style="
          width:100%;
          background:#111827;
          color:white;
          border:none;
          border-radius:10px;
          padding:12px;
          font-size:16px;
        "
      >
        ${monthNames.map((m, i) => `
          <option value="${i}" ${Number(value) === i ? "selected" : ""}>
            ${m}
          </option>
        `).join("")}
      </select>
    </div>
  `;
}

function input(label, field, value) {
  return `
    <div>
      <div class="kpi-label">${label}</div>
      <input
        type="number"
        step="0.01"
        value="${value}"
        data-field="${field}"
        onwheel="this.blur()"
        onkeydown="handleInputKey(event, this)"
        onchange="updateFieldFromInput(this)"
      >
    </div>
  `;
}

function result(label, value) {
  return `
    <div class="result-card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
    </div>
  `;
}

function statusCard(c) {
  if (c.achieved) {
    return `
      <div class="result-card success">
        <div class="kpi-label">Status</div>
        <div class="kpi-value">Achieved</div>
      </div>
    `;
  }

  if (c.impossible) {
    return `
      <div class="result-card warning">
        <div class="kpi-label">Status</div>
        <div class="kpi-value">Impossible</div>
      </div>
    `;
  }

  return `
    <div class="result-card">
      <div class="kpi-label">Status</div>
      <div class="kpi-value">On Track</div>
    </div>
  `;
}

function changeViewMode(value) {
  viewMode = value;
  render();
}

async function saveToCloud() {
  const d = data[selectedId];

  const payload = {
    hotel_id: selectedId,
    month_index: Number(d.selectedMonth),
    mtd_occ: Number(d.mtdOcc),
    mtd_adr: Number(d.mtdAdr),
    rom_occ: Number(d.romOcc),
    rom_adr: Number(d.romAdr),
    ooo_rn: Number(d.oooRn),
    target_occ: Number(d.targetOcc),
    target_adr: Number(d.targetAdr),
    morning_rn: Number(d.morningRn),
    morning_adr: Number(d.morningAdr),
    morning_rev: Number(d.morningRev),
    current_rn: Number(d.currentRn),
    current_adr: Number(d.currentAdr),
    current_rev: Number(d.currentRev),
    updated_at: new Date().toISOString()
  };

  console.log("Saving payload:", payload);

  const { data: savedData, error } = await supabaseClient
    .from("forecast_inputs")
    .upsert(payload, {
      onConflict: "hotel_id,month_index"
    })
    .select();

  if (error) {
        console.error("Save error:", error);
    return;
  }
  }

async function loadFromCloud() {
  const d = data[selectedId];

  const { data: cloudData, error } = await supabaseClient
    .from("forecast_inputs")
    .select("*")
    .eq("hotel_id", selectedId)
    .eq("month_index", Number(d.selectedMonth))
    .maybeSingle();

  if (error) {
    console.error("Load error:", error);
    return;
  }

  if (cloudData) {
    d.mtdOcc = Number(cloudData.mtd_occ);
    d.mtdAdr = Number(cloudData.mtd_adr);
    d.romOcc = Number(cloudData.rom_occ);
    d.romAdr = Number(cloudData.rom_adr);
    d.oooRn = Number(cloudData.ooo_rn);
    d.targetOcc = Number(cloudData.target_occ);
    d.targetAdr = Number(cloudData.target_adr);
    d.morningRn = Number(cloudData.morning_rn || 0);
    d.morningAdr = Number(cloudData.morning_adr || 0);
    d.morningRev = Number(cloudData.morning_rev || 0);
    d.currentRn = Number(cloudData.current_rn || 0);
    d.currentAdr = Number(cloudData.current_adr || 0);
    d.currentRev = Number(cloudData.current_rev || 0);
  }

  render();
}

async function selectHotel(id) {
  selectedId = id;
  render();
  await loadFromCloud();
}

async function updateFieldFromInput(el) {
  const field = el.dataset.field;
  data[selectedId][field] = Number(el.value);
  render();
  await saveToCloud();
}

async function updateFieldFromSelect(el) {
  const field = el.dataset.field;
  data[selectedId][field] = Number(el.value);
  render();
  await loadFromCloud();
}

function handleInputKey(event, el) {
  if (event.key === "Enter") {
    event.preventDefault();
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();

    const inputs = Array.from(document.querySelectorAll("input"));
    const currentIndex = inputs.indexOf(el);
    const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;

    const field = el.dataset.field;
    data[selectedId][field] = Number(el.value);

    render();
    saveToCloud();

    setTimeout(() => {
      const newInputs = Array.from(document.querySelectorAll("input"));
      const nextInput = newInputs[nextIndex];

      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }, 0);
  }
}

render();
loadFromCloud();
