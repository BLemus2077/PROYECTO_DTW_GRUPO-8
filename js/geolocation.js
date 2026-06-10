/**
 * geolocation.js
 * Geolocalización GPS para formularios
 * DTW135 – GT02 · AutoInventario v2
 */

function obtenerGPS(latId, lngId, statusId) {
  const statusEl = document.getElementById(statusId);
  if (!navigator.geolocation) {
    if (statusEl) statusEl.textContent = '❌ Geolocalización no soportada.';
    showToast('Geolocalización no soportada', 'warning');
    return;
  }
  if (statusEl) statusEl.textContent = '⏳ Obteniendo ubicación GPS…';

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      const latEl = document.getElementById(latId);
      const lngEl = document.getElementById(lngId);
      if (latEl) latEl.value = latitude.toFixed(6);
      if (lngEl) lngEl.value = longitude.toFixed(6);
      if (statusEl) statusEl.textContent =
        `✅ GPS obtenido: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      showToast('Ubicación GPS capturada', 'success');
    },
    err => {
      const msgs = { 1: 'Permiso denegado', 2: 'Posición no disponible', 3: 'Tiempo agotado' };
      const msg  = msgs[err.code] || 'Error desconocido';
      if (statusEl) statusEl.textContent = `❌ ${msg}`;
      showToast(msg, 'error');
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}
