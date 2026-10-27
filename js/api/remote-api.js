/* =========================================================
   api/remote-api.js — Implementación REAL de la API (backend)
   ---------------------------------------------------------
   Cada función hace una petición HTTP al backend que está en
   API_CONFIG.API_URL. El contrato completo (rutas, cuerpos y
   respuestas) está documentado en el README.
   ========================================================= */

/**
 * Hace una petición JSON al backend.
 *  - Envía el token de la sesión en el encabezado Authorization.
 *  - Si el backend responde 401 (sesión vencida), cierra la sesión.
 *  - Si responde con error, lanza un Error con el `message` que mande el backend.
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} path  Ruta relativa, ej. "/campus".
 * @param {object} [body] Datos a enviar (se convierten a JSON).
 * @returns {Promise<*>} El JSON de la respuesta (null si es 204).
 */
async function httpRequest(method, path, body) {
  const token = Session.token;
  const res = await fetch(API_CONFIG.API_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) {
    Session.end();
    throw new Error('Sesión expirada');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.message) || 'Error ' + res.status);
  return data;
}

const RemoteApi = {
  // ---------- Autenticación ----------
  login: (email, password) => httpRequest('POST', '/auth/login', { email, password }),

  // ---------- Campus ----------
  getCampus: () => httpRequest('GET', '/campus'),
  getCampusById: (id) => httpRequest('GET', `/campus/${id}`),
  createCampus: (data) => httpRequest('POST', '/campus', data),
  deleteCampus: (id) => httpRequest('DELETE', `/campus/${id}`),

  // ---------- Líneas ----------
  getLineas: (campusId) => httpRequest('GET', campusId ? `/campus/${campusId}/lineas` : '/lineas'),
  getLinea: (id) => httpRequest('GET', `/lineas/${id}`),
  createLinea: (data) => httpRequest('POST', '/lineas', data),
  updateLinea: (id, data) => httpRequest('PUT', `/lineas/${id}`, data),
  deleteLinea: (id) => httpRequest('DELETE', `/lineas/${id}`),

  // ---------- Recargas ----------
  getRecargas: (lineaId) => httpRequest('GET', lineaId ? `/lineas/${lineaId}/recargas` : '/recargas'),
  createRecarga: (data) => httpRequest('POST', '/recargas', data),
  updateRecarga: (id, data) => httpRequest('PUT', `/recargas/${id}`, data),
  deleteRecarga: (id) => httpRequest('DELETE', `/recargas/${id}`)
};
