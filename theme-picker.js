/* =========================================================
   Pusulapp — Renk Teması Seçici
   Sadece görünüm: kendi ayrı anahtarını kullanır
   (pusulapp_renk_temasi). Planlayıcı verisine dokunmaz.
   ========================================================= */
(function () {
  var KEY = "pusulapp_renk_temasi";
  var root = document.documentElement;

  // modern: aynı paletin "Modern" görünümdeki (açık, pastel) vurgu rengi — modern.css ile aynı
  var PALETTES = [
    { id: "pusula", name: "Pusula", color: "#3f6cc4", modern: "#c4bcf8" },
    { id: "gece", name: "Gece", color: "#6068f0", modern: "#a9b6ff" },
    { id: "kil", name: "Kil", color: "#c8794f", modern: "#f2b48f" },
    { id: "orman", name: "Orman", color: "#5f8f6a", modern: "#93dbb0" },
    { id: "erik", name: "Erik", color: "#9a6b9c", modern: "#e5a8e3" },
    { id: "grafit", name: "Grafit", color: "#8a8780", modern: "#cfccd8" }
  ];

  // Görünüm stili: "modern" (varsayılan) | "geleneksel" (önceki görünüm).
  // Renk paleti ve açık/koyu tercihinden bağımsız bir eksen.
  var STYLES = ["modern", "geleneksel"];
  function currentStyle() {
    return STYLES.indexOf(pref.style) >= 0 ? pref.style : "modern";
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) || {};
    } catch (e) {}
    return {};
  }

  function save(pref) {
    try { localStorage.setItem(KEY, JSON.stringify(pref)); } catch (e) {}
  }

  function hexToRgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function shade(rgb, amt) {
    return "rgb(" + rgb.map(function (v) {
      return Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    }).join(", ") + ")";
  }

  var CUSTOM_PROPS = ["--accent-rgb", "--accent-primary", "--accent-primary-hover",
    "--accent-text", "--accent-soft", "--border-focus", "--accent-on", "--m-fill"];

  function apply(pref) {
    var palette = pref.palette || "pusula";
    CUSTOM_PROPS.forEach(function (p) { root.style.removeProperty(p); });
    if (palette === "ozel" && pref.custom) {
      var rgb = hexToRgb(pref.custom);
      root.style.setProperty("--accent-rgb", rgb.join(", "));
      root.style.setProperty("--accent-primary", pref.custom);
      root.style.setProperty("--accent-primary-hover", shade(rgb, -0.12));
      root.style.setProperty("--accent-text", root.getAttribute("data-theme") === "light" ? shade(rgb, -0.1) : shade(rgb, 0.2));
      root.style.setProperty("--accent-soft", "rgba(" + rgb.join(", ") + ", 0.13)");
      root.style.setProperty("--border-focus", pref.custom);
      // Dolu düğme yazısı: açık renklerde koyu, koyu renklerde beyaz
      var lum = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      lum = 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
      root.style.setProperty("--accent-on", lum > 0.22 ? "#17140f" : "#ffffff");
      // Modern + açık: dolgu seçilen renkte kalır (--m-fill), yazı/çizgi tonu
      // açık renklerde okunur olsun diye koyulaştırılır.
      if (pref.style !== "geleneksel" && root.getAttribute("data-theme") === "light") {
        var deep = shade(rgb, lum > 0.5 ? -0.6 : lum > 0.25 ? -0.45 : lum > 0.12 ? -0.25 : 0);
        root.style.setProperty("--m-fill", pref.custom);
        root.style.setProperty("--accent-primary", deep);
        root.style.setProperty("--accent-text", deep);
        root.style.setProperty("--border-focus", deep);
      }
    }
    root.setAttribute("data-palette", palette);
    root.setAttribute("data-style", STYLES.indexOf(pref.style) >= 0 ? pref.style : "modern");
  }

  var pref = load();
  apply(pref); // sayfa çizilmeden önce uygula (renk sıçraması olmasın)

  // Açık/koyu değişince özel rengin metin tonunu yeniden hesapla
  new MutationObserver(function () {
    if ((pref.palette || "pusula") === "ozel") apply(pref);
    syncModeButtons();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  var panel, btn;

  function syncModeButtons() {
    if (!panel) return;
    var light = root.getAttribute("data-theme") === "light";
    panel.querySelectorAll("[data-mode]").forEach(function (b) {
      b.classList.toggle("is-active", (b.getAttribute("data-mode") === "light") === light);
    });
  }

  function syncSwatches() {
    if (!panel) return;
    var current = pref.palette || "pusula";
    var modern = currentStyle() === "modern";
    panel.querySelectorAll("[data-palette-id]").forEach(function (s) {
      s.classList.toggle("is-active", s.getAttribute("data-palette-id") === current);
    });
    // Nokta renkleri seçili görünümdeki gerçek vurgu rengini göstersin
    PALETTES.forEach(function (p) {
      var dot = panel.querySelector('[data-palette-id="' + p.id + '"] .tp-dot');
      if (dot) dot.style.background = modern ? p.modern : p.color;
    });
    var c = panel.querySelector("#tpCustomColor");
    if (c && pref.custom) c.value = pref.custom;
  }

  function syncStyleButtons() {
    if (!panel) return;
    var s = currentStyle();
    panel.querySelectorAll("[data-style-opt]").forEach(function (b) {
      var on = b.getAttribute("data-style-opt") === s;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function choose(id, custom) {
    pref = { palette: id, custom: custom || pref.custom, style: pref.style };
    save(pref);
    apply(pref);
    syncSwatches();
  }

  function setStyle(style) {
    if (STYLES.indexOf(style) < 0) return;
    pref = { palette: pref.palette, custom: pref.custom, style: style };
    save(pref);
    apply(pref);
    syncStyleButtons();
    syncSwatches();
  }

  function setMode(mode) {
    var isLight = root.getAttribute("data-theme") === "light";
    if ((mode === "light") !== isLight) {
      // Uygulamanın kendi düğmesini kullan: tercih her zamanki gibi kaydedilir
      var t = document.getElementById("btnThemeToggle");
      if (t) t.click();
    }
  }

  function open() {
    panel.hidden = false;
    var r = btn.getBoundingClientRect();
    panel.style.left = Math.max(8, r.left) + "px";
    panel.style.bottom = Math.max(8, window.innerHeight - r.top + 8) + "px";
    btn.setAttribute("aria-expanded", "true");
    syncModeButtons();
    syncStyleButtons();
    syncSwatches();
  }

  function close() {
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }

  function build() {
    var footer = document.querySelector(".sidebar-footer");
    if (!footer) return;

    var row = document.createElement("div");
    row.className = "tp-row";
    row.innerHTML =
      '<button type="button" class="tp-trigger" id="btnPalettePicker" title="Renk Teması" aria-haspopup="dialog" aria-expanded="false">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.2-4-7.7-9-7.7z"/>' +
      '<circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7.2" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/></svg>' +
      "<span>Temalar</span></button>";
    footer.appendChild(row);
    btn = row.querySelector("button");

    panel = document.createElement("div");
    panel.className = "tp-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Renk teması seç");
    panel.hidden = true;

    var swatches = PALETTES.map(function (p) {
      return '<button type="button" class="tp-swatch" data-palette-id="' + p.id + '" title="' + p.name + '">' +
        '<span class="tp-dot" style="background:' + p.color + '"></span><span class="tp-name">' + p.name + "</span></button>";
    }).join("");

    panel.innerHTML =
      '<div class="tp-head" id="tpStyleHead">Görünüm</div>' +
      '<div class="tp-modes tp-styles" role="group" aria-labelledby="tpStyleHead">' +
      '<button type="button" class="tp-mode" data-style-opt="modern" aria-pressed="false">Modern</button>' +
      '<button type="button" class="tp-mode" data-style-opt="geleneksel" aria-pressed="false">Geleneksel</button>' +
      "</div>" +
      '<div class="tp-head">Açık / Koyu</div>' +
      '<div class="tp-modes">' +
      '<button type="button" class="tp-mode" data-mode="dark">Koyu</button>' +
      '<button type="button" class="tp-mode" data-mode="light">Açık</button>' +
      "</div>" +
      '<div class="tp-head">Renk</div>' +
      '<div class="tp-grid">' + swatches + "</div>" +
      '<label class="tp-swatch tp-custom" data-palette-id="ozel" title="Kendi rengini seç">' +
      '<input type="color" id="tpCustomColor" value="' + (pref.custom || "#3f6cc4") + '" />' +
      '<span class="tp-name">Özel renk</span></label>';

    document.body.appendChild(panel);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.hidden ? open() : close();
    });
    panel.addEventListener("click", function (e) {
      e.stopPropagation();
      var st = e.target.closest("[data-style-opt]");
      if (st) return setStyle(st.getAttribute("data-style-opt"));
      var m = e.target.closest("[data-mode]");
      if (m) return setMode(m.getAttribute("data-mode"));
      var s = e.target.closest(".tp-grid [data-palette-id]");
      if (s) choose(s.getAttribute("data-palette-id"));
    });
    var colorInput = panel.querySelector("#tpCustomColor");
    colorInput.addEventListener("input", function () { choose("ozel", colorInput.value); });
    document.addEventListener("click", function () { if (!panel.hidden) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
