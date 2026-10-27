/* =========================================================
   core/formato.js — Formato de textos para mostrar en pantalla
   ---------------------------------------------------------
   Funciones puras (no tocan el DOM ni los datos): reciben un
   valor y devuelven un texto listo para pintar.
   ========================================================= */

/**
 * Escapa los caracteres especiales de HTML.
 * Usar SIEMPRE que se inserte texto capturado por el usuario dentro de innerHTML,
 * para evitar que se interprete como código.
 * @param {*} str Valor a escapar (null/undefined se convierten en '').
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Da formato de moneda mexicana.
 * @param {number|string} n Cantidad.
 * @returns {string} Ej. money(150) → "$150.00"
 */
const money = (n) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

/**
 * Convierte una fecha ISO ("YYYY-MM-DD") a formato legible.
 * @param {string} iso
 * @returns {string} Ej. "26 oct 2026", o "—" si no hay fecha.
 */
function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Separa un número de 10 dígitos en bloques para leerlo mejor.
 * @param {string|number} n
 * @returns {string} Ej. "2291234567" → "22 9123 4567"
 */
function formatPhone(n) {
  const s = String(n || '');
  return s.length === 10 ? `${s.slice(0, 2)} ${s.slice(2, 6)} ${s.slice(6)}` : s;
}

/**
 * Devuelve la forma singular o plural de una palabra según la cantidad.
 * @param {number} n
 * @param {string} uno    Forma singular.
 * @param {string} varios Forma plural.
 * @returns {string} Ej. plural(1, 'línea', 'líneas') → "línea"
 */
const plural = (n, uno, varios) => (n === 1 ? uno : varios);
