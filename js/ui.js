/**
 * ui.js
 * Utilidades de interfaz: toasts, modales, secciones
 * DTW135 – GT02 · AutoInventario v2
 */

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add('active');

  // cerrar menú móvil
  const nav = document.getElementById('navMenu');
  if (nav) nav.classList.remove('open');

  // acciones por sección
  if (id === 'dashboard') Dashboard.refresh();
  if (id === 'inventario') Inventario.render();
  if (id === 'mapa')       Mapa.init();
  if (id === 'clima')      { /* lazy load on button click */ }

  // marcar nav activo
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`.nav-link[data-section="${id}"]`);
  if (link) link.classList.add('active');
}

let _toastTimer = null;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent  = msg;
  t.className    = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3400);
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('show');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('show');
}

// Cerrar modal haciendo clic fuera
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('show');
  }
});
