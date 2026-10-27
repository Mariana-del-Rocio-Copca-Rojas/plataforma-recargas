/* =========================================================
   pages/linea.js — Historial de una línea (linea.html?id=…)
   ---------------------------------------------------------
   · Indicadores: estado, última recarga, total invertido y
     facturas pendientes.
   · Tabla del historial con filtros por mes y facturación.
   · Registrar / editar / eliminar recargas.
   · Exportar el historial (con los filtros aplicados) a CSV.
   ========================================================= */

(() => {
  if (!requireAuth()) return;

  // ---------- Estado de la página ----------
  const lineaId = getParam('id');
  let linea = null;    // la línea que se consulta
  let recargas = [];   // su historial, de la más reciente a la más antigua

  // ---------- Elementos de la página ----------
  const tbody = document.getElementById('tablaRecargas');
  const filtroMes = document.getElementById('filtroMes');
  const filtroFactura = document.getElementById('filtroFactura');

  /** Columnas del historial que se exportan a CSV: [propiedad, encabezado]. */
  const COLUMNAS_CSV = [
    ['fecha', 'Fecha de recarga'], ['monto', 'Monto pagado ($)'], ['vigencia', 'Vigencia (días)'],
    ['paquete', 'Paquete / tipo de recarga'], ['medio', 'Medio de pago'], ['folio', 'Folio / referencia'],
    ['solicito', 'Solicitó'], ['realizo', 'Realizó la recarga'], ['facturacion', 'Facturación'],
    ['observaciones', 'Observaciones']
  ];

  // ---------- Inicio ----------
  renderNavbar();
  init();

  /** Carga la línea, pinta el encabezado y conecta los eventos. */
  async function init() {
    if (!lineaId) return (window.location.href = 'dashboard.html');
    try {
      linea = await Api.getLinea(lineaId);
    } catch {
      document.getElementById('lineaNumero').textContent = 'Línea no encontrada';
      document.getElementById('accionesLinea').remove();
      tbody.innerHTML = '';
      return;
    }
    const campus = await Api.getCampusById(linea.campusId).catch(() => null);
    pintarEncabezado(campus);

    llenarSelect(filtroFactura, Object.keys(CATALOGOS.FACTURACION));
    const btnRecargar = document.getElementById('btnRecargar');
    btnRecargar.disabled = !esActiva(linea);
    btnRecargar.addEventListener('click', () => RecargaModal.open(linea, cargar));
    filtroMes.addEventListener('change', render);
    filtroFactura.addEventListener('change', render);
    document.getElementById('limpiarFiltros').addEventListener('click', () => {
      filtroMes.value = '';
      filtroFactura.value = '';
      render();
    });
    document.getElementById('btnCsv').addEventListener('click', exportarCsv);

    cargar();
  }

  /** Título, migas de pan (Dashboard › Campus › Línea) y datos de la línea. */
  function pintarEncabezado(campus) {
    const numero = formatPhone(linea.numero);
    setPageTitle(numero);
    document.getElementById('lineaNumero').textContent = numero;
    document.getElementById('crumbLinea').textContent = numero;
    const crumb = document.getElementById('crumbCampus');
    crumb.textContent = campus ? campus.nombre : 'Campus';
    crumb.href = 'campus.html?id=' + encodeURIComponent(linea.campusId);
    document.getElementById('lineaInfo').textContent =
      [linea.compania, linea.departamento, linea.uso].filter(Boolean).join(' · ');
  }

  /** Pide el historial a la API y repinta indicadores y tabla. */
  async function cargar() {
    recargas = await Api.getRecargas(lineaId);
    pintarIndicadores();
    render();
  }

  /** Llena las 4 tarjetas de resumen de la línea. */
  function pintarIndicadores() {
    const ult = recargas[0] || null;   // la lista ya viene ordenada (más reciente primero)
    document.getElementById('statEstado').innerHTML = badgeEstado(linea, ult);
    document.getElementById('statUltima').textContent = ult ? formatDate(ult.fecha) : 'Nunca';
    document.getElementById('statMonto').textContent = money(totalMonto(recargas));
    document.getElementById('statFacturas').textContent =
      recargas.filter((r) => r.facturacion === 'Pendiente' || r.facturacion === 'Solicitada').length;
  }

  // ---------- Tabla del historial ----------

  /** @returns {Array} Recargas que cumplen los filtros de mes y facturación. */
  function filtradas() {
    const mes = filtroMes.value;
    const fact = filtroFactura.value;
    return recargas.filter((r) => (!mes || r.fecha.startsWith(mes)) && (!fact || r.facturacion === fact));
  }

  /** Pinta la tabla del historial (o un mensaje si está vacía). */
  function render() {
    const lista = filtradas();
    document.getElementById('contador').textContent = `${lista.length} ${plural(lista.length, 'registro', 'registros')}`;
    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="11"><div class="empty-state"><i class="bi bi-receipt"></i>
        ${recargas.length ? 'No hay recargas con esos filtros.' : 'Esta línea aún no tiene recargas registradas.'}</div></td></tr>`;
      return;
    }
    tbody.innerHTML = lista.map(filaRecarga).join('');
    conectarAcciones();
  }

  /** HTML de una fila del historial. */
  function filaRecarga(r) {
    const txt = (v) => escapeHtml(v) || '—';
    const id = escapeHtml(r.id);
    return `
      <tr>
        <td class="text-nowrap">${formatDate(r.fecha)}</td>
        <td class="text-end fw-semibold text-nowrap">${money(r.monto)}</td>
        <td class="text-nowrap">${r.vigencia ? `${r.vigencia} días<br><small class="text-muted">vence ${formatDate(vencimiento(r))}</small>` : '—'}</td>
        <td>${txt(r.paquete)}</td>
        <td>${txt(r.medio)}</td>
        <td>${txt(r.folio)}</td>
        <td>${txt(r.solicito)}</td>
        <td>${txt(r.realizo)}</td>
        <td>${badgeFacturacion(r.facturacion)}</td>
        <td class="small text-muted obs">${escapeHtml(r.observaciones || '')}</td>
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-outline-secondary" data-editar="${id}" title="Editar"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-eliminar="${id}" title="Eliminar"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
  }

  /** Conecta los botones de editar y eliminar de cada fila. */
  function conectarAcciones() {
    tbody.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () =>
      RecargaModal.open(linea, cargar, recargas.find((r) => r.id === b.dataset.editar))));
    tbody.querySelectorAll('[data-eliminar]').forEach((b) =>
      b.addEventListener('click', () => eliminarRecarga(b.dataset.eliminar)));
  }

  /** Pide confirmación y elimina una recarga del historial. */
  async function eliminarRecarga(id) {
    if (!(await confirmar('¿Eliminar este registro de recarga?'))) return;
    await Api.deleteRecarga(id);
    toast('Recarga eliminada');
    cargar();
  }

  // ---------- Exportar CSV ----------

  /**
   * Descarga el historial filtrado como archivo CSV (se abre en Excel).
   * Cada fila incluye departamento, número y compañía de la línea.
   */
  function exportarCsv() {
    const lista = filtradas();
    if (!lista.length) return toast('No hay recargas para exportar', 'secondary');

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;   // comillas dobles según el formato CSV
    const fijas = [linea.departamento, linea.numero, linea.compania];
    const encabezados = ['Departamento', 'Número telefónico', 'Compañía', ...COLUMNAS_CSV.map((c) => c[1])];
    const csv = [encabezados.map(esc).join(',')]
      .concat(lista.map((r) => [...fijas, ...COLUMNAS_CSV.map(([k]) => r[k])].map(esc).join(',')))
      .join('\r\n');

    // El BOM (﻿) hace que Excel lea bien los acentos
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `recargas_${linea.numero}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
})();
