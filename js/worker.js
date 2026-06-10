/**
 * worker.js
 * Web Worker – Procesamiento intensivo en segundo plano
 * DTW135 – GT02 · AutoInventario v2
 */

self.addEventListener('message', (e) => {
  try {
    const { type, payload } = e.data;

    if (type === 'CALC_STATS') {
      const stats = calcularEstadisticas(payload);
      self.postMessage({ type: 'STATS_READY', payload: stats });
    }

    if (type === 'DEPRECIATION_BATCH') {
      const results = payload.map(v => calcularDepreciacion(v));
      self.postMessage({ type: 'DEPRECIATION_READY', payload: results });
    }

  } catch (err) {
    self.postMessage({ type: 'WORKER_ERROR', payload: err.message });
  }
});

function calcularEstadisticas(vehiculos) {
  const total      = vehiculos.length;
  const disponible = vehiculos.filter(v => v.estado === 'Disponible').length;
  const vendido    = vehiculos.filter(v => v.estado === 'Vendido').length;
  const reservado  = vehiculos.filter(v => v.estado === 'Reservado').length;

  const precios    = vehiculos.map(v => parseFloat(v.precio) || 0);
  const valorTotal = precios.reduce((a, b) => a + b, 0);
  const precioMin  = total ? Math.min(...precios) : 0;
  const precioMax  = total ? Math.max(...precios) : 0;
  const precioProm = total ? valorTotal / total : 0;
  const mediana    = total ? calcMediana(precios) : 0;

  // Agrupar por marca (top 7)
  const marcasMap = {};
  vehiculos.forEach(v => {
    const m = (v.marca || 'Otro').trim();
    marcasMap[m] = (marcasMap[m] || 0) + 1;
  });
  const marcas = Object.entries(marcasMap).sort((a, b) => b[1] - a[1]).slice(0, 7);

  // Agrupar por año
  const aniosMap = {};
  vehiculos.forEach(v => {
    if (v.anio) aniosMap[v.anio] = (aniosMap[v.anio] || 0) + 1;
  });
  const anios = Object.entries(aniosMap).sort((a, b) => a[0] - b[0]);

  // Agrupar por departamento
  const deptMap = {};
  vehiculos.forEach(v => {
    if (v.departamento) deptMap[v.departamento] = (deptMap[v.departamento] || 0) + 1;
  });
  const deptos = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);

  // Agrupar por tipo
  const tipoMap = {};
  vehiculos.forEach(v => {
    const t = v.tipo || 'Otro';
    tipoMap[t] = (tipoMap[t] || 0) + 1;
  });
  const tipos = Object.entries(tipoMap).sort((a, b) => b[1] - a[1]);

  // Categorías de precio
  const economicos = vehiculos.filter(v => v.precio < 15000).length;
  const estandar   = vehiculos.filter(v => v.precio >= 15000 && v.precio < 30000).length;
  const premium    = vehiculos.filter(v => v.precio >= 30000 && v.precio < 60000).length;
  const lujo       = vehiculos.filter(v => v.precio >= 60000).length;

  return {
    total, disponible, vendido, reservado,
    valorTotal, precioMin, precioMax, precioProm, mediana,
    marcas, anios, deptos, tipos,
    categorias: { economicos, estandar, premium, lujo },
    estados: [disponible, vendido, reservado],
    ubicaciones: Object.keys(deptMap).length,
    procesadoEn: new Date().toLocaleTimeString('es-SV')
  };
}

function calcMediana(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calcularDepreciacion(vehiculo) {
  const edad = new Date().getFullYear() - vehiculo.anio;
  let depr = 0;
  if (edad >= 1) depr = 0.15;
  if (edad >= 2) depr = 0.15 + Math.min(edad - 1, 10) * 0.08;
  return {
    id: vehiculo.id,
    placa: vehiculo.placa,
    valorEstimado: Math.round(vehiculo.precio * (1 - depr)),
    depreciacion: Math.round(depr * 100),
    categoria: vehiculo.precio < 15000 ? 'Económico'
             : vehiculo.precio < 30000 ? 'Estándar'
             : vehiculo.precio < 60000 ? 'Premium' : 'Lujo'
  };
}

console.log('[Worker] AutoInventario Web Worker v2 listo.');
