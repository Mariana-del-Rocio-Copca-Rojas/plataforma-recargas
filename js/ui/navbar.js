/* =========================================================
   ui/navbar.js — Barra de navegación superior
   ---------------------------------------------------------
   Cada página privada tiene un <div id="app-navbar"></div>;
   renderNavbar() lo llena con el logo de EAV y el menú del
   usuario (Dashboard / Cerrar sesión).
   ========================================================= */

/** Pinta la barra superior dentro de #app-navbar. */
function renderNavbar() {
  const nombre = Session.nombre || 'Usuario';
  document.getElementById('app-navbar').innerHTML = `
    <nav class="navbar navbar-expand navbar-dark bg-primary shadow-sm">
      <div class="container-fluid px-3 px-md-4">
        <a class="navbar-brand d-flex align-items-center gap-2" href="dashboard.html">
          <span class="brand-badge">${escapeHtml(APP.siglas)}</span>
          <span class="fw-semibold">${escapeHtml(APP.titulo)}</span><span class="d-none d-md-inline small opacity-75 ms-1">· ${escapeHtml(APP.nombre)}</span>
        </a>
        <div class="dropdown ms-auto">
          <button class="btn btn-outline-light btn-sm dropdown-toggle" data-bs-toggle="dropdown">
            <i class="bi bi-person-circle me-1"></i><span class="d-none d-sm-inline">${escapeHtml(nombre)}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="dashboard.html"><i class="bi bi-grid me-2"></i>Dashboard</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item text-danger" id="btnLogout"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</button></li>
          </ul>
        </div>
      </div>
    </nav>`;
  document.getElementById('btnLogout').addEventListener('click', () => Session.end());
}

/**
 * Cambia el título de la pestaña del navegador.
 * @param {string} texto Ej. "Campus Veracruz" → "Campus Veracruz · EAV Recargas"
 */
function setPageTitle(texto) {
  document.title = `${texto} · ${APP.siglas} Recargas`;
}
