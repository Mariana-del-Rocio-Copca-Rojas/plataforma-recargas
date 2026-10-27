/* =========================================================
   pages/login.js — Página de inicio de sesión (index.html)
   ---------------------------------------------------------
   · Si ya hay sesión, salta directo al dashboard.
   · Valida que haya correo y contraseña, llama a Api.login()
     y guarda la sesión.
   ========================================================= */

(() => {
  // Ya hay sesión abierta → no tiene caso mostrar el login
  if (Session.token) return window.location.replace('dashboard.html');

  // ---------- Elementos de la página ----------
  const form = document.getElementById('loginForm');
  const btn = document.getElementById('btnLogin');
  const spinner = btn.querySelector('.spinner-border');
  const email = document.getElementById('email');
  const pass = document.getElementById('password');

  // El usuario de prueba solo existe en modo demo
  if (!API_CONFIG.USE_MOCK) document.getElementById('demoHint').remove();

  // ---------- Mostrar / ocultar contraseña ----------
  document.getElementById('togglePass').addEventListener('click', (e) => {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    e.currentTarget.innerHTML = `<i class="bi bi-eye${show ? '-slash' : ''}"></i>`;
  });

  /** Activa o desactiva el estado "cargando" del botón. */
  function cargando(activo) {
    btn.disabled = activo;
    spinner.classList.toggle('d-none', !activo);
  }

  // ---------- Envío del formulario ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showFormError(form, '');
    const correo = email.value.trim();
    if (!correo || !pass.value) return showFormError(form, 'Ingresa tu correo y contraseña');

    cargando(true);
    try {
      Session.start(await Api.login(correo, pass.value));
      window.location.href = 'dashboard.html';
    } catch (err) {
      showFormError(form, err.message);
    } finally {
      cargando(false);
    }
  });
})();
