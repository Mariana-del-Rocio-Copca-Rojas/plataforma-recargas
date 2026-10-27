/* =========================================================
   domain/lineas.js — Reglas de negocio de líneas y recargas
   ---------------------------------------------------------
   Aquí se decide si una línea está "vigente" o "por recargar".
   No toca el DOM: solo recibe datos y devuelve resultados,
   para que la misma regla se use igual en todas las páginas.

   Regla del estado de una línea:
     · Suspendida  → no se recarga ni cuenta en los totales.
     · Con vigencia → está vigente hasta (fecha + vigencia días).
     · Sin vigencia → está vigente si se recargó en el mes actual.
   ========================================================= */

/** Estados posibles de una línea. */
const ESTADO = {
  VIGENTE: 'vigente',
  PENDIENTE: 'pendiente',   // "Por recargar"
  SUSPENDIDA: 'suspendida'
};

/**
 * Fecha en que vence una recarga.
 * @param {{fecha: string, vigencia: number}} r Recarga.
 * @returns {string|null} "YYYY-MM-DD", o null si la recarga no tiene vigencia.
 */
function vencimiento(r) {
  if (!r || !Number(r.vigencia)) return null;
  return sumarDias(r.fecha, r.vigencia);
}

/**
 * Calcula el estado de una línea a partir de su última recarga.
 * @param {object} linea
 * @param {object|null} ult Última recarga de la línea (o null si nunca se ha recargado).
 * @returns {'vigente'|'pendiente'|'suspendida'}
 */
function estadoLinea(linea, ult) {
  if (linea.estado === 'suspendida') return ESTADO.SUSPENDIDA;
  if (!ult) return ESTADO.PENDIENTE;
  const vence = vencimiento(ult);
  if (vence) return vence >= todayISO() ? ESTADO.VIGENTE : ESTADO.PENDIENTE;
  return ult.fecha.startsWith(currentMonth()) ? ESTADO.VIGENTE : ESTADO.PENDIENTE;
}

/**
 * Busca la recarga más reciente de una línea dentro de una lista.
 * @param {string} lineaId
 * @param {Array} recargas Lista de recargas (de cualquier línea).
 * @returns {object|null}
 */
function ultimaRecarga(lineaId, recargas) {
  return recargas
    .filter((r) => r.lineaId === lineaId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0] || null;
}

/** @returns {boolean} true si la línea está activa (no suspendida). */
const esActiva = (linea) => linea.estado !== 'suspendida';

/**
 * Suma el monto de una lista de recargas.
 * @param {Array<{monto: number}>} recargas
 * @returns {number}
 */
const totalMonto = (recargas) => recargas.reduce((s, r) => s + Number(r.monto), 0);

/**
 * Resume el estado de un grupo de líneas (un campus o toda la plataforma).
 * @param {Array} lineas
 * @param {Array} recargas Todas las recargas (se usan para saber la última de cada línea).
 * @returns {{total: number, activas: number, vigentes: number, pendientes: number, porcentaje: number}}
 */
function resumenLineas(lineas, recargas) {
  const activas = lineas.filter(esActiva);
  const vigentes = activas.filter((l) => estadoLinea(l, ultimaRecarga(l.id, recargas)) === ESTADO.VIGENTE).length;
  return {
    total: lineas.length,
    activas: activas.length,
    vigentes,
    pendientes: activas.length - vigentes,
    porcentaje: activas.length ? Math.round((vigentes / activas.length) * 100) : 0
  };
}
