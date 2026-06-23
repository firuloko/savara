/* ==========================================================================
   SAVARA · Utilidades compartidas del panel admin
   ========================================================================== */

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ----------------------------- Toast -------------------------------- */
let toastTimer = null;

function mostrarToast(mensaje, exito = true) {
  const toast = $("#toast-admin");
  if (!toast) return;
  const icon = exito ? "✓" : "✕";
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${mensaje}</span>`;
  toast.style.borderLeftColor = exito ? "var(--verde)" : "var(--rojo)";
  toast.classList.add("activo");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("activo"), 3500);
}

/* --------------------------- Auth ---------------------------------- */
function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "/admin/login.html";
    return false;
  }
  return true;
}

function logout() {
  clearToken();
  window.location.href = "/admin/login.html";
}

/* ------------------------ Confirm Modal ----------------------------- */
let confirmModalResolve = null;

function mostrarModalConfirm(titulo, mensaje) {
  return new Promise((resolve) => {
    confirmModalResolve = resolve;
    $("#confirm-titulo").textContent = titulo;
    $("#confirm-mensaje").textContent = mensaje;
    $("#confirm-modal").classList.add("activo");
    document.body.style.overflow = "hidden";
  });
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-confirm]");
  if (!btn) return;
  const accion = btn.dataset.confirm;
  document.body.style.overflow = "";
  $("#confirm-modal").classList.remove("activo");
  if (confirmModalResolve) {
    confirmModalResolve(accion === "aceptar");
    confirmModalResolve = null;
  }
});

/* ------------------------ Loading Button ----------------------------- */
function btnLoading(btn, cargando, textoOriginal = "") {
  if (cargando) {
    btn._textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Guardando...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._textoOriginal || textoOriginal || btn.textContent;
  }
}

/* ------------------------ Helpers ---------------------------------- */
function formatearFecha(isoString) {
  const f = new Date(isoString);
  return f.toLocaleDateString("es-CL", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

function obtenerGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}
