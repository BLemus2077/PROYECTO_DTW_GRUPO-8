// api.js que muestra el clima actual

const WMO = {
  0 : { label:'Despejado',             icon:'☀️'  },
  1 : { label:'Principalmente despejado', icon:'🌤' },
  2 : { label:'Parcialmente nublado',  icon:'⛅' },
  3 : { label:'Nublado',              icon:'☁️'  },
  45: { label:'Neblina',              icon:'🌫'  },
  48: { label:'Neblina con escarcha', icon:'🌫'  },
  51: { label:'Llovizna leve',        icon:'🌦'  },
  61: { label:'Lluvia leve',          icon:'🌧'  },
  63: { label:'Lluvia moderada',      icon:'🌧'  },
  65: { label:'Lluvia fuerte',        icon:'🌧'  },
  80: { label:'Chubascos',            icon:'🌦'  },
  95: { label:'Tormenta eléctrica',   icon:'⛈'  },
};

async function cargarClima() {
  const el = document.getElementById('climaResult');
  el.innerHTML = '<div class="loading-spin"></div> Obteniendo ubicación y clima…';

  try {
    const coords = await new Promise((res) => {
      if (!navigator.geolocation) {
        res({ lat: 13.6929, lng: -89.2182, fallback: true });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res({ lat: 13.6929, lng: -89.2182, fallback: true }),
        { timeout: 8000 }
      );
    });

    const url = `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${coords.lat}&longitude=${coords.lng}` +
      `&current_weather=true&hourly=relative_humidity_2m` +
      `&timezone=America%2FEl_Salvador&forecast_days=1`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const cw   = data.current_weather;
    const wmo  = WMO[cw.weathercode] || { label:'Variable', icon:'🌡' };

    const hIdx = data.hourly.time.findIndex(t => t.startsWith(cw.time.slice(0,13)));
    const hum  = hIdx >= 0 ? data.hourly.relative_humidity_2m[hIdx] + '%' : '—';
    const loc  = coords.fallback ? 'San Salvador (predeterminado)' :
                 `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`;

    el.innerHTML = `
      <div class="clima-card">
        <div class="clima-loc">📍 ${loc}</div>
        <div class="clima-icon">${wmo.icon}</div>
        <div class="clima-temp">${cw.temperature}°C</div>
        <div class="clima-desc">${wmo.label}</div>
        <div class="clima-meta">
          <span>💨 ${cw.windspeed} km/h</span>
          <span>💧 ${hum}</span>
          <span>🕐 ${new Date(cw.time).toLocaleTimeString('es-SV',{hour:'2-digit',minute:'2-digit'})}</span>
        </div>
      </div>
      <p class="api-note">Fuente: Open-Meteo · Fetch API · JSON</p>`;
  } catch (err) {
    el.innerHTML = `<span class="api-error">⚠️ Error al obtener el clima: ${err.message}</span>`;
  }
}
