/* ==========================================================================
   SAVARA · Login del panel admin
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);

  /* Si ya hay sesión, redirigir directo a productos */
  if (getToken()) {
    window.location.href = "/admin/dashboard.html";
    return;
  }

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = $("#login-user").value;
    const pass = $("#login-pass").value;
    const data = await loginAPI(user, pass);
    if (data) {
      window.location.href = "/admin/dashboard.html";
    } else {
      $("#login-error").hidden = false;
    }
  });
})();
