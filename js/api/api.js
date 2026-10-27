/* =========================================================
   api/api.js — Punto de entrada de la capa de datos
   ---------------------------------------------------------
   Elige la implementación según API_CONFIG.USE_MOCK:
     · true  → MockApi   (localStorage, modo demo)
     · false → RemoteApi (backend REST)

   Las páginas SOLO usan `Api.xxx()`; nunca MockApi ni
   RemoteApi directamente. Así, conectar el backend real es
   cambiar una línea en config.js.

   Funciones disponibles (todas devuelven una Promesa):
     login(email, password)
     getCampus()            getCampusById(id)
     createCampus(data)     deleteCampus(id)
     getLineas([campusId])  getLinea(id)
     createLinea(data)      updateLinea(id, data)    deleteLinea(id)
     getRecargas([lineaId]) createRecarga(data)
     updateRecarga(id, data) deleteRecarga(id)
   ========================================================= */

const Api = API_CONFIG.USE_MOCK
  ? { ...MockApi, resetDemo: MockStore.reset }
  : RemoteApi;
