/* =========================================================
   ui/formularios.js — Ayudantes para formularios
   ---------------------------------------------------------
   Funciones genéricas para leer, llenar y mostrar errores en
   cualquier <form>. Los campos se identifican por su atributo
   `name`, que coincide con el nombre del dato en la API
   (ej. <input name="numero"> ↔ linea.numero).
   ========================================================= */

/**
 * Lee todos los campos de un formulario como objeto, sin espacios sobrantes.
 * @param {HTMLFormElement} form
 * @returns {Object<string, string>} Ej. { numero: "2291234567", compania: "BroMovil", ... }
 */
function leerFormulario(form) {
  const data = Object.fromEntries(new FormData(form));
  for (const k in data) data[k] = String(data[k]).trim();
  return data;
}

/**
 * Llena un formulario con los valores de un objeto (para editar un registro).
 * Solo se llenan las propiedades que tengan un campo con el mismo `name`.
 * @param {HTMLFormElement} form
 * @param {object} valores
 */
function llenarFormulario(form, valores) {
  for (const [k, v] of Object.entries(valores)) {
    if (form.elements[k]) form.elements[k].value = v ?? '';
  }
}

/**
 * Agrega opciones a un <select> a partir de una lista de textos.
 * Conserva las opciones que ya tenga (ej. "Selecciona una compañía").
 * @param {HTMLSelectElement} select
 * @param {string[]} opciones
 */
function llenarSelect(select, opciones) {
  select.insertAdjacentHTML('beforeend', opcionesHtml(opciones));
}

/**
 * @param {string[]} lista
 * @returns {string} HTML con un <option> por elemento.
 */
const opcionesHtml = (lista) => lista.map((o) => `<option>${escapeHtml(o)}</option>`).join('');

/**
 * Muestra (o limpia) el mensaje de error de un formulario.
 * El formulario debe tener un <div class="form-error"> dentro.
 * @param {HTMLFormElement} form
 * @param {string} msg Mensaje; '' para ocultarlo.
 */
function showFormError(form, msg) {
  const el = form.querySelector('.form-error');
  el.textContent = msg;
  el.classList.toggle('d-none', !msg);
}

/**
 * Convierte a número un campo opcional.
 * @param {string} valor Texto capturado.
 * @param {*} [vacio=''] Qué devolver si el campo está vacío.
 * @returns {number|*}
 */
const numeroOpcional = (valor, vacio = '') => (valor ? Number(valor) : vacio);
