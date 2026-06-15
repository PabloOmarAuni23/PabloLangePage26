(function () {
  "use strict";

  const HIDDEN_SECTIONS = new Set(["sandwiches"]);

  function parseCsvLine(line) {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = !inQuotes;
      } else if ((ch === "," || ch === ";") && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  function parseCsv(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return [];
    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      const row = {};
      header.forEach((key, idx) => {
        row[key] = cells[idx] || "";
      });
      if (row.seccion_id || row.producto) rows.push(row);
    }
    return rows;
  }

  function formatPrice(raw) {
    const s = String(raw || "").trim();
    if (!s || /^consultar$/i.test(s)) {
      return { text: "Consultar", consultar: true };
    }
    const n = parseInt(s.replace(/\D/g, ""), 10);
    if (Number.isNaN(n)) return { text: s, consultar: false };
    return { text: "$" + n.toLocaleString("es-AR"), consultar: false };
  }

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }

  function truthy(val) {
    const s = String(val || "").toLowerCase().trim();
    return s === "si" || s === "sí" || s === "1" || s === "true";
  }

  function buildSections(rows) {
    const map = new Map();
    const order = [];

    rows.forEach((row) => {
      const id = row.seccion_id;
      if (!id) return;

      if (!map.has(id)) {
        map.set(id, {
          id,
          title: "",
          note: "",
          navLabel: "",
          grid2: false,
          accent: false,
          parGroup: "",
          items: [],
        });
        order.push(id);
      }

      const sec = map.get(id);
      const producto = (row.producto || "").trim();

      if (!producto) {
        if (row.titulo_seccion) sec.title = row.titulo_seccion;
        if (row.nota) sec.note = row.nota;
        if (row.nav_etiqueta) sec.navLabel = row.nav_etiqueta;
        if (truthy(row.dos_columnas)) sec.grid2 = false;
        if (truthy(row.linea_acento)) sec.accent = true;
        if (row.par_grupo) sec.parGroup = row.par_grupo.trim();
        return;
      }

      sec.items.push({
        name: producto,
        desc: (row.descripcion || "").trim(),
        price: formatPrice(row.precio),
        order: parseInt(row.orden, 10) || 999,
      });
    });

    order.forEach((id) => {
      const sec = map.get(id);
      sec.items.sort((a, b) => a.order - b.order);
      if (!sec.title) sec.title = id;
      if (!sec.navLabel) sec.navLabel = sec.title.split(" ")[0];
    });

    return order.map((id) => map.get(id)).filter((sec) => !HIDDEN_SECTIONS.has(sec.id));
  }

  function renderItem(item) {
    const priceClass = item.price.consultar ? " carta-item__price--consultar" : "";
    const desc = item.desc
      ? `<p class="carta-item__desc">${esc(item.desc)}</p>`
      : "";
    return `<article class="carta-item">
      <div class="carta-item__main">
        <h4 class="carta-item__name">${esc(item.name)}</h4>
        ${desc}
      </div>
      <span class="carta-item__price${priceClass}">${esc(item.price.text)}</span>
    </article>`;
  }

  function renderSection(sec) {
    const accent = sec.accent ? " carta-divider__line--accent" : "";
    const note = sec.note ? `<p class="carta-note">${esc(sec.note)}</p>` : "";
    const items = sec.items.map(renderItem).join("");
    return `<section id="${esc(sec.id)}" class="carta-block" aria-labelledby="tit-${esc(sec.id)}">
      <div class="carta-divider">
        <span class="carta-divider__line${accent}"></span>
        <h3 id="tit-${esc(sec.id)}" class="carta-section-title">${esc(sec.title)}</h3>
        <span class="carta-divider__line${accent}"></span>
      </div>
      ${note}
      <div class="carta-grid">${items}</div>
    </section>`;
  }

  function renderMenu(sections) {
    return sections.map(renderSection).join("");
  }

  async function loadCsvText() {
    const url = normalizeSheetCsvUrl(window.MENU_SHEET_CSV_URL || "");
    if (!url || url.includes("TU_ID_AQUI")) return null;
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(url + sep + "t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo leer la planilla");
    return res.text();
  }

  function normalizeSheetCsvUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    if (/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[^/]+\/export\?/i.test(raw)) {
      return raw;
    }

    if (/^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[^/]+\/pub\?/i.test(raw)) {
      return raw.includes("output=csv") ? raw : raw + (raw.includes("?") ? "&" : "?") + "output=csv";
    }

    const idOnly = raw.match(/^[a-zA-Z0-9_-]{20,}$/);
    const sheetUrl = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    const id = idOnly ? raw : sheetUrl ? sheetUrl[1] : "";
    if (!id) return raw;

    const gidMatch = raw.match(/[?#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    return 'data/menu-plantilla.csv';
  }

  async function loadFallbackCsv() {
    const res = await fetch("data/carta-plantilla.csv?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("Sin datos locales");
    return res.text();
  }

  async function initMenuFromSheet() {
    const root = document.getElementById("menu-content");
    const loading = document.getElementById("menu-loading");
    if (!root) return;

    let csvText = null;
    let source = "local";

    try {
      csvText = await loadCsvText();
      if (csvText) source = "sheet";
    } catch (e) {
      console.warn("Planilla online:", e);
    }

    if (!csvText) {
      try {
        csvText = await loadFallbackCsv();
        source = "local";
      } catch (e) {
        console.warn("Fallback local:", e);
        if (loading) {
          loading.textContent =
            "No se pudo cargar la carta. Revisá la planilla de Google o la conexión.";
        }
        return;
      }
    }

    const rows = parseCsv(csvText);
    const sections = buildSections(rows);
    const photos = root.querySelector(".carta-photos");
    const photosHtml = photos ? photos.outerHTML : "";

    root.innerHTML =
      photosHtml +
      renderMenu(sections) +
      (source === "sheet"
        ? ""
        : '<p class="carta-sync-hint no-print">Conectá tu planilla de Google en js/config.js para actualizar precios sin subir la web.</p>');

    if (loading) loading.remove();

    window.__menuReady = true;
    document.dispatchEvent(new CustomEvent("menu:rendered", { detail: { sections, source } }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMenuFromSheet);
  } else {
    initMenuFromSheet();
  }
})();
