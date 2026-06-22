/* ==========================================================================
   SAVARA · Configuración — tienda, página principal, colores
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

    cargarFormTienda();
    cargarFormPagina();
    cargarFormColores();
    cargarFormRedes();

    $("#btn-logout").addEventListener("click", logout);
    $("#form-tienda").addEventListener("submit", guardarTienda);
    $("#btn-guardar-pagina").addEventListener("click", guardarPagina);
    $("#btn-guardar-colores").addEventListener("click", guardarColores);
    $("#btn-guardar-redes").addEventListener("click", guardarRedes);
  }

  /* ---- Tienda ---- */
  function cargarFormTienda() {
    $("#tienda-nombre").value    = TIENDA.nombre || "";
    $("#tienda-direccion").value = TIENDA.direccion || "";
    $("#tienda-horario").value   = TIENDA.horario || "";
    $("#tienda-telefono").value  = TIENDA.telefono || "";
  }

  async function guardarTienda(e) {
    e.preventDefault();
    const btn = e.target.querySelector(".btn-primary");
    btnLoading(btn, true);
    const data = {
      nombre:    $("#tienda-nombre").value.trim(),
      direccion: $("#tienda-direccion").value.trim(),
      horario:   $("#tienda-horario").value.trim(),
      telefono:  $("#tienda-telefono").value.trim()
    };
    try {
      await actualizarTienda(data);
      mostrarToast("Información de tienda actualizada");
    } catch (e) {
      mostrarToast("Error al guardar: " + e.message, false);
    }
    btnLoading(btn, false);
  }

  /* ---- Página principal ---- */
  function cargarFormPagina() {
    $("#p-hero-eyebrow").value    = PAGINA.hero_eyebrow || "";
    $("#p-hero-titulo").value     = PAGINA.hero_titulo || "";
    $("#p-hero-subtitulo").value  = PAGINA.hero_subtitulo || "";
    $("#p-hero-cta").value        = PAGINA.hero_cta || "";
    $("#p-hero-nota").value       = PAGINA.hero_nota || "";
    $("#p-seccion-titulo").value  = PAGINA.seccion_about_titulo || "";
    $("#p-seccion-texto").value   = PAGINA.seccion_about_texto || "";
    $("#p-footer-desc").value     = PAGINA.footer_desc || "";
    $("#p-footer-copyright").value = PAGINA.footer_copyright || "";
  }

  async function guardarPagina() {
    const btn = $("#btn-guardar-pagina");
    btnLoading(btn, true);
    const data = {
      hero_eyebrow:        $("#p-hero-eyebrow").value.trim(),
      hero_titulo:         $("#p-hero-titulo").value.trim(),
      hero_subtitulo:      $("#p-hero-subtitulo").value.trim(),
      hero_cta:            $("#p-hero-cta").value.trim(),
      hero_nota:           $("#p-hero-nota").value.trim(),
      seccion_about_titulo: $("#p-seccion-titulo").value.trim(),
      seccion_about_texto:  $("#p-seccion-texto").value.trim(),
      footer_desc:         $("#p-footer-desc").value.trim(),
      footer_copyright:    $("#p-footer-copyright").value.trim()
    };
    try {
      await actualizarPagina(data);
      mostrarToast("Página principal actualizada");
    } catch (e) {
      mostrarToast("Error al guardar: " + e.message, false);
    }
    btnLoading(btn, false);
  }

  /* ---- Colores ---- */
  function cargarFormColores() {
    $$(".p-color").forEach(input => {
      const clave = input.dataset.clave;
      if (PAGINA[clave]) input.value = PAGINA[clave];
    });
  }

  async function guardarColores() {
    const btn = $("#btn-guardar-colores");
    btnLoading(btn, true);
    const data = {};
    $$(".p-color").forEach(input => {
      data[input.dataset.clave] = input.value;
    });
    try {
      await actualizarPagina(data);
      mostrarToast("Colores del tema actualizados");
    } catch (e) {
      mostrarToast("Error al guardar: " + e.message, false);
    }
    btnLoading(btn, false);
  }

  /* ---- Redes Sociales ---- */
  function cargarFormRedes() {
    $("#rs-instagram").value = PAGINA.social_instagram || "";
    $("#rs-facebook").value  = PAGINA.social_facebook || "";
    $("#rs-tiktok").value    = PAGINA.social_tiktok || "";
    $("#rs-whatsapp").value  = PAGINA.social_whatsapp || "";
  }

  async function guardarRedes() {
    const btn = $("#btn-guardar-redes");
    btnLoading(btn, true);
    const data = {
      social_instagram: $("#rs-instagram").value.trim(),
      social_facebook:  $("#rs-facebook").value.trim(),
      social_tiktok:    $("#rs-tiktok").value.trim(),
      social_whatsapp:  $("#rs-whatsapp").value.trim()
    };
    try {
      await actualizarPagina(data);
      mostrarToast("Redes sociales actualizadas");
    } catch (e) {
      mostrarToast("Error al guardar: " + e.message, false);
    }
    btnLoading(btn, false);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
