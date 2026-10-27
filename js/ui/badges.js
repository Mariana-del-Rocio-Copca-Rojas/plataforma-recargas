/* =========================================================
   ui/badges.js — Etiquetas de color (badges)
   ---------------------------------------------------------
   Convierten un estado en HTML con el color que le toca.
   La lógica de "qué estado tiene" vive en domain/lineas.js;
   aquí solo se decide cómo se VE.
   ========================================================= */

/**
 * Etiqueta del estado de una línea.
 *   Suspendida (gris) · Por recargar (rojo) · Vence pronto (amarillo) · Vigente (verde)
 * @param {object} linea
 * @param {object|null} ultima Última recarga de la línea.
 * @returns {string} HTML
 */
function badgeEstado(linea, ultima) {
  const estado = estadoLinea(linea, ultima);
  if (estado === ESTADO.SUSPENDIDA) return '<span class="badge text-bg-secondary">Suspendida</span>';
  if (estado === ESTADO.PENDIENTE) return '<span class="badge text-bg-danger"><i class="bi bi-exclamation-circle me-1"></i>Por recargar</span>';

  // Vigente: sin vigencia en días, se considera recargada en el mes
  const vence = vencimiento(ultima);
  if (!vence) return '<span class="badge text-bg-success"><i class="bi bi-check-circle me-1"></i>Recargada este mes</span>';

  // Vigente con fecha de vencimiento: avisa cuando está por vencer
  const dias = diasRestantes(vence);
  if (dias <= DIAS_AVISO_VENCIMIENTO) {
    const cuando = dias === 0 ? 'hoy' : `en ${dias} ${plural(dias, 'día', 'días')}`;
    return `<span class="badge text-bg-warning"><i class="bi bi-clock me-1"></i>Vence ${cuando}</span>`;
  }
  return `<span class="badge text-bg-success"><i class="bi bi-check-circle me-1"></i>Vigente</span><br><small class="text-muted">hasta ${formatDate(vence)}</small>`;
}

/**
 * Etiqueta del estado de facturación de una recarga (colores en CATALOGOS.FACTURACION).
 * @param {string} valor Ej. "Pendiente"
 * @returns {string} HTML
 */
function badgeFacturacion(valor) {
  if (!valor) return '<span class="text-muted">—</span>';
  return `<span class="badge text-bg-${CATALOGOS.FACTURACION[valor] || 'light'}">${escapeHtml(valor)}</span>`;
}
