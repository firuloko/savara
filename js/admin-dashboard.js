/* ==========================================================================
   SAVARA · Dashboard
   ========================================================================== */
(function () {
  "use strict";

  async function init() {
    if (!checkAuth()) return;

    try {
      await cargarDatos();
    } catch (e) {
      mostrarToast("Error al cargar datos: " + e.message, false);
      return;
    }

    try {
      const stats = await cargarDashboard();
      const cards = $$("#d-cards .d-card-num");
      if (cards.length >= 4) {
        cards[0].textContent = stats.total;
        cards[1].textContent = stats.stockBajo;
        cards[2].textContent = stats.stockAgotado;
        cards[3].textContent = stats.categorias.length;
      }
    } catch (e) {
      mostrarToast("Error al cargar dashboard: " + e.message, false);
    }

    try {
      const actividad = await cargarActividad();
      const lista = $("#actividad-lista");
      if (actividad.length === 0) {
        lista.innerHTML = '<div class="actividad-item" style="justify-content:center;color:var(--tinta-suave);">Sin actividad aún</div>';
      } else {
        lista.innerHTML = actividad.map(a => {
          const fecha = new Date(a.fecha);
          const fechaStr = fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
          const labels = {
            producto_creado: "Producto creado",
            producto_editado: "Producto editado",
            producto_eliminado: "Producto eliminado",
            producto_duplicado: "Producto duplicado",
            productos_importados: "Productos importados",
            pagina_actualizada: "Página actualizada"
          };
          return `<div class="actividad-item"><span><strong class="actividad-accion">${labels[a.accion] || a.accion}</strong> ${a.detalle}</span><span class="actividad-fecha">${fechaStr}</span></div>`;
        }).join("");
      }
    } catch (e) {
      /* silencioso */
    }

    $("#btn-logout").addEventListener("click", logout);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
