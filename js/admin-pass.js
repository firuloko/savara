(function () {
  "use strict";

  function evaluarFortaleza(pass) {
    const fill = $("#pass-strength-fill");
    const text = $("#pass-strength-text");
    const reqLength = $("#req-length");

    /* Requisito: longitud */
    if (pass.length >= 6) {
      reqLength.className = "cumplido";
      reqLength.innerHTML = "✓ Mínimo 6 caracteres";
    } else {
      reqLength.className = "";
      reqLength.innerHTML = "✕ Mínimo 6 caracteres";
    }

    /* Fortaleza */
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    fill.className = "pass-strength-fill";
    if (pass.length === 0) {
      fill.style.width = "0";
      text.textContent = "";
    } else if (score <= 2) {
      fill.classList.add("weak");
      text.textContent = "Contraseña débil";
      text.style.color = "var(--rojo)";
    } else if (score <= 3) {
      fill.classList.add("medium");
      text.textContent = "Contraseña media";
      text.style.color = "var(--ambar)";
    } else {
      fill.classList.add("strong");
      text.textContent = "Contraseña fuerte";
      text.style.color = "var(--verde)";
    }
  }

  async function init() {
    if (!checkAuth()) return;

    /* Toggles mostrar contraseña */
    $$("[data-toggle]").forEach(btn => {
      btn.addEventListener("click", () => {
        const input = $(`#${btn.dataset.toggle}`);
        if (!input) return;
        const isPass = input.type === "password";
        input.type = isPass ? "text" : "password";
        btn.textContent = isPass ? "🙈" : "👁";
      });
    });

    /* Evaluar fortaleza en tiempo real */
    $("#pass-new").addEventListener("input", (e) => {
      evaluarFortaleza(e.target.value);
    });

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
        evaluarFortaleza("");
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
