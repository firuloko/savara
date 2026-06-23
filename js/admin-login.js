/* ==========================================================================
   SAVARA · Login del panel admin
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);

  if (getToken()) {
    window.location.href = "/admin/dashboard.html";
    return;
  }

  /* Toggle mostrar contraseña */
  $("#toggle-pass").addEventListener("click", () => {
    const input = $("#login-pass");
    const isPass = input.type === "password";
    input.type = isPass ? "text" : "password";
    $("#toggle-pass").textContent = isPass ? "🙈" : "👁";
  });

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#btn-ingresar");
    const card = $("#login-card");
    const error = $("#login-error");

    error.hidden = true;
    card.classList.remove("shake");

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Ingresando...`;

    const user = $("#login-user").value;
    const pass = $("#login-pass").value;
    const data = await loginAPI(user, pass);

    if (data) {
      btn.innerHTML = `<span class="spinner"></span> Redirigiendo...`;
      window.location.href = "/admin/dashboard.html";
    } else {
      btn.disabled = false;
      btn.textContent = "INGRESAR";
      error.hidden = false;
      card.classList.add("shake");
      setTimeout(() => card.classList.remove("shake"), 500);
    }
  });
})();
