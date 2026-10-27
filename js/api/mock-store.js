/* =========================================================
   api/mock-store.js — "Base de datos" del modo demo
   ---------------------------------------------------------
   Guarda todo en el localStorage del navegador bajo una sola
   clave, con esta forma:

     { campus: [], lineas: [], recargas: [], usuarios: [] }

   Solo lo usa api/mock-api.js. Las páginas NUNCA leen el
   localStorage directamente: siempre pasan por `Api`.
   ========================================================= */

const MockStore = (() => {
  /** Clave del localStorage. Cambiarla equivale a empezar con una base nueva. */
  const DB_KEY = 'recargas_db_v2';

  /** Base inicial: vacía, salvo el usuario administrador de prueba. */
  function seed() {
    const usuarios = [
      { id: 'u1', nombre: 'Administrador', email: 'admin@demo.com', password: 'admin123', rol: 'admin' }
    ];
    return { campus: [], lineas: [], recargas: [], usuarios };
  }

  /**
   * Lee la base completa. Si no existe o está dañada, crea una nueva.
   * @returns {{campus: Array, lineas: Array, recargas: Array, usuarios: Array}}
   */
  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* datos corruptos: se regeneran abajo */ }
    const db = seed();
    save(db);
    return db;
  }

  /** Guarda la base completa. */
  function save(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  /** Borra todos los datos del modo demo. */
  function reset() {
    localStorage.removeItem(DB_KEY);
  }

  return { load, save, reset };
})();
