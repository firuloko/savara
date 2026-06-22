(function () {
  "use strict";

  async function init() {
    if (!checkAuth()) return;

    $("#btn-logout").addEventListener("click", logout);

    $("#form-pass").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector(".btn-primary");
      const current = $("#pass-current").value;
      const newpass = $("#pass-new").value;
      const confirm = $("#pass-confirm").value;

      if (newpass !== confirm) {
        mostrarToast("Las contraseñas nuevas no coinciden", false);
        return;
      }
      if (newpass.length < 6) {
        mostrarToast("La nueva contraseña debe tener al menos 6 caracteres", false);
        return;
      }

      btnLoading(btn, true);
      try {
        await apiFetch('/api/auth/password', {
          method: 'PUT',
          body: { current, newpass }
        });
        mostrarToast("Contraseña cambiada correctamente");
        $("#pass-current").value = "";
        $("#pass-new").value = "";
        $("#pass-confirm").value = "";
      } catch (e) {
        let msg = e.message;
        try { msg = JSON.parse(e.message).error || msg; } catch {}
        mostrarToast(msg, false);
      }
      btnLoading(btn, false);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
