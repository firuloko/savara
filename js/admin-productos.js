/* ==========================================================================
   SAVARA · Productos — listado con búsqueda, duplicar, exportar, importar
   ========================================================================== */
(function () {
  "use strict";

  let filtro = "";

  async function init() {
    if (!checkAuth()) return;

    try {
      await cargarDatos();
    } catch (e) {
      mostrarToast("Error al cargar datos: " + e.message, false);
      return;
    }

    renderTabla();

    $("#btn-logout").addEventListener("click", logout);

    /* Búsqueda en vivo */
    $("#buscar-producto").addEventListener("input", (e) => {
      filtro = e.target.value.toLowerCase().trim();
      renderTabla();
    });

    /* Exportar */
    $("#btn-exportar").addEventListener("click", exportarProductosHandler);

    /* Importar */
    $("#btn-importar").addEventListener("click", () => $("#file-importar").click());
    $("#file-importar").addEventListener("change", importarProductosHandler);
  }

  function renderTabla() {
    const tbody = $("#tbody-productos");
    const empty = $("#empty-productos");

    const lista = filtro
      ? PRODUCTOS.filter(p =>
          p.id.toLowerCase().includes(filtro) ||
          p.nombre.toLowerCase().includes(filtro) ||
          (ETIQUETAS[p.categoria]?.sing || "").toLowerCase().includes(filtro)
        )
      : PRODUCTOS;

    if (lista.length === 0) {
      tbody.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    tbody.innerHTML = lista.map(p => {
      const stockInfo = STOCK_INFO[p.stock];
      const coloresHTML = p.colores.map(c =>
        `<span style="background:${c.hex}" title="${c.nombre}"></span>`
      ).join("");
      const tallasHTML = p.tallas.join(", ");

      return `
        <tr>
          <td>${p.id}</td>
          <td><strong>${p.nombre}</strong></td>
          <td>${ETIQUETAS[p.categoria]?.sing || p.categoria}</td>
          <td>${formatearPrecio(p.precio)}</td>
          <td><span class="stock-badge ${p.stock}">${stockInfo.badge}</span></td>
          <td><div class="mini-colores">${coloresHTML}</div></td>
          <td style="font-size:12px;">${tallasHTML}</td>
          <td>
            <div class="admin-acciones">
              <a href="/admin/producto.html?id=${p.id}" class="admin-btn-sm editar">Editar</a>
              <button class="admin-btn-sm duplicar" data-id="${p.id}">Duplicar</button>
              <button class="admin-btn-sm eliminar" data-id="${p.id}">Eliminar</button>
            </div>
          </td>
        </tr>`;
    }).join("");

    $$(".admin-btn-sm.eliminar", tbody).forEach(btn =>
      btn.addEventListener("click", () => eliminarProducto(btn.dataset.id))
    );
    $$(".admin-btn-sm.duplicar", tbody).forEach(btn =>
      btn.addEventListener("click", () => duplicarProductoHandler(btn.dataset.id))
    );
  }

  async function eliminarProducto(id) {
    const p = productoPorId(id);
    if (!p) return;
    const ok = await mostrarModalConfirm("Eliminar producto", `¿Eliminar "${p.nombre}" permanentemente?`);
    if (!ok) return;
    try {
      await eliminarProductoAPI(id);
      renderTabla();
      mostrarToast("Producto eliminado");
    } catch (e) {
      mostrarToast("Error al eliminar: " + e.message, false);
    }
  }

  async function duplicarProductoHandler(id) {
    try {
      const data = await duplicarProducto(id);
      renderTabla();
      mostrarToast(`Duplicado como ${data.id}`);
    } catch (e) {
      mostrarToast("Error al duplicar: " + e.message, false);
    }
  }

  async function exportarProductosHandler() {
    try {
      const data = await exportarProductos();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `savara-productos-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      mostrarToast("Exportación completada");
    } catch (e) {
      mostrarToast("Error al exportar: " + e.message, false);
    }
  }

  async function importarProductosHandler(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const texto = await file.text();
      const productos = JSON.parse(texto);
      if (!Array.isArray(productos)) throw new Error("El archivo debe contener un array");
      const total = productos.length;
      const ok = await mostrarModalConfirm("Importar productos", `Se importarán ${total} producto(s). ¿Continuar?`);
      if (!ok) { e.target.value = ""; return; }
      const res = await importarProductos(productos);
      await cargarDatos();
      renderTabla();
      mostrarToast(`${res.count} producto(s) importados`);
    } catch (err) {
      mostrarToast("Error al importar: " + err.message, false);
    }
    e.target.value = "";
  }

  document.addEventListener("DOMContentLoaded", init);
})();
