/* =========================================================
   core/session.js — Sesión del usuario y parámetros de la URL
   ---------------------------------------------------------
   La sesión vive en sessionStorage: se borra al cerrar la
   pestaña del navegador.
     · token → credencial que se envía al backend.
     · user  → { id, nombre, email, rol } del usuario.
   ========================================================= */

const Session = {
  /** @returns {string|null} Token de la sesión actual. */
  get token() {
    return sessionStorage.getItem('token');
  },

  /** @returns {{id, nombre, email, rol}|null} Usuario que inició sesión. */
  get user() {
    try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; }
  },

  /** @returns {string} Nombre del usuario, o '' si no hay sesión. */
  get nombre() {
    return (this.user && this.user.nombre) || '';
  },

  /**
   * Guarda la sesión después de un login exitoso.
   * @param {{token: string, user: object}} respuesta Respuesta de Api.login().
   */
  start({ token, user }) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
  },

  /** Cierra la sesión y regresa al login. */
  end() {
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
};

/**
 * Protege una página: si no hay sesión, manda al login.
 * @returns {boolean} true si el usuario sí tiene sesión.
 */
function requireAuth() {
  if (!Session.token) {
    window.location.replace('index.html');
    return false;
  }
  return true;
}

/**
 * Lee un parámetro de la URL actual.
 * @param {string} name
 * @returns {string|null} Ej. en "campus.html?id=abc", getParam('id') → "abc"
 */
const getParam = (name) => new URLSearchParams(window.location.search).get(name);
