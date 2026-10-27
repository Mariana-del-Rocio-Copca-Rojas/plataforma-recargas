/* =========================================================
   api/mock-api.js — Implementación DEMO de la API
   ---------------------------------------------------------
   Imita al backend usando MockStore (localStorage).
   Tiene exactamente las mismas funciones que RemoteApi y
   devuelve Promesas, para que las páginas no noten la
   diferencia entre el modo demo y el backend real.
   ========================================================= */

const MockApi = (() => {
  // ---------- Utilidades internas ----------

  /** Genera un id único corto, ej. "lq3k9x2ab1c". */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /**
   * Simula la latencia de la red (150 ms) y devuelve una COPIA de los datos,
   * para que quien los reciba no pueda modificar la base por accidente.
   */
  const delay = (data) => new Promise((res) => setTimeout(() => res(structuredClone(data)), 150));

  /** Respuesta de error, igual que haría el backend. */
  const fail = (msg) => Promise.reject(new Error(msg));

  const { load, save } = MockStore;

  // ---------- Autenticación ----------

  /** Valida correo y contraseña. Devuelve { token, user } sin la contraseña. */
  function login(email, password) {
    const user = load().usuarios.find((u) => u.email === email && u.password === password);
    if (!user) return fail('Correo o contraseña incorrectos');
    const { password: _, ...publicUser } = user;
    return delay({ token: 'demo-' + uid(), user: publicUser });
  }

  // ---------- Campus ----------

  function getCampus() {
    return delay(load().campus);
  }

  function getCampusById(id) {
    const c = load().campus.find((x) => x.id === id);
    return c ? delay(c) : fail('Campus no encontrado');
  }

  function createCampus(data) {
    const db = load();
    const nuevo = { id: uid(), ...data };
    db.campus.push(nuevo);
    save(db);
    return delay(nuevo);
  }

  /** Elimina el campus junto con sus líneas y las recargas de esas líneas. */
  function deleteCampus(id) {
    const db = load();
    const lineaIds = db.lineas.filter((l) => l.campusId === id).map((l) => l.id);
    db.campus = db.campus.filter((c) => c.id !== id);
    db.lineas = db.lineas.filter((l) => l.campusId !== id);
    db.recargas = db.recargas.filter((r) => !lineaIds.includes(r.lineaId));
    save(db);
    return delay(null);
  }

  // ---------- Líneas ----------

  /** Sin campusId devuelve todas las líneas; con campusId, solo las de ese campus. */
  function getLineas(campusId) {
    const db = load();
    return delay(campusId ? db.lineas.filter((l) => l.campusId === campusId) : db.lineas);
  }

  function getLinea(id) {
    const l = load().lineas.find((x) => x.id === id);
    return l ? delay(l) : fail('Línea no encontrada');
  }

  /** El número telefónico debe ser único en toda la plataforma. */
  function createLinea(data) {
    const db = load();
    if (db.lineas.some((l) => l.numero === data.numero)) return fail('Ese número ya está registrado');
    const nueva = { id: uid(), ...data };
    db.lineas.push(nueva);
    save(db);
    return delay(nueva);
  }

  function updateLinea(id, data) {
    const db = load();
    const i = db.lineas.findIndex((l) => l.id === id);
    if (i < 0) return fail('Línea no encontrada');
    if (db.lineas.some((l) => l.numero === data.numero && l.id !== id)) return fail('Ese número ya está registrado');
    db.lineas[i] = { ...db.lineas[i], ...data };
    save(db);
    return delay(db.lineas[i]);
  }

  /** Elimina la línea y todo su historial de recargas. */
  function deleteLinea(id) {
    const db = load();
    db.lineas = db.lineas.filter((l) => l.id !== id);
    db.recargas = db.recargas.filter((r) => r.lineaId !== id);
    save(db);
    return delay(null);
  }

  // ---------- Recargas ----------

  /** Sin lineaId devuelve todas; con lineaId, solo las de esa línea. Siempre de la más reciente a la más antigua. */
  function getRecargas(lineaId) {
    const db = load();
    const list = lineaId ? db.recargas.filter((r) => r.lineaId === lineaId) : db.recargas;
    return delay(list.sort((a, b) => b.fecha.localeCompare(a.fecha)));
  }

  function createRecarga(data) {
    const db = load();
    const nueva = { id: uid(), ...data };
    db.recargas.push(nueva);
    save(db);
    return delay(nueva);
  }

  function updateRecarga(id, data) {
    const db = load();
    const i = db.recargas.findIndex((r) => r.id === id);
    if (i < 0) return fail('Recarga no encontrada');
    db.recargas[i] = { ...db.recargas[i], ...data };
    save(db);
    return delay(db.recargas[i]);
  }

  function deleteRecarga(id) {
    const db = load();
    db.recargas = db.recargas.filter((r) => r.id !== id);
    save(db);
    return delay(null);
  }

  return {
    login,
    getCampus, getCampusById, createCampus, deleteCampus,
    getLineas, getLinea, createLinea, updateLinea, deleteLinea,
    getRecargas, createRecarga, updateRecarga, deleteRecarga
  };
})();
