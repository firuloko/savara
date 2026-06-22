(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  let toastTimer = null;
  function mostrarToast(mensaje) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add("activo");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("activo"), 3200);
  }

  const estado = { color: null, talla: null };

  function renderProducto(p) {
    document.title = `SAVARA · ${p.nombre}`;

    /* Imagen */
    const visual = $("#p-visual");
    if (p.imagen_url) {
      visual.style.backgroundImage = `url(${p.imagen_url})`;
      visual.style.backgroundSize = "cover";
      visual.style.backgroundPosition = "center";
    } else {
      visual.className = "producto-visual " + claseFondo(p);
    }

    /* Info */
    $("#p-categoria").textContent  = ETIQUETAS[p.categoria]?.eyebrown || p.categoria.toUpperCase();
    $("#p-nombre").textContent     = p.nombre;
    $("#p-descripcion").textContent= p.descripcion;
    $("#p-precio").textContent     = formatearPrecio(p.precio);

    estado.color = p.colores[0]?.nombre || null;
    estado.talla = null;

    /* Colores */
    const coloresBox = $("#p-colores");
    coloresBox.innerHTML = p.colores.map((c, i) =>
      `<button class="color-swatch${i === 0 ? " seleccionado" : ""}"
               style="background:${c.hex}"
               data-color="${c.nombre}"
               title="${c.nombre}"
               aria-label="Color ${c.nombre}"></button>`
    ).join("");
    $("#p-color-elegido").textContent = estado.color;
    $$(".color-swatch", coloresBox).forEach(sw =>
      sw.addEventListener("click", () => {
        estado.color = sw.dataset.color;
        $$(".color-swatch", coloresBox).forEach(s =>
          s.classList.toggle("seleccionado", s === sw));
        $("#p-color-elegido").textContent = estado.color;
      })
    );

    /* Tallas */
    const tallasBox = $("#p-tallas");
    tallasBox.innerHTML = p.tallas.map(t =>
      `<button class="talla-opt" data-talla="${t}">${t}</button>`
    ).join("");
    $$(".talla-opt", tallasBox).forEach(op =>
      op.addEventListener("click", () => {
        estado.talla = op.dataset.talla;
        $$(".talla-opt", tallasBox).forEach(o =>
          o.classList.toggle("seleccionado", o === op));
      })
    );

    /* Disponibilidad */
    const stock = STOCK_INFO[p.stock];
    const badge = $("#p-disp-badge");
    badge.className = "disp-badge " + p.stock;
    badge.textContent = stock.badge;
    $("#p-disp-mensaje").textContent = stock.mensaje;

    /* Botón reservar */
    $("#p-btn-reservar").addEventListener("click", () => {
      mostrarToast(
        `Acércate a ${TIENDA.nombre} o escríbenos al ${TIENDA.telefono} para reservar tu par.`
      );
    });

    /* Redes Sociales */
    ['instagram', 'facebook', 'tiktok', 'whatsapp'].forEach(red => {
      const url = PAGINA[`social_${red}`];
      const el = $(`#pf-${red}`);
      if (url) { el.href = url; el.hidden = false; }
      else { el.hidden = true; }
    });

    /* Aplicar tema */
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

  async function init() {
    try { await cargarDatos(); } catch (e) { console.error("Error al cargar datos:", e); return; }

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      window.location.href = "/";
      return;
    }

    const p = productoPorId(id);
    if (!p) {
      window.location.href = "/";
      return;
    }

    renderProducto(p);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
