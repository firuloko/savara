(function () {
  "use strict";

  let editId = null;

  function obtenerIdDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || null;
  }

  function actualizarPreview(src) {
    const preview = $("#fp-imagen-preview");
    if (src) {
      preview.innerHTML = `<img src="${src}" style="max-width:200px;max-height:200px;border:1px solid var(--linea);border-radius:4px;" />`;
    } else {
      preview.innerHTML = "";
    }
  }

  function actualizarPreviewCard() {
    const nombre = $("#fp-nombre").value.trim() || "Nombre del producto";
    const categoria = $("#fp-categoria").value;
    const precio = parseInt($("#fp-precio").value, 10) || 0;
    const imagenId = $("#fp-imagen-id").value.trim();
    const imagenUrl = $("#fp-imagen-url").value.trim();

    $("#preview-nombre").textContent = nombre;
    $("#preview-categoria").textContent = ETIQUETAS[categoria]?.eyebrown || "CATEGORÍA";
    $("#preview-precio").textContent = formatearPrecio(precio);

    const visual = $("#preview-visual");
    if (imagenUrl) {
      visual.style.backgroundImage = `url(${imagenUrl})`;
      visual.style.backgroundSize = "cover";
      visual.style.backgroundPosition = "center";
      visual.className = "preview-visual";
    } else if (imagenId) {
      visual.style.backgroundImage = "";
      visual.className = "preview-visual bg-" + imagenId;
    } else {
      visual.style.backgroundImage = "";
      visual.className = "preview-visual";
      visual.style.background = "var(--hueso)";
    }
  }

  /* ================================================================
     FILA DE COLOR CON IMAGEN
     ================================================================ */
  function agregarFilaColor(hex, nombre, imagenUrl) {
    const cont = $("#fp-colores-container");
    const div = document.createElement("div");
    div.className = "fp-color-row";
    div.innerHTML = `
      <input type="color" class="fp-color-hex" value="${hex || "#1a1a1a"}" />
      <input type="text" class="fp-color-nombre" placeholder="Nombre color" value="${nombre || ""}" />
      <div class="fp-color-img">
        <input type="file" class="fp-color-img-file" accept="image/*" hidden />
        <button type="button" class="fp-color-img-btn" title="Imagen para este color">+</button>
        <div class="fp-color-img-preview" style="${imagenUrl ? `background-image:url(${imagenUrl})` : ""}">
          <span class="fp-color-img-remove">&times;</span>
        </div>
        <input type="hidden" class="fp-color-img-url" value="${imagenUrl || ""}" />
      </div>
      <button type="button" class="fp-remove-row" title="Quitar color">&times;</button>
    `;
    cont.appendChild(div);

    const btnImg = div.querySelector(".fp-color-img-btn");
    const fileInput = div.querySelector(".fp-color-img-file");
    const preview = div.querySelector(".fp-color-img-preview");
    const imgRemove = div.querySelector(".fp-color-img-remove");
    const urlHidden = div.querySelector(".fp-color-img-url");

    if (imagenUrl) {
      btnImg.classList.add("tiene-imagen");
      btnImg.textContent = "✎";
    }

    /* Botón imagen → abrir file picker */
    btnImg.addEventListener("click", () => fileInput.click());

    /* Archivo seleccionado → preview local */
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          preview.style.backgroundImage = `url(${ev.target.result})`;
          btnImg.classList.add("tiene-imagen");
          btnImg.textContent = "✎";
          urlHidden.value = ""; /* se reemplazará al guardar */
        };
        reader.readAsDataURL(file);
      }
    });

    /* Quitar imagen asociada */
    imgRemove.addEventListener("click", (e) => {
      e.stopPropagation();
      preview.style.backgroundImage = "";
      btnImg.classList.remove("tiene-imagen");
      btnImg.textContent = "+";
      fileInput.value = "";
      urlHidden.value = "";
    });

    /* Quitar fila completa */
    div.querySelector(".fp-remove-row").addEventListener("click", () => div.remove());
  }

  function agregarFilaTalla(talla) {
    const cont = $("#fp-tallas-container");
    const div = document.createElement("div");
    div.className = "fp-talla-row";
    div.innerHTML = `
      <input type="text" class="fp-talla-valor" placeholder="ej: 38" value="${talla || ""}" />
      <button type="button" class="fp-remove-row" title="Quitar talla">&times;</button>
    `;
    cont.appendChild(div);
    div.querySelector(".fp-remove-row").addEventListener("click", () => div.remove());
  }

  function generarId(categoria) {
    const prefix = CAT_PREFIX[categoria] || categoria.substring(0, 3);
    const existentes = PRODUCTOS
      .filter(p => p.id.startsWith(prefix))
      .map(p => {
        const parts = p.id.split("-");
        return parts.length > 1 ? parseInt(parts[1], 10) : NaN;
      })
      .filter(n => !isNaN(n));
    const max = existentes.length > 0 ? Math.max(...existentes) : 0;
    const num = String(max + 1).padStart(2, "0");
    return `${prefix}-${num}`;
  }

  /* ================================================================
     GUARDAR: sube imágenes de colores + producto
     ================================================================ */
  async function guardarProducto(e) {
    e.preventDefault();

    const btn = $("#btn-guardar");
    btnLoading(btn, true);

    const categoria = $("#fp-categoria").value;
    const id = editId || generarId(categoria);

    /* Subir imagen principal si hay archivo nuevo */
    const fileInput = $("#fp-imagen-file");
    let imagen_url = $("#fp-imagen-url").value.trim();
    if (fileInput.files.length > 0) {
      try {
        imagen_url = await subirImagen(fileInput.files[0]);
      } catch (err) {
        mostrarToast("Error al subir imagen principal: " + err.message, false);
        btnLoading(btn, false);
        return;
      }
    }

    /* Subir imágenes de colores y armar array */
    const filasColor = $$(".fp-color-row");
    const colores = [];

    for (const row of filasColor) {
      const nombre = row.querySelector(".fp-color-nombre").value.trim();
      if (!nombre) continue;

      const hex = row.querySelector(".fp-color-hex").value;
      const fileInputColor = row.querySelector(".fp-color-img-file");
      const urlHidden = row.querySelector(".fp-color-img-url");
      let imagenUrlColor = urlHidden.value;

      if (fileInputColor.files.length > 0) {
        try {
          imagenUrlColor = await subirImagen(fileInputColor.files[0]);
        } catch (err) {
          mostrarToast(`Error al subir imagen para "${nombre}": ${err.message}`, false);
          btnLoading(btn, false);
          return;
        }
      }

      colores.push({
        nombre,
        hex,
        ...(imagenUrlColor ? { imagen_url: imagenUrlColor } : {})
      });
    }

    const tallas = $$(".fp-talla-row").map(row =>
      row.querySelector(".fp-talla-valor").value.trim()
    ).filter(t => t);

    if (colores.length === 0) {
      mostrarToast("Agrega al menos un color", false);
      btnLoading(btn, false);
      return;
    }
    if (tallas.length === 0) {
      mostrarToast("Agrega al menos una talla", false);
      btnLoading(btn, false);
      return;
    }

    const producto = {
      id,
      categoria,
      nombre: $("#fp-nombre").value.trim(),
      descripcion: $("#fp-descripcion").value.trim(),
      precio: parseInt($("#fp-precio").value, 10),
      stock: $("#fp-stock").value,
      imagen_id: $("#fp-imagen-id").value.trim(),
      imagen_url,
      colores,
      tallas
    };

    try {
      if (editId) {
        await actualizarProducto(editId, producto);
        mostrarToast("Producto actualizado");
      } else {
        await crearProducto(producto);
        mostrarToast("Producto creado");
      }
      window.location.href = "/admin/productos.html";
    } catch (err) {
      mostrarToast("Error al guardar: " + err.message, false);
      btnLoading(btn, false);
    }
  }

  async function init() {
    if (!checkAuth()) return;

    try {
      await cargarDatos();
    } catch (e) {
      mostrarToast("Error al cargar datos: " + e.message, false);
      return;
    }

    editId = obtenerIdDesdeURL();

    if (editId) {
      const p = productoPorId(editId);
      if (!p) {
        window.location.href = "/admin/productos.html";
        return;
      }
      $("#form-titulo").textContent = "Editar Producto";
      $("#bc-actual").textContent = `Editar: ${p.nombre}`;
      document.title = `SAVARA · ${p.nombre}`;
      $("#fp-id").value = p.id;
      $("#fp-nombre").value = p.nombre;
      $("#fp-categoria").value = p.categoria;
      $("#fp-descripcion").value = p.descripcion;
      $("#fp-precio").value = p.precio;
      $("#fp-stock").value = p.stock;
      $("#fp-imagen-id").value = p.imagen_id || "";
      $("#fp-imagen-url").value = p.imagen_url || "";

      p.colores.forEach(c => agregarFilaColor(c.hex, c.nombre, c.imagen_url));
      p.tallas.forEach(t => agregarFilaTalla(t));

      if (p.imagen_url) actualizarPreview(p.imagen_url);
    } else {
      $("#form-titulo").textContent = "Nuevo Producto";
      $("#bc-actual").textContent = "Nuevo Producto";
      document.title = "SAVARA · Nuevo Producto";
      agregarFilaColor("#1a1a1a", "");
    }

    actualizarPreviewCard();

    $("#btn-logout").addEventListener("click", logout);
    $("#form-producto").addEventListener("submit", guardarProducto);
    $("#fp-add-color").addEventListener("click", () => agregarFilaColor("#1a1a1a", ""));
    $("#fp-add-talla").addEventListener("click", () => agregarFilaTalla(""));

    /* Preview en vivo */
    ["#fp-nombre", "#fp-descripcion", "#fp-precio", "#fp-categoria", "#fp-imagen-id", "#fp-imagen-url"].forEach(sel =>
      $(sel).addEventListener("input", actualizarPreviewCard)
    );
    $("#fp-imagen-file").addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          actualizarPreview(ev.target.result);
          const visual = $("#preview-visual");
          visual.style.backgroundImage = `url(${ev.target.result})`;
          visual.style.backgroundSize = "cover";
          visual.style.backgroundPosition = "center";
          visual.className = "preview-visual";
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
    $("#fp-imagen-url").addEventListener("input", (e) => {
      if (e.target.value) actualizarPreview(e.target.value);
      else if ($("#fp-imagen-file").files.length === 0) actualizarPreview("");
      actualizarPreviewCard();
    });

    /* Ctrl+S */
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        $("#form-producto").requestSubmit();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
