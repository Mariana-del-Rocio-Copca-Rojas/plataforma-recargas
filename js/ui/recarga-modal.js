/* =========================================================
   ui/recarga-modal.js — Ventana "Registrar / editar recarga"
   ---------------------------------------------------------
   Componente compartido por campus.html y linea.html.
   El HTML de la ventana se crea la primera vez que se abre.

   Uso:
     RecargaModal.open(linea, alGuardar)           → nueva recarga
     RecargaModal.open(linea, alGuardar, recarga)  → editar recarga

   `alGuardar` es una función que se ejecuta cuando la recarga
   se guardó bien (normalmente, recargar la tabla).
   ========================================================= */

const RecargaModal = (() => {
  // ---------- Estado interno ----------
  let modal;     // instancia de bootstrap.Modal
  let form;      // <form> de la ventana
  let linea;     // línea a la que pertenece la recarga
  let recarga;   // recarga que se edita (null si es nueva)
  let onSaved;   // callback después de guardar

  // ---------- Construcción del HTML ----------

  /** Crea la ventana y la agrega al final del <body>. Se ejecuta una sola vez. */
  function build() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="modal fade" id="recargaModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
          <form class="modal-content" novalidate>
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-lightning-charge me-2"></i><span data-titulo>Registrar recarga</span></h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="alert alert-danger py-2 small form-error d-none"></div>

              <!-- Resumen de la línea que se está recargando -->
              <div class="bg-light rounded p-2 px-3 mb-3 small">
                Línea <span class="phone" data-numero></span> · <span data-compania></span> · <span data-departamento></span>
              </div>

              <!-- Sección 1: datos de la recarga -->
              <h6 class="section-heading"><span class="number">1</span>Datos de la recarga</h6>
              <div class="row g-3 mb-4">
                <div class="col-sm-6 col-lg-4">
                  <label class="form-label">Fecha de recarga <span class="required">*</span></label>
                  <input type="date" class="form-control" name="fecha" required>
                </div>
                <div class="col-sm-6 col-lg-4">
                  <label class="form-label">Monto pagado <span class="required">*</span></label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number" class="form-control" name="monto" min="0.01" step="0.01" placeholder="0.00" required>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-4">
                  <label class="form-label">Vigencia (días)</label>
                  <input type="number" class="form-control" name="vigencia" min="0" step="1" placeholder="Ej. 30">
                </div>
                <div class="col-sm-6 col-lg-4">
                  <label class="form-label">Paquete / tipo de recarga</label>
                  <input class="form-control" name="paquete" maxlength="80" placeholder="Ej. Amigo Sin Límite 200">
                </div>
                <div class="col-sm-6 col-lg-4">
                  <label class="form-label">Medio de pago <span class="required">*</span></label>
                  <select class="form-select" name="medio" required>
                    <option value="">Selecciona el medio</option>${opcionesHtml(CATALOGOS.MEDIOS_PAGO)}
                  </select>
                </div>
                <div class="col-sm-6 col-lg-4">
                  <label class="form-label">Folio / referencia</label>
                  <input class="form-control" name="folio" maxlength="60" placeholder="Número de operación">
                </div>
              </div>

              <!-- Sección 2: quién la pidió, quién la pagó y si se facturó -->
              <h6 class="section-heading"><span class="number">2</span>Responsables y comprobación</h6>
              <div class="row g-3">
                <div class="col-sm-6 col-lg-4">
                  <label class="form-label">Solicitó <span class="required">*</span></label>
                  <input class="form-control" name="solicito" maxlength="80" placeholder="Nombre de quien solicita" required>
                </div>
                <div class="col-sm-6 col-lg-4">
                  <label class="form-label">Realizó la recarga <span class="required">*</span></label>
                  <input class="form-control" name="realizo" maxlength="80" placeholder="Nombre de quien pagó" required>
                </div>
                <div class="col-sm-6 col-lg-4">
                  <label class="form-label">Facturación</label>
                  <select class="form-select" name="facturacion">
                    <option value="">Selecciona el estado</option>${opcionesHtml(Object.keys(CATALOGOS.FACTURACION))}
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label">Observaciones</label>
                  <textarea class="form-control" name="observaciones" rows="2" maxlength="300" placeholder="Comentarios, incidencias o detalles relevantes"></textarea>
                </div>
              </div>
              <p class="small text-muted mt-3 mb-0">Los campos marcados con <span class="required">*</span> son obligatorios.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-success"><i class="bi bi-check-lg me-1"></i>Guardar registro</button>
            </div>
          </form>
        </div>
      </div>`;
    const el = wrap.firstElementChild;
    document.body.appendChild(el);
    modal = new bootstrap.Modal(el);
    form = el.querySelector('form');
    form.addEventListener('submit', submit);
  }

  // ---------- Validación y guardado ----------

  /**
   * Revisa los datos capturados.
   * @returns {string} Mensaje de error, o '' si todo está bien.
   */
  function validar(data) {
    if (!data.fecha) return 'Selecciona la fecha de recarga';
    if (data.fecha > todayISO()) return 'La fecha no puede ser futura';
    if (!(data.monto > 0)) return 'Ingresa un monto válido';
    if (!data.medio) return 'Selecciona el medio de pago';
    if (!data.solicito || !data.realizo) return 'Indica quién solicitó y quién realizó la recarga';
    return '';
  }

  /** Envío del formulario: valida, guarda en la API y cierra la ventana. */
  async function submit(e) {
    e.preventDefault();
    const data = leerFormulario(form);
    data.monto = Number(data.monto);
    data.vigencia = numeroOpcional(data.vigencia);

    const error = validar(data);
    if (error) return showFormError(form, error);

    data.lineaId = linea.id;
    try {
      if (recarga) {
        await Api.updateRecarga(recarga.id, data);
      } else {
        data.registradoPor = Session.nombre;
        await Api.createRecarga(data);
      }
      modal.hide();
      toast(recarga ? 'Recarga actualizada' : 'Recarga registrada');
      onSaved && onSaved();
    } catch (err) {
      showFormError(form, err.message);
    }
  }

  // ---------- API pública ----------

  /**
   * Abre la ventana.
   * @param {object} l              Línea que se recarga.
   * @param {Function} [callback]   Se llama después de guardar.
   * @param {object} [r]            Recarga a editar. Si se omite, es una recarga nueva
   *                                prellenada con la "recarga habitual" de la línea.
   */
  function open(l, callback, r) {
    if (!modal) build();
    linea = l;
    recarga = r || null;
    onSaved = callback;

    form.reset();
    showFormError(form, '');
    form.querySelector('[data-titulo]').textContent = recarga ? 'Editar recarga' : 'Registrar recarga';
    form.querySelector('[data-numero]').textContent = formatPhone(l.numero);
    form.querySelector('[data-compania]').textContent = l.compania;
    form.querySelector('[data-departamento]').textContent = l.departamento || '';
    form.fecha.max = todayISO();   // no se permiten fechas futuras

    if (recarga) {
      llenarFormulario(form, recarga);
    } else {
      llenarFormulario(form, {
        fecha: todayISO(),
        monto: l.montoPlan || '',
        vigencia: l.vigencia || '',
        paquete: l.paquete || '',
        realizo: Session.nombre,
        facturacion: 'Pendiente'
      });
    }
    modal.show();
  }

  return { open };
})();
