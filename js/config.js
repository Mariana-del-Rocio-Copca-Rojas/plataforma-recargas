/* =========================================================
   config.js — Configuración general de la plataforma
   ---------------------------------------------------------
   Único lugar donde se cambian:
     · La conexión con el backend (API_CONFIG).
     · Los datos de la institución que se muestran en pantalla (APP).
     · Los catálogos de opciones de los formularios (CATALOGOS).

   Se carga ANTES que cualquier otro script de /js.
   ========================================================= */

/**
 * Conexión con el backend.
 *  - USE_MOCK = true  → modo demo: los datos se guardan en el localStorage del navegador.
 *  - USE_MOCK = false → se usa el backend REST que está en API_URL.
 */
const API_CONFIG = {
  USE_MOCK: true,
  API_URL: 'http://localhost:3000/api'
};

/** Datos de la institución (se usan en la barra superior y en los títulos de pestaña). */
const APP = {
  siglas: 'EAV',
  nombre: 'Estudios Aeronáuticos de Veracruz',
  titulo: 'Control de Recargas',
  sitioWeb: 'https://www.eav.edu.mx/'
};

/**
 * Catálogos de opciones de los formularios.
 * Para agregar o quitar una opción basta con editar estas listas:
 * todos los <select> que las usan se llenan automáticamente.
 */
const CATALOGOS = {
  /** Compañías telefónicas disponibles al registrar una línea. */
  COMPANIAS: ['Telcel', 'AT&T', 'Movistar', 'Bait', 'Unefon', 'BroMovil', 'Otra'],

  /** Medios con los que se puede pagar una recarga. */
  MEDIOS_PAGO: ['Efectivo', 'Tarjeta de débito', 'Tarjeta de crédito', 'Transferencia bancaria', 'Plataforma / portal', 'Otro'],

  /** Estados de facturación de una recarga, con el color (Bootstrap) de su etiqueta. */
  FACTURACION: {
    'Pendiente': 'warning',
    'Solicitada': 'info',
    'Facturada': 'success',
    'No requiere factura': 'secondary'
  }
};

/** Días antes del vencimiento en que una línea se marca como "Vence pronto". */
const DIAS_AVISO_VENCIMIENTO = 3;
