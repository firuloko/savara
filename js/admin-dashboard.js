/* ==========================================================================
   SAVARA · Dashboard
   ========================================================================== */
(function () {
  "use strict";

  function renderCatChart(categorias, total) {
    const container = $("#cat-chart-bars");
    if (!categorias || categorias.length === 0) {
      container.innerHTML = '<p style="color:var(--tinta-suave);font-size:13px;">No hay productos en ninguna categoría.</p>';
      return;
    }
    container.innerHTML = categorias.map(c => {
      const pct = total > 0 ? (c.c / total * 100) : 0;
      const label = ETIQUETAS[c.categoria]?.sing || c.categoria;
      const catClass = c.categoria;
      return `
        <div class="cat-bar-row">
          <span class="cat-bar-label">${label}</span>
          <div class="cat-bar-track">
            <div class="cat-bar-fill ${catClass}" style="width:${Math.max(pct, 5)}%;">${c.c}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderActividad(actividad) {
    const lista = $("#actividad-lista");
    if (!actividad || actividad.length === 0) {
      lista.innerHTML = '<div class="actividad-item" style="justify-content:center;color:var(--tinta-suave);">Sin actividad aún</div>';
      return;
    }
    const labels = {
      producto_creado:    { texto: "Producto creado",    badge: "creado" },
      producto_editado:   { texto: "Producto editado",   badge: "editado" },
      producto_eliminado: { texto: "Producto eliminado", badge: "eliminado" },
      producto_duplicado: { texto: "Producto duplicado", badge: "creado" },
      productos_importados: { texto: "Productos importados", badge: "importado" },
      pagina_actualizada: { texto: "Página actualizada", badge: "editado" },
      password_cambiado:  { texto: "Contraseña cambiada", badge: "editado" },
    };
    lista.innerHTML = actividad.map(a => {
      const info = labels[a.accion] || { texto: a.accion, badge: "" };
      return `
        <div class="actividad-item">
          <span>
            <span class="actividad-badge ${info.badge}">${info.texto}</span>
            ${a.detalle}
          </span>
          <span class="actividad-fecha">${formatearFecha(a.fecha)}</span>
        </div>
      `;
    }).join("");
  }

  async function init() {
    if (!checkAuth()) return;

    $("#admin-greeting").textContent = `${obtenerGreeting()}, administrador. Aquí tienes un resumen de tu tienda.`;

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
      renderCatChart(stats.categorias, stats.total);
    } catch (e) {
      mostrarToast("Error al cargar dashboard: " + e.message, false);
    }

    try {
      const actividad = await cargarActividad();
      renderActividad(actividad);
    } catch (e) {
      /* silencioso */
    }

    $("#btn-logout").addEventListener("click", logout);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
