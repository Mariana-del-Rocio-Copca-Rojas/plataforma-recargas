/* =========================================================
   core/fechas.js — Utilidades de fechas
   ---------------------------------------------------------
   Todas las fechas de la app se guardan como texto ISO
   ("YYYY-MM-DD") en la hora LOCAL del usuario, para que
   comparar fechas sea tan simple como comparar textos.
   ========================================================= */

/**
 * Convierte un Date a texto "YYYY-MM-DD" usando la zona horaria local
 * (toISOString usa UTC, por eso se compensa el desfase).
 * @param {Date} d
 * @returns {string}
 */
const isoDate = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/** @returns {string} La fecha de hoy, "YYYY-MM-DD". */
const todayISO = () => isoDate(new Date());

/** @returns {string} El mes actual, "YYYY-MM". */
const currentMonth = () => todayISO().slice(0, 7);

/**
 * Suma días a una fecha ISO.
 * @param {string} iso   Fecha "YYYY-MM-DD".
 * @param {number} dias  Días a sumar.
 * @returns {string} Nueva fecha "YYYY-MM-DD".
 */
function sumarDias(iso, dias) {
  const [y, m, d] = iso.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + Number(dias)));
}

/**
 * Días que faltan desde hoy hasta una fecha (negativo si ya pasó).
 * @param {string} isoFecha "YYYY-MM-DD"
 * @returns {number}
 */
function diasRestantes(isoFecha) {
  const [y, m, d] = isoFecha.split('-').map(Number);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d) - hoy) / 86400000);
}

/** @returns {string} Nombre del mes actual, ej. "octubre de 2026". */
const nombreMesActual = () => new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
