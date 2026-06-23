(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* Copia local de tarjetaHTML (no compartida con main.js) */
  function tarjetaHTML(p) {
    const stock = STOCK_INFO[p.stock];
    const colores = p.colores.map(c =>
      `<span style="background:${c.hex}" title="${c.nombre}"></span>`
    ).join("");

    const visualClass = p.imagen_url ? "lazy-bg" : claseFondo(p);
    const visualAttr = p.imagen_url ? `data-src="${p.imagen_url}"` : "";

    return `
      <article class="tarjeta" data-id="${p.id}" tabindex="0"
               role="button" aria-label="Ver ${p.nombre}">
        <div class="tarjeta-visual ${visualClass}" ${visualAttr}>
          <span class="tarjeta-stock ${p.stock}">${stock.badge}</span>
          <div class="tarjeta-mini-color">${colores}</div>
        </div>
        <div class="tarjeta-info">
          <span class="tarjeta-categoria">${ETIQUETAS[p.categoria].sing}</span>
          <h3 class="tarjeta-nombre">${p.nombre}</h3>
          <span class="tarjeta-precio">${formatearPrecio(p.precio)}</span>
        </div>
      </article>`;
  }

  function generarNav() {
    const mitad = Math.ceil(CATEGORIAS_CONFIG.length / 2);
    const izq = CATEGORIAS_CONFIG.slice(0, mitad);
    const der = CATEGORIAS_CONFIG.slice(mitad);

    const navA = c => `<a class="nav-link" href="index.html#cap-${c.id}">${c.labels.toUpperCase()}</a>`;

    $("#nav-left").innerHTML  = izq.map(navA).join("");
    $("#nav-right").innerHTML = der.map(navA).join("");
    $("#nav-mobile").innerHTML = CATEGORIAS_CONFIG.map(navA).join("");
  }

  function initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      $$(".lazy-bg").forEach(el => {
        el.style.backgroundImage = `url(${el.dataset.src})`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.removeAttribute("data-src");
      });
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        const src = el.dataset.src;
        if (src) {
          el.style.backgroundImage = `url(${src})`;
          el.style.backgroundSize = "cover";
          el.style.backgroundPosition = "center";
          el.removeAttribute("data-src");
        }
        obs.unobserve(el);
      }
    }, { rootMargin: "200px" });
    $$(".lazy-bg").forEach(el => obs.observe(el));
  }

  async function init() {
    try { await cargarDatos(); } catch (e) { console.error("Error al cargar datos:", e); return; }

    const params = new URLSearchParams(window.location.search);
    const catId = params.get("id");

    const config = CATEGORIAS_CONFIG.find(c => c.id === catId);
    if (!config) {
      $("#cat-titulo").textContent = "Categoría no encontrada";
      $("#cat-empty").hidden = false;
      return;
    }

    document.title = `SAVARA · ${config.labels}`;

    generarNav();

    /* Aplicar datos de tienda y tema */
    if (PAGINA.seccion_about_titulo) $("#about-titulo").textContent = PAGINA.seccion_about_titulo;
    if (PAGINA.seccion_about_texto)  $("#about-texto").textContent = PAGINA.seccion_about_texto;
    $("#t-direccion").textContent = TIENDA.direccion;
    $("#t-horario").textContent   = TIENDA.horario;
    $("#t-telefono").textContent  = TIENDA.telefono;
    $("#f-direccion").textContent = TIENDA.direccion;
    $("#f-horario").textContent   = TIENDA.horario;
    if (PAGINA.footer_desc)      $("#footer-desc").innerHTML = escapeHTML(PAGINA.footer_desc).replace(/\n/g, "<br />");
    if (PAGINA.footer_copyright) $("#footer-copyright").textContent = PAGINA.footer_copyright;
    ['instagram', 'facebook', 'tiktok', 'whatsapp'].forEach(red => {
      const url = PAGINA[`social_${red}`];
      const el = $(`#fs-${red}`);
      if (url) { el.href = url; el.hidden = false; }
      else { el.hidden = true; }
    });

    const vars = ["dorado", "dorado_claro", "marfil", "hueso", "tinta", "tinta_suave", "linea"];
    const cssVars = vars
      .map(v => {
        const val = PAGINA[`color_${v}`];
        return val ? `--${v.replace(/_/g, "-")}: ${val};` : "";
      })
      .filter(Boolean)
      .join("\n");
    const themeStyle = $("#theme-vars");
    if (themeStyle && cssVars) themeStyle.textContent = `:root { ${cssVars} }`;

    /* Poblar cabecera de categoría */
    const cover = $("#cap-categoria");
    cover.classList.add("visible");
    cover.dataset.categoria = config.id;
    $("#cat-numero").textContent = config.numero;
    $("#cat-titulo").textContent = config.labels;
    $("#cat-frase").textContent = PAGINA[`frase_${config.id}`] || "";

    /* Filtrar y renderizar productos */
    const productos = PRODUCTOS.filter(p => p.categoria === catId);
    const grid = $("#cat-grid");
    const vacio = $("#cat-empty");

    if (productos.length === 0) {
      vacio.hidden = false;
      return;
    }

    grid.innerHTML = productos.map(tarjetaHTML).join("");

    $$(".tarjeta", grid).forEach(t =>
      t.addEventListener("click", () => {
        location.href = `/producto.html?id=${t.dataset.id}`;
      })
    );

    initLazyLoading();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
