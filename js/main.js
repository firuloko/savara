(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ==================================================================
     GENERADOR DE NAVEGACIÓN
     ================================================================== */
  function generarNav() {
    const mitad = Math.ceil(CATEGORIAS_CONFIG.length / 2);
    const izq = CATEGORIAS_CONFIG.slice(0, mitad);
    const der = CATEGORIAS_CONFIG.slice(mitad);

    const navBtn = c => `<button class="nav-link" data-scroll="#cap-${c.id}">${c.labels.toUpperCase()}</button>`;

    $("#nav-left").innerHTML  = izq.map(navBtn).join("");
    $("#nav-right").innerHTML = der.map(navBtn).join("");
    $("#nav-mobile").innerHTML = CATEGORIAS_CONFIG.map(navBtn).join("");
  }

  /* ==================================================================
     GENERADOR DE SECCIONES (data-driven desde CATEGORIAS_CONFIG)
     ================================================================== */
  function generarSecciones() {
    const revista = $("#revista");
    revista.innerHTML = CATEGORIAS_CONFIG.map(c => `
      <section class="capitulo" id="cap-${c.id}" data-categoria="${c.id}">
        <div class="cap-cover">
          <span class="cap-numero">${c.numero}</span>
          <h2 class="cap-titulo">${c.labels}</h2>
          <p class="cap-frase" id="frase-${c.id}"></p>
        </div>
        <div class="grid-productos" data-categoria="${c.id}"></div>
        <a class="ver-todo" href="categoria.html?id=${c.id}">Ver todo en ${c.labels} →</a>
        <p class="catalogo-empty" hidden>No hay productos en esta sección.</p>
      </section>
    `).join("");
  }

  /* ==================================================================
     TARJETA DE PRODUCTO
     ================================================================== */
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

  /* ==================================================================
     RENDERIZAR PRODUCTOS POR SECCIÓN
     ================================================================== */
  function renderSecciones() {
    CATEGORIAS_CONFIG.forEach(c => {
      const productos = PRODUCTOS.filter(p => p.categoria === c.id);
      const limitados = productos.slice(0, PRODUCTOS_POR_SECCION);
      const grid = document.querySelector(`#cap-${c.id} .grid-productos`);
      const vacio = document.querySelector(`#cap-${c.id} .catalogo-empty`);
      const verTodo = document.querySelector(`#cap-${c.id} .ver-todo`);
      grid.innerHTML = limitados.map(tarjetaHTML).join("");
      if (vacio) vacio.hidden = productos.length > 0;
      if (verTodo) verTodo.hidden = productos.length <= PRODUCTOS_POR_SECCION;

      $$(".tarjeta", grid).forEach(t =>
        t.addEventListener("click", () => {
          location.href = `/producto.html?id=${t.dataset.id}`;
        })
      );
    });
  }

  /* ==================================================================
     LAZY LOADING DE IMÁGENES
     ================================================================== */
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

  /* ==================================================================
     ANIMACIONES AL SCROLL (IntersectionObserver)
     ================================================================== */
  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
      $$(".capitulo").forEach(el => el.classList.add("visible"));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          const id = e.target.id;
          $$(".nav-link").forEach(b => {
            b.classList.toggle("activo", b.dataset.scroll === `#${id}`);
          });
        }
      }
    }, { threshold: 0.15 });
    $$(".capitulo").forEach(el => obs.observe(el));
  }

  /* ==================================================================
     NAVEGACIÓN POR SCROLL
     ================================================================== */
  function initNavClicks() {
    $$("[data-scroll]").forEach(el => {
      el.addEventListener("click", () => {
        const target = document.querySelector(el.dataset.scroll);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    $("#hero-cta").addEventListener("click", () => {
      const first = CATEGORIAS_CONFIG[0];
      const target = document.querySelector(`#cap-${first.id}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#logo").addEventListener("click", (e) => {
      e.preventDefault();
      $("#top").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ==================================================================
     APLICAR CONTENIDO DINÁMICO (tema, hero, tienda, footer, sociales)
     ================================================================== */
  function aplicarTema() {
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
  }

  function aplicarHero() {
    if (PAGINA.hero_eyebrow)   $("#hero-eyebrow").textContent = PAGINA.hero_eyebrow;
    if (PAGINA.hero_titulo)    $("#hero-title").innerHTML = escapeHTML(PAGINA.hero_titulo).replace(/\n/g, "<br />");
    if (PAGINA.hero_subtitulo) $("#hero-subtitle").textContent = PAGINA.hero_subtitulo;
    if (PAGINA.hero_cta)       $("#hero-cta").textContent = PAGINA.hero_cta;
    if (PAGINA.hero_nota)      $("#hero-nota").textContent = PAGINA.hero_nota;
  }

  function aplicarTienda() {
    if (PAGINA.seccion_about_titulo) $("#about-titulo").textContent = PAGINA.seccion_about_titulo;
    if (PAGINA.seccion_about_texto)  $("#about-texto").textContent = PAGINA.seccion_about_texto;
    $("#t-direccion").textContent = TIENDA.direccion;
    $("#t-horario").textContent   = TIENDA.horario;
    $("#t-telefono").textContent  = TIENDA.telefono;
    $("#f-direccion").textContent = TIENDA.direccion;
    $("#f-horario").textContent   = TIENDA.horario;
  }

  function aplicarFooter() {
    if (PAGINA.footer_desc)      $("#footer-desc").innerHTML = escapeHTML(PAGINA.footer_desc).replace(/\n/g, "<br />");
    if (PAGINA.footer_copyright) $("#footer-copyright").textContent = PAGINA.footer_copyright;
  }

  function aplicarRedes() {
    ['instagram', 'facebook', 'tiktok', 'whatsapp'].forEach(red => {
      const url = PAGINA[`social_${red}`];
      const el = $(`#fs-${red}`);
      if (url) { el.href = url; el.hidden = false; }
      else { el.hidden = true; }
    });
  }

  function aplicarFrases() {
    CATEGORIAS_CONFIG.forEach(c => {
      const el = $(`#frase-${c.id}`);
      if (el) el.textContent = PAGINA[`frase_${c.id}`] || "";
    });
  }

  /* ==================================================================
     INIT
     ================================================================== */
  async function init() {
    try { await cargarDatos(); } catch (e) { console.error("Error al cargar datos:", e); return; }

    aplicarTema();
    aplicarHero();
    aplicarTienda();
    aplicarFooter();
    aplicarRedes();

    generarNav();
    generarSecciones();
    aplicarFrases();
    renderSecciones();

    initLazyLoading();
    initScrollAnimations();
    initNavClicks();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
