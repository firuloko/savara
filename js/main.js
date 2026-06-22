/* ==========================================================================
   SAVARA · Lógica del mostrario digital
   --------------------------------------------------------------------------
   · Filtrado por categoría (MUJER | HOMBRE | INFANTIL | ACCESORIOS)
   · Renderizado del catálogo en grilla editorial
   · Cada producto abre una ficha completa en /producto.html
   ========================================================================== */

(function () {
  "use strict";

  /* -------------------------- Utilidades ------------------------------ */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ====================================================================
     RENDERIZADO DEL CATÁLOGO
     ==================================================================== */
  let categoriaActiva = null;

  function renderCatalogo(categoria) {
    categoriaActiva = categoria || null;
    const grid   = $("#grid-productos");
    const vacio  = $("#catalogo-empty");
    const titulo = $("#cat-titulo");
    const eyebrow= $("#cat-eyebrow");

    const lista = categoria
      ? PRODUCTOS.filter(p => p.categoria === categoria)
      : PRODUCTOS;

    if (categoria && ETIQUETAS[categoria]) {
      eyebrow.textContent = ETIQUETAS[categoria].eyebrow;
      titulo.textContent  = ETIQUETAS[categoria].sing;
    } else {
      eyebrow.textContent = "CATÁLOGO";
      titulo.textContent  = "Todos los productos";
    }

    $$(".nav-link").forEach(b => {
      b.classList.toggle("activo", b.dataset.categoria === categoria);
    });

    grid.innerHTML = lista.map(tarjetaHTML).join("");
    vacio.hidden = lista.length > 0;

    $$(".tarjeta", grid).forEach(t =>
      t.addEventListener("click", () => {
        location.href = `/producto.html?id=${t.dataset.id}`;
      })
    );

    if ('IntersectionObserver' in window) {
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
      $$(".lazy-bg", grid).forEach(el => obs.observe(el));
    } else {
      $$(".lazy-bg", grid).forEach(el => {
        el.style.backgroundImage = `url(${el.dataset.src})`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.removeAttribute("data-src");
      });
    }
  }

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

  /* ====================================================================
     NAVEGACIÓN
     ==================================================================== */
  function irACatalogo(categoria) {
    renderCatalogo(categoria || null);
    $("#catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ====================================================================
     INICIALIZACIÓN
     ==================================================================== */
  async function init() {
    try { await cargarDatos(); } catch (e) { console.error("Error al cargar datos:", e); return; }

    /* ---- Aplicar contenido dinámico desde PAGINA ---- */
    /* Colores del tema */
    const vars = [
      "dorado", "dorado_claro", "marfil", "hueso",
      "tinta", "tinta_suave", "linea"
    ];
    const cssVars = vars
      .map(v => {
        const val = PAGINA[`color_${v}`];
        return val ? `--${v.replace(/_/g, "-")}: ${val};` : "";
      })
      .filter(Boolean)
      .join("\n");
    const themeStyle = $("#theme-vars");
    if (themeStyle && cssVars) themeStyle.textContent = `:root { ${cssVars} }`;

    /* Hero */
    if (PAGINA.hero_eyebrow)  $("#hero-eyebrow").textContent = PAGINA.hero_eyebrow;
    if (PAGINA.hero_titulo)   $("#hero-title").innerHTML = PAGINA.hero_titulo.replace(/\n/g, "<br />");
    if (PAGINA.hero_subtitulo) $("#hero-subtitle").textContent = PAGINA.hero_subtitulo;
    if (PAGINA.hero_cta)      $("#hero-cta").textContent = PAGINA.hero_cta;
    if (PAGINA.hero_nota)     $("#hero-nota").textContent = PAGINA.hero_nota;

    /* Sección Tienda Física */
    if (PAGINA.seccion_about_titulo) $("#about-titulo").textContent = PAGINA.seccion_about_titulo;
    if (PAGINA.seccion_about_texto)  $("#about-texto").textContent = PAGINA.seccion_about_texto;

    /* Footer */
    if (PAGINA.footer_desc)      $("#footer-desc").innerHTML = PAGINA.footer_desc.replace(/\n/g, "<br />");
    if (PAGINA.footer_copyright) $("#footer-copyright").textContent = PAGINA.footer_copyright;

    /* ---- Tienda info ---- */
    $("#t-direccion").textContent = TIENDA.direccion;
    $("#t-horario").textContent   = TIENDA.horario;
    $("#t-telefono").textContent  = TIENDA.telefono;
    $("#f-direccion").textContent = TIENDA.direccion;
    $("#f-horario").textContent   = TIENDA.horario;

    /* ---- Redes Sociales ---- */
    ['instagram', 'facebook', 'tiktok', 'whatsapp'].forEach(red => {
      const url = PAGINA[`social_${red}`];
      const el = $(`#fs-${red}`);
      if (url) { el.href = url; el.hidden = false; }
      else { el.hidden = true; }
    });

    renderCatalogo(null);

    $$("[data-categoria]").forEach(el =>
      el.addEventListener("click", () => irACatalogo(el.dataset.categoria))
    );

    $("#logo").addEventListener("click", (e) => {
      e.preventDefault();
      renderCatalogo(null);
      $("#top").scrollIntoView({ behavior: "smooth" });
    });
    $("#btn-ver-todo").addEventListener("click", () => irACatalogo(null));

    $("#hero-cta").addEventListener("click", () => irACatalogo(null));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
