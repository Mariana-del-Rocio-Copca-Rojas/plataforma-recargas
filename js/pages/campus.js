/* =========================================================
   pages/campus.js — Líneas de un campus (campus.html?id=…)
   ---------------------------------------------------------
   · Tabla de líneas con búsqueda y filtro por estado.
   · Registrar / editar línea (ventana #lineaModal).
   · Eliminar línea.
   · Registrar recarga (ventana compartida RecargaModal).
   ========================================================= */

(() => {
  if (!requireAuth()) return;

  // ---------- Estado de la página ----------
  const campusId = getParam('id');
  let lineas = [];        // líneas de este campus
  let recargas = [];      // todas las recargas (para saber la última de cada línea)
  let editandoId = null;  // id de la línea que se edita (null = línea nueva)

  // ---------- Elementos de la página ----------
  const tbody = document.getElementById('tablaLineas');
  const buscar = document.getElementById('buscar');
  const filtroEstado = document.getElementById('filtroEstado');
  const btnNueva = document.getElementById('btnNuevaLinea');
  const form = document.getElementById('lineaForm');
  const lineaModal = new bootstrap.Modal(document.getElementById('lineaModal'));

  // ---------- Inicio ----------
  renderNavbar();
  init();

  /** Carga los datos del campus y conecta los eventos de la página. */
  async function init() {
    if (!campusId) return (window.location.href = 'dashboard.html');
    try {
      const c = await Api.getCampusById(campusId);
      setPageTitle(c.nombre);
      document.getElementById('campusNombre').textContent = c.nombre;
      document.getElementById('crumbCampus').textContent = c.nombre;
      document.getElementById('campusDireccion').textContent = c.direccion || '';
    } catch (err) {
      document.getElementById('campusNombre').textContent = 'Campus no encontrado';
      btnNueva.remove();
      tbody.innerHTML = '';
      return;
    }

    llenarSelect(form.compania, CATALOGOS.COMPANIAS);
    btnNueva.addEventListener('click', () => abrirLinea());
    buscar.addEventListener('input', render);
    filtroEstado.addEventListener('change', render);
    // El número solo acepta dígitos
    form.numero.addEventListener('input', () => { form.numero.value = form.numero.value.replace(/\D/g, ''); });
    form.addEventListener('submit', guardarLinea);

    cargar();
  }

  /** Vuelve a pedir líneas y recargas a la API y repinta la tabla. */
  async function cargar() {
    [lineas, recargas] = await Promise.all([Api.getLineas(campusId), Api.getRecargas()]);
    render();
  }

  // ---------- Tabla de líneas ----------

  /**
   * Aplica la búsqueda y el filtro de estado.
   * La búsqueda ignora espacios para que "229 123" encuentre "2291234567".
   * @returns {Array<{l: object, ult: object|null}>} Línea + su última recarga.
   */
  function filtrar() {
    const q = buscar.value.trim().toLowerCase();
    const filtro = filtroEstado.value;
    return lineas
      .map((l) => ({ l, ult: ultimaRecarga(l.id, recargas) }))
      .filter(({ l, ult }) => {
        const texto = [l.numero, l.compania, l.departamento, l.uso].join(' ').toLowerCase();
        if (q && !texto.includes(q.replace(/\s/g, '')) && !texto.includes(q)) return false;
        return !filtro || estadoLinea(l, ult) === filtro;
      });
  }

  /** Pinta la tabla (o un mensaje si no hay líneas / no hay resultados). */
  function render() {
    if (!lineas.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="bi bi-sim"></i>
        Este campus aún no tiene líneas.<br>Usa “Registrar línea” para agregar la primera.</div></td></tr>`;
      return;
    }
    const filas = filtrar();
    if (!filas.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="bi bi-search"></i>Sin resultados.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = filas.map(({ l, ult }) => filaLinea(l, ult)).join('');
    conectarAcciones();
  }

  /** HTML de una fila de la tabla. */
  function filaLinea(l, ult) {
    const id = escapeHtml(l.id);
    return `
      <tr>
        <td class="phone text-nowrap">${formatPhone(l.numero)}</td>
        <td>${escapeHtml(l.compania)}</td>
        <td>
          <div class="fw-semibold">${escapeHtml(l.departamento)}</div>
          <small class="text-muted">${escapeHtml(l.uso || '')}</small>
        </td>
        <td>${l.montoPlan ? money(l.montoPlan) : '—'}${l.vigencia ? ` <small class="text-muted">/ ${l.vigencia} días</small>` : ''}
          <br><small class="text-muted">${escapeHtml(l.paquete || '')}</small></td>
        <td class="text-nowrap">${ult ? `${formatDate(ult.fecha)}<br><small class="text-muted">${money(ult.monto)}</small>` : '<span class="text-muted">Sin recargas</span>'}</td>
        <td>${badgeEstado(l, ult)}</td>
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-success" data-recargar="${id}" title="Registrar recarga" ${esActiva(l) ? '' : 'disabled'}>
            <i class="bi bi-lightning-charge"></i><span class="d-none d-xl-inline ms-1">Recargar</span>
          </button>
          <a class="btn btn-sm btn-outline-primary" href="linea.html?id=${encodeURIComponent(l.id)}" title="Historial de recargas">
            <i class="bi bi-clock-history"></i>
          </a>
          <button class="btn btn-sm btn-outline-secondary" data-editar="${id}" title="Editar"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-eliminar="${id}" title="Eliminar"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
  }

  /** Conecta los botones de cada fila (recargar, editar, eliminar). */
  function conectarAcciones() {
    const byId = (id) => lineas.find((l) => l.id === id);
    tbody.querySelectorAll('[data-recargar]').forEach((b) =>
      b.addEventListener('click', () => RecargaModal.open(byId(b.dataset.recargar), cargar)));
    tbody.querySelectorAll('[data-editar]').forEach((b) =>
      b.addEventListener('click', () => abrirLinea(byId(b.dataset.editar))));
    tbody.querySelectorAll('[data-eliminar]').forEach((b) =>
      b.addEventListener('click', () => eliminarLinea(byId(b.dataset.eliminar))));
  }

  // ---------- Registrar / editar línea ----------

  /**
   * Abre la ventana de línea.
   * @param {object} [linea] Línea a editar; si se omite, es una línea nueva.
   */
  function abrirLinea(linea) {
    editandoId = linea ? linea.id : null;
    form.reset();
    showFormError(form, '');
    document.getElementById('lineaModalTitulo').textContent = linea ? 'Editar línea' : 'Registrar línea';
    if (linea) llenarFormulario(form, linea);
    lineaModal.show();
  }

  /**
   * Revisa los datos de la línea.
   * @returns {string} Mensaje de error, o '' si todo está bien.
   */
  function validarLinea(data) {
    if (!/^\d{10}$/.test(data.numero)) return 'El número debe tener exactamente 10 dígitos';
    if (!data.compania) return 'Selecciona la compañía';
    if (!data.departamento) return 'Indica el departamento';
    return '';
  }

  /** Envío del formulario de línea: valida y crea o actualiza en la API. */
  async function guardarLinea(e) {
    e.preventDefault();
    const data = leerFormulario(form);
    data.montoPlan = numeroOpcional(data.montoPlan, 0);
    data.vigencia = numeroOpcional(data.vigencia);

    const error = validarLinea(data);
    if (error) return showFormError(form, error);

    data.campusId = campusId;
    try {
      if (editandoId) await Api.updateLinea(editandoId, data);
      else await Api.createLinea(data);
      lineaModal.hide();
      toast(editandoId ? 'Línea actualizada' : 'Línea registrada');
      cargar();
    } catch (err) {
      showFormError(form, err.message);
    }
  }

  // ---------- Eliminar línea ----------

  /** Pide confirmación y elimina la línea con su historial. */
  async function eliminarLinea(l) {
    if (!(await confirmar(`¿Eliminar la línea ${formatPhone(l.numero)} y su historial de recargas?`))) return;
    await Api.deleteLinea(l.id);
    toast('Línea eliminada');
    cargar();
  }
})();
