/* =========================================================
   ui/notificaciones.js — Avisos y confirmaciones
   ---------------------------------------------------------
     · toast()     → aviso pequeño en la esquina que se va solo.
     · confirmar() → ventana "¿Seguro?" con Cancelar / Aceptar.
   Ambos usan componentes de Bootstrap 5.
   ========================================================= */

/**
 * Muestra un aviso temporal (3 segundos) en la esquina inferior derecha.
 * @param {string} message Texto del aviso.
 * @param {'success'|'danger'|'warning'|'info'|'secondary'} [type='success'] Color.
 */
function toast(message, type = 'success') {
  // El contenedor se crea la primera vez y se reutiliza
  let box = document.getElementById('toastBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toastBox';
    box.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${escapeHtml(message)}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  box.appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 3000 });
  el.addEventListener('hidden.bs.toast', () => el.remove());
  t.show();
}

/**
 * Pide confirmación al usuario con una ventana modal.
 * @param {string} mensaje Pregunta a mostrar.
 * @param {string} [textoBoton='Eliminar'] Texto del botón de aceptar.
 * @returns {Promise<boolean>} true si el usuario aceptó.
 * @example
 *   if (await confirmar('¿Eliminar esta línea?')) { ... }
 */
function confirmar(mensaje, textoBoton = 'Eliminar') {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content">
            <div class="modal-body text-center p-4">
              <i class="bi bi-exclamation-triangle text-warning display-6"></i>
              <p class="mt-3 mb-0">${escapeHtml(mensaje)}</p>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0">
              <button class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-danger" data-ok>${escapeHtml(textoBoton)}</button>
            </div>
          </div>
        </div>
      </div>`;
    const modalEl = wrap.firstElementChild;
    document.body.appendChild(modalEl);
    const modal = new bootstrap.Modal(modalEl);
    let ok = false;
    modalEl.querySelector('[data-ok]').addEventListener('click', () => { ok = true; modal.hide(); });
    // Al cerrarse (por cualquier botón o tecla Esc) se elimina del DOM y se responde
    modalEl.addEventListener('hidden.bs.modal', () => { modalEl.remove(); resolve(ok); });
    modal.show();
  });
}
