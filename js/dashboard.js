// Dashboard – métricas, gráficas canvas, Web Worker

const COLORS = {
  disponible : '#16a34a',
  vendido    : '#2563eb',
  reservado  : '#ca8a04',
  palette    : ['#2563eb','#16a34a','#dc2626','#ca8a04','#7c3aed','#0891b2','#ea580c','#db2777'],
  bg         : '#ffffff',
  text       : '#1e293b',
  subtext    : '#64748b',
  grid       : 'rgba(148,163,184,0.2)',
};

const Dashboard = {
  worker: null,

  refresh() {
    this._initWorker();
    const vehiculos = Storage.getAll();
    if (this.worker) {
      this.worker.postMessage({ type: 'CALC_STATS', payload: vehiculos });
    } else {
      this._renderStats(this._calcLocal(vehiculos));
    }
    this._renderRecientes(vehiculos);
    document.getElementById('lastVisit').textContent = Storage.getLastVisit();
  },

  _initWorker() {
    if (this.worker) return;
    try {
      this.worker = new Worker('js/worker.js');
      this.worker.onmessage = e => {
        const { type, payload } = e.data;
        if (type === 'STATS_READY') this._renderStats(payload);
      };
      this.worker.onerror = () => { this.worker = null; };
      document.getElementById('workerBadge').innerHTML =
        '<span class="worker-dot"></span> Web Worker activo · procesando en segundo plano';
    } catch { this.worker = null; }
  },

  _calcLocal(vs) {
    const total      = vs.length;
    const disponible = vs.filter(v => v.estado === 'Disponible').length;
    const vendido    = vs.filter(v => v.estado === 'Vendido').length;
    const reservado  = vs.filter(v => v.estado === 'Reservado').length;
    const precios    = vs.map(v => +v.precio || 0);
    const valorTotal = precios.reduce((a, b) => a + b, 0);
    const marcasMap  = {}; vs.forEach(v => { const m = v.marca||'Otro'; marcasMap[m]=(marcasMap[m]||0)+1; });
    const aniosMap   = {}; vs.forEach(v => { if(v.anio) aniosMap[v.anio]=(aniosMap[v.anio]||0)+1; });
    const deptMap    = {}; vs.forEach(v => { if(v.departamento) deptMap[v.departamento]=(deptMap[v.departamento]||0)+1; });
    return {
      total, disponible, vendido, reservado, valorTotal,
      estados: [disponible, vendido, reservado],
      marcas : Object.entries(marcasMap).sort((a,b)=>b[1]-a[1]).slice(0,7),
      anios  : Object.entries(aniosMap).sort((a,b)=>a[0]-b[0]),
      deptos : Object.entries(deptMap).sort((a,b)=>b[1]-a[1]),
      ubicaciones: Object.keys(deptMap).length,
      procesadoEn: new Date().toLocaleTimeString('es-SV'),
    };
  },

  _renderStats(s) {
    this._anim('metTotal', s.total);
    this._anim('metDisp',  s.disponible);
    this._anim('metVend',  s.vendido);
    this._anim('metRes',   s.reservado);
    this._anim('metUbic',  s.ubicaciones);
    const el = document.getElementById('metValor');
    if (el) el.textContent = '$' + Number(s.valorTotal||0).toLocaleString('es-SV',{maximumFractionDigits:0});

    const wb = document.getElementById('workerBadge');
    if (wb) wb.innerHTML = `<span class="worker-dot"></span> Web Worker · procesado a las ${s.procesadoEn}`;

    this._drawDonut('chartEstados',
      ['Disponible','Vendido','Reservado'], s.estados,
      [COLORS.disponible, COLORS.vendido, COLORS.reservado]);

    if (s.marcas?.length)
      this._drawBars('chartMarcas', s.marcas.map(m=>m[0]), s.marcas.map(m=>m[1]), COLORS.palette);

    if (s.anios?.length)
      this._drawBars('chartAnios', s.anios.map(a=>a[0]), s.anios.map(a=>a[1]), [COLORS.vendido]);

    if (s.deptos?.length)
      this._drawBars('chartDeptos', s.deptos.slice(0,8).map(d=>d[0]), s.deptos.slice(0,8).map(d=>d[1]), ['#7c3aed']);
  },

  _anim(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent.replace(/\D/g,'')) || 0;
    const dur = 600, ts0 = performance.now();
    const step = ts => {
      const p = Math.min((ts - ts0) / dur, 1);
      el.textContent = Math.round(start + (target - start) * p);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  _drawDonut(id, labels, values, colors) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const total = values.reduce((a,b)=>a+b,0);
    if (!total) {
      ctx.fillStyle = COLORS.subtext; ctx.font = '13px Inter,system-ui,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('Sin datos', W/2 - 40, H/2); return;
    }
    const cx = W/2 - 50, cy = H/2;
    const r  = Math.min(cx, cy) - 10;
    const ri = r * 0.52;
    let angle = -Math.PI / 2;
    values.forEach((val, i) => {
      const slice = (val / total) * 2 * Math.PI;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice); ctx.closePath();
      ctx.fillStyle = colors[i % colors.length]; ctx.fill();
      angle += slice;
    });
    ctx.beginPath(); ctx.arc(cx, cy, ri, 0, 2*Math.PI);
    ctx.fillStyle = COLORS.bg; ctx.fill();
    ctx.fillStyle = COLORS.text; ctx.font = '700 19px Inter,system-ui,sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(total, cx, cy + 5);
    ctx.fillStyle = COLORS.subtext; ctx.font = '11px Inter,system-ui,sans-serif';
    ctx.fillText('total', cx, cy + 19);
    const lx = W - 105;
    labels.forEach((lbl, i) => {
      const ly = H/2 - ((labels.length - 1) * 11) + i * 22;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(lx, ly, 11, 11, 3); else ctx.rect(lx, ly, 11, 11); ctx.fill();
      ctx.fillStyle = COLORS.subtext; ctx.font = '11.5px Inter,system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${lbl} (${values[i]})`, lx + 16, ly + 10);
    });
  },

  _drawBars(id, labels, values, colors) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (!values?.length) return;
    const max = Math.max(...values, 1);
    const padL = 28, padB = 26, padT = 16, padR = 8;
    const chartW = W - padL - padR;
    const chartH = H - padB - padT;
    const barGap = 5;
    const barW   = Math.max(8, Math.floor(chartW / values.length) - barGap);
    const lines  = 4;
    ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= lines; i++) {
      const y = padT + chartH - (i / lines) * chartH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillStyle = COLORS.subtext; ctx.font = '9px Inter,system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((i / lines) * max), padL - 3, y + 3);
    }
    values.forEach((val, i) => {
      const x    = padL + i * (barW + barGap) + (chartW - values.length * (barW + barGap)) / 2;
      const barH = Math.max(2, Math.round((val / max) * chartH));
      const y    = padT + chartH - barH;
      const c    = colors[i % colors.length];
      const grad = ctx.createLinearGradient(x, y, x, padT + chartH);
      grad.addColorStop(0, c); grad.addColorStop(1, c + '44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, [4,4,0,0]); else ctx.rect(x, y, barW, barH);
      ctx.fill();
      ctx.fillStyle = COLORS.text; ctx.font = '600 9.5px Inter,system-ui,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(val, x + barW/2, y - 4);
      ctx.fillStyle = COLORS.subtext; ctx.font = '9.5px Inter,system-ui,sans-serif';
      const lbl = String(labels[i]).length > 8 ? String(labels[i]).slice(0,7)+'…' : String(labels[i]);
      ctx.fillText(lbl, x + barW/2, H - 5);
    });
  },

  _renderRecientes(vehiculos) {
    const el = document.getElementById('listaRecientes');
    if (!el) return;
    const recientes = [...vehiculos].reverse().slice(0, 6);
    if (!recientes.length) { el.innerHTML = '<p class="empty-hint">No hay vehículos registrados aún.</p>'; return; }
    el.innerHTML = recientes.map(v => {
      const cls = {Disponible:'badge-disp',Vendido:'badge-vend',Reservado:'badge-res'}[v.estado]||'';
      return `<div class="reciente-item">
        <div class="reciente-placa">${v.placa}</div>
        <div class="reciente-info">${v.marca} ${v.modelo} · <span class="reciente-dept">📍${v.departamento||'—'}</span></div>
        <span class="badge ${cls}">${v.estado}</span>
      </div>`;
    }).join('');
  }
};
