/* =========================================================
   pages/dashboard.js — Resumen general (dashboard.html)
   ---------------------------------------------------------
   · Cuatro indicadores del mes: líneas, vigentes, por recargar
     y monto gastado.
   · Una tarjeta por campus con su avance de recargas.
   · Crear campus (ventana #campusModal) y eliminar campus.
   ========================================================= */

(() => {
  if (!requireAuth()) return;

  // ---------- Elementos de la página ----------
  const grid = document.getElementById('campusGrid');
  const form = document.getElementById('campusForm');
  const modalEl = document.getElementById('campusModal');

  // ---------- Inicio ----------
  renderNavbar();
  document.getElementById('mesActual').textContent = 'Resumen de ' + nombreMesActual();
  configurarNuevoCampus();
  cargar();

  // ---------- Crear campus ----------

  /** Conecta el formulario de "Nuevo campus". */
  function configurarNuevoCampus() {
    // Al cerrar la ventana se limpia para la próxima vez
    modalEl.addEventListener('hidden.bs.modal', () => { form.reset(); showFormError(form, ''); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = leerFormulario(form);
      if (!data.nombre) return showFormError(form, 'El nombre es obligatorio');
      try {
        await Api.createCampus(data);
        bootstrap.Modal.getInstance(modalEl).hide();
        toast('Campus creado');
        cargar();
      } catch (err) {
        showFormError(form, err.message);
      }
    });
  }

  // ---------- Carga de datos ----------

  /** Pide campus, líneas y recargas a la API y pinta toda la página. */
  async function cargar() {
    try {
      const [campus, lineas, recargas] = await Promise.all([Api.getCampus(), Api.getLineas(), Api.getRecargas()]);
      pintarIndicadores(lineas, recargas);
      pintarCampus(campus, lineas, recargas);
    } catch (err) {
      grid.innerHTML = `<div class="col-12"><div class="alert alert-danger">${escapeHtml(err.message)}</div></div>`;
    }
  }

  // ---------- Pintado ----------

  /** Llena las 4 tarjetas de resumen de la parte superior. */
  function pintarIndicadores(lineas, recargas) {
    const resumen = resumenLineas(lineas, recargas);
    const delMes = recargas.filter((r) => r.fecha.startsWith(currentMonth()));
    document.getElementById('statLineas').textContent = resumen.total;
    document.getElementById('statRecargadas').textContent = resumen.vigentes;
    document.getElementById('statPendientes').textContent = resumen.pendientes;
    document.getElementById('statMonto').textContent = money(totalMonto(delMes));
  }

  /** Pinta una tarjeta por campus (o un mensaje si todavía no hay ninguno). */
  function pintarCampus(campus, lineas, recargas) {
    if (!campus.length) {
      grid.innerHTML = `<div class="col-12"><div class="card"><div class="empty-state">
        <i class="bi bi-building"></i>Aún no hay campus. Crea el primero con “Nuevo campus”.</div></div></div>`;
      return;
    }
    grid.innerHTML = campus
      .map((c) => tarjetaCampus(c, resumenLineas(lineas.filter((l) => l.campusId === c.id), recargas)))
      .join('');

    grid.querySelectorAll('[data-del]').forEach((b) =>
      b.addEventListener('click', () => eliminarCampus(b.dataset.del, b.dataset.name)));
  }

  /**
   * HTML de la tarjeta de un campus.
   * @param {object} c Campus.
   * @param {object} r Resultado de resumenLineas() para las líneas de ese campus.
   */
  function tarjetaCampus(c, r) {
    return `
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card campus-card h-100">
          <div class="card-body d-flex flex-column">
            <!-- Encabezado: ícono, nombre, dirección y menú -->
            <div class="d-flex align-items-start gap-3 mb-3">
              <span class="campus-icon"><i class="bi bi-airplane"></i></span>
              <div class="flex-grow-1 min-w-0">
                <h3 class="h6 fw-bold mb-0 text-truncate">${escapeHtml(c.nombre)}</h3>
                <small class="text-muted d-block text-truncate">${escapeHtml(c.direccion || 'Sin dirección')}</small>
              </div>
              <div class="dropdown">
                <button class="btn btn-sm btn-link text-muted p-0" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><button class="dropdown-item text-danger" data-del="${escapeHtml(c.id)}" data-name="${escapeHtml(c.nombre)}">
                    <i class="bi bi-trash me-2"></i>Eliminar campus</button></li>
                </ul>
              </div>
            </div>
            <!-- Avance: cuántas líneas activas están vigentes -->
            <div class="d-flex justify-content-between small mb-1">
              <span><strong>${r.total}</strong> ${plural(r.total, 'línea', 'líneas')}</span>
              <span class="${r.pendientes ? 'text-warning' : 'text-success'} fw-semibold">${r.pendientes ? r.pendientes + ' por recargar' : 'Al día'}</span>
            </div>
            <div class="progress mb-3" style="height:6px" title="${r.porcentaje}% de líneas vigentes">
              <div class="progress-bar bg-success" style="width:${r.porcentaje}%"></div>
            </div>
            <a href="campus.html?id=${encodeURIComponent(c.id)}" class="btn btn-outline-primary btn-sm mt-auto">
              Ver líneas <i class="bi bi-arrow-right ms-1"></i>
            </a>
          </div>
        </div>
      </div>`;
  }

  // ---------- Eliminar campus ----------

  /** Pide confirmación y elimina el campus con todas sus líneas y recargas. */
  async function eliminarCampus(id, nombre) {
    if (!(await confirmar(`¿Eliminar "${nombre}" con todas sus líneas y recargas?`))) return;
    await Api.deleteCampus(id);
    toast('Campus eliminado');
    cargar();
  }
})();
