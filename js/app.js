/**
 * app.js
 * Punto de entrada – inicialización y event listeners
 * DTW135 – GT02 · AutoInventario v2
 */

document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
  Storage.setLastVisit();
  _setupNav();
  _setupForms();
  _setupSearch();
  showSection('dashboard');
  console.log('%c🚗 AutoInventario v2', 'font-size:16px;font-weight:bold;color:#e8372a');
  console.log('%cDTW135 · GT02 · 2026', 'font-size:12px;color:#9396a8');
});

function _setupNav() {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
  }
}

function _setupForms() {
  // Formulario de registro
  const regForm = document.getElementById('regForm');
  if (regForm) regForm.addEventListener('submit', e => Inventario.handleAdd(e));

  // Formulario de edición
  const editForm = document.getElementById('editForm');
  if (editForm) editForm.addEventListener('submit', e => Inventario.handleEdit(e));

  // Reset registro → limpiar GPS
  const btnReset = document.getElementById('btnReset');
  if (btnReset) btnReset.addEventListener('click', () => {
    document.getElementById('regGeoStatus').textContent = '';
    document.getElementById('lat').value  = '';
    document.getElementById('lng').value  = '';
  });
}

function _setupSearch() {
  const input = document.getElementById('searchInput');
  if (input) {
    let timer;
    input.addEventListener('keyup', () => {
      clearTimeout(timer);
      timer = setTimeout(() => Inventario.buscar(input.value), 280);
    });
  }
}
