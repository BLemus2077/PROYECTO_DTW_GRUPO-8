// Mapa interactivo de El Salvador con Leaflet
//Marcadores por vehículo + panel de estadísticas por departamento

const ESTADO_COLORS = {
  'Disponible' : '#2ecc71',
  'Vendido'    : '#3498db',
  'Reservado'  : '#f1c40f',
};

// Coordenadas de referencia por departamento (centros aproximados)
const DEPT_COORDS = {
  'San Salvador'  : [13.6929, -89.2182],
  'Santa Ana'     : [13.9942, -89.5597],
  'San Miguel'    : [13.4833, -88.1833],
  'La Libertad'   : [13.6713, -89.3043],
  'Sonsonate'     : [13.7197, -89.7249],
  'Usulután'      : [13.3500, -88.4333],
  'La Paz'        : [13.4901, -88.9004],
  'Chalatenango'  : [14.0396, -88.9332],
  'Cuscatlán'     : [13.7271, -88.9528],
  'La Unión'      : [13.3320, -87.8440],
  'Morazán'       : [13.7688, -88.1282],
  'Cabañas'       : [13.8771, -88.7521],
  'San Vicente'   : [13.6436, -88.7858],
  'Ahuachapán'    : [13.9186, -89.8450],
};

const Mapa = {
  _instance  : null,
  _markers   : [],
  _deptLayer : null,
  _initialized: false,

  init() {
    const container = document.getElementById('mapaSV');
    if (!container) return;

    // Reinicializar si ya existe
    if (this._instance) {
      this._instance.invalidateSize();
      this.refresh();
      return;
    }

    this._instance = L.map('mapaSV', { zoomControl: true }).setView([13.7942, -88.8965], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution : '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom     : 18,
    }).addTo(this._instance);

    this._initialized = true;
    this.refresh();
  },

  refresh() {
    if (!this._instance) return;

    // Limpiar marcadores anteriores
    this._markers.forEach(m => this._instance.removeLayer(m));
    this._markers = [];

    const vehiculos = Storage.getAll();
    this._renderMarkers(vehiculos);
    this._renderDeptStats(vehiculos);
    this._renderLeyenda();
  },

  _crearIcon(estado) {
    const color = ESTADO_COLORS[estado] || '#e8372a';
    return L.divIcon({
      html: `<div style="
        background:${color};width:16px;height:16px;
        border-radius:50%;border:3px solid rgba(255,255,255,.9);
        box-shadow:0 2px 8px rgba(0,0,0,.45);cursor:pointer;
      "></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -10], className: '',
    });
  },

  _renderMarkers(vehiculos) {
    let count = 0;
    vehiculos.forEach(v => {
      // Si el vehículo tiene coordenadas propias, usarlas; si no, usar centro del departamento
      let lat = parseFloat(v.lat);
      let lng = parseFloat(v.lng);

      if ((!lat || !lng) && v.departamento && DEPT_COORDS[v.departamento]) {
        const coords = DEPT_COORDS[v.departamento];
        // Pequeño offset aleatorio para no apilar marcadores del mismo depto
        lat = coords[0] + (Math.random() - 0.5) * 0.05;
        lng = coords[1] + (Math.random() - 0.5) * 0.05;
      }

      if (!lat || !lng) return;
      count++;

      const marker = L.marker([lat, lng], { icon: this._crearIcon(v.estado) });

      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif;min-width:190px;">
          <div style="font-weight:800;font-size:14px;margin-bottom:3px;">${v.marca} ${v.modelo}</div>
          <div style="font-family:monospace;font-size:12px;color:#e8372a;margin-bottom:6px;">${v.placa}</div>
          <table style="font-size:12px;width:100%;border-collapse:collapse;">
            <tr><td style="color:#666;padding:2px 8px 2px 0">Año</td><td><b>${v.anio}</b></td></tr>
            <tr><td style="color:#666;padding:2px 8px 2px 0">Color</td><td>${v.color}</td></tr>
            <tr><td style="color:#666;padding:2px 8px 2px 0">Precio</td><td style="color:#2ecc71;font-weight:700">$${Number(v.precio).toLocaleString()}</td></tr>
            <tr><td style="color:#666;padding:2px 8px 2px 0">Estado</td><td style="color:${ESTADO_COLORS[v.estado]||'#fff'};font-weight:700">${v.estado}</td></tr>
            <tr><td style="color:#666;padding:2px 8px 2px 0">Depto.</td><td>${v.departamento||'—'}</td></tr>
          </table>
          ${v.direccion ? `<div style="font-size:11px;color:#888;margin-top:6px;border-top:1px solid #eee;padding-top:5px;">📍 ${v.direccion}</div>` : ''}
        </div>
      `, { maxWidth: 230 });

      marker.addTo(this._instance);
      this._markers.push(marker);
    });

    const info = document.getElementById('mapaInfo');
    if (info) info.textContent = count
      ? `📍 ${count} vehículo${count !== 1 ? 's' : ''} en el mapa. Haz clic en un marcador para ver detalles.`
      : 'No hay vehículos con ubicación registrada. Registra uno para verlo en el mapa.';
  },

  _renderDeptStats(vehiculos) {
    const deptEl = document.getElementById('mapaDeptStats');
    if (!deptEl) return;

    const deptMap = {};
    vehiculos.forEach(v => {
      const d = v.departamento || 'Sin depto.';
      if (!deptMap[d]) deptMap[d] = { total: 0, disp: 0, vend: 0, res: 0 };
      deptMap[d].total++;
      if (v.estado === 'Disponible') deptMap[d].disp++;
      if (v.estado === 'Vendido')    deptMap[d].vend++;
      if (v.estado === 'Reservado')  deptMap[d].res++;
    });

    const sorted = Object.entries(deptMap).sort((a, b) => b[1].total - a[1].total);

    if (!sorted.length) {
      deptEl.innerHTML = '<p class="empty-hint">Sin datos por departamento.</p>';
      return;
    }

    const maxTotal = sorted[0][1].total;
    deptEl.innerHTML = sorted.map(([dept, d]) => {
      const pct = Math.round((d.total / maxTotal) * 100);
      return `
        <div class="dept-row" onclick="Mapa.irADepto('${dept}')">
          <div class="dept-header">
            <span class="dept-name">📍 ${dept}</span>
            <span class="dept-count">${d.total} vehículo${d.total !== 1 ? 's' : ''}</span>
          </div>
          <div class="dept-bar-wrap">
            <div class="dept-bar" style="width:${pct}%"></div>
          </div>
          <div class="dept-badges">
            <span class="badge badge-disp">${d.disp} disp.</span>
            <span class="badge badge-vend">${d.vend} vend.</span>
            <span class="badge badge-res">${d.res} res.</span>
          </div>
        </div>`;
    }).join('');
  },

  irADepto(dept) {
    if (!this._instance || !DEPT_COORDS[dept]) return;
    this._instance.flyTo(DEPT_COORDS[dept], 11, { animate: true, duration: 1 });
  },

  _renderLeyenda() {
    const el = document.getElementById('mapaLeyenda');
    if (!el) return;
    el.innerHTML = Object.entries(ESTADO_COLORS).map(([e, c]) => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${c}"></div>
        <span>${e}</span>
      </div>`).join('');
  },
};
