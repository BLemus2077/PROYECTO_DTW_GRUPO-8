/**
 * storage.js
 * Módulo de almacenamiento: LocalStorage + SessionStorage
 * DTW135 – GT02 · AutoInventario v2
 */

const STORAGE_KEY = 'autoInventario_vehiculos';
const SESSION_KEY = 'autoInventario_session';

const Storage = {
  // ── LocalStorage ──────────────────────────────────────────────────
  getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error leyendo localStorage:', e);
      return [];
    }
  },

  save(lista) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      return true;
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
      return false;
    }
  },

  add(vehiculo) {
    try {
      const lista = this.getAll();
      vehiculo.id = 'v_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
      vehiculo.fechaRegistro = new Date().toISOString();
      lista.push(vehiculo);
      this.save(lista);
      this.logAction('AGREGAR', `${vehiculo.marca} ${vehiculo.modelo} – ${vehiculo.placa}`);
      return vehiculo;
    } catch (e) {
      throw new Error('No se pudo guardar el vehículo: ' + e.message);
    }
  },

  update(id, datos) {
    try {
      const lista = this.getAll();
      const idx = lista.findIndex(v => v.id === id);
      if (idx === -1) throw new Error('Vehículo no encontrado');
      datos.id = id;
      datos.fechaRegistro = lista[idx].fechaRegistro;
      datos.fechaActualizacion = new Date().toISOString();
      lista[idx] = datos;
      this.save(lista);
      this.logAction('EDITAR', `${datos.marca} ${datos.modelo} – ${datos.placa}`);
      return datos;
    } catch (e) {
      throw new Error('No se pudo actualizar el vehículo: ' + e.message);
    }
  },

  delete(id) {
    try {
      const v = this.getById(id);
      const lista = this.getAll().filter(v => v.id !== id);
      this.save(lista);
      if (v) this.logAction('ELIMINAR', `${v.marca} ${v.modelo} – ${v.placa}`);
      return true;
    } catch (e) {
      throw new Error('No se pudo eliminar el vehículo: ' + e.message);
    }
  },

  getById(id) {
    return this.getAll().find(v => v.id === id) || null;
  },

  // ── SessionStorage ────────────────────────────────────────────────
  logAction(accion, detalle) {
    try {
      const log = this.getSessionLog();
      log.unshift({ accion, detalle, ts: new Date().toLocaleString('es-SV') });
      if (log.length > 30) log.length = 30;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(log));
    } catch (e) {
      console.warn('SessionStorage no disponible:', e);
    }
  },

  getSessionLog() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  setLastVisit() {
    sessionStorage.setItem('lastVisit', new Date().toLocaleString('es-SV'));
  },

  getLastVisit() {
    return sessionStorage.getItem('lastVisit') || 'Primera visita';
  },

  // ── Datos de ejemplo ──────────────────────────────────────────────
  seedIfEmpty() {
    if (this.getAll().length > 0) return;
    const ejemplos = [
      {
        placa: 'P-253819', marca: 'Toyota', modelo: 'Corolla', anio: 2021,
        color: 'Blanco', tipo: 'Sedán', origen: 'Japón',
        precio: 18500, estado: 'Disponible',
        departamento: 'San Salvador', lat: 13.6929, lng: -89.2182,
        direccion: 'Importadora La Cúpula, Col. Escalón',
        notas: 'Vehículo en excelente condición, full extras.'
      },
      {
        placa: 'N-98234', marca: 'Honda', modelo: 'CR-V', anio: 2020,
        color: 'Plata', tipo: 'SUV', origen: 'Japón',
        precio: 22000, estado: 'Disponible',
        departamento: 'Santa Ana', lat: 13.9942, lng: -89.5597,
        direccion: 'Zona Franca Santa Ana, Bodega 12',
        notas: 'Importado directo de subasta japonesa.'
      },
      {
        placa: 'M-11045', marca: 'Hyundai', modelo: 'Tucson', anio: 2022,
        color: 'Negro', tipo: 'SUV', origen: 'Corea del Sur',
        precio: 24000, estado: 'Vendido',
        departamento: 'La Libertad', lat: 13.6713, lng: -89.3043,
        direccion: 'Concesionaria AutoPremia, Antiguo Cuscatlán',
        notas: 'Vendido el 20/04/2026.'
      },
      {
        placa: 'P-774521', marca: 'Mitsubishi', modelo: 'L200', anio: 2019,
        color: 'Azul', tipo: 'Pick-up', origen: 'Japón',
        precio: 17500, estado: 'Reservado',
        departamento: 'Sonsonate', lat: 13.7197, lng: -89.7249,
        direccion: 'Bodega Regional km 65',
        notas: 'Reservado hasta 30/06/2026.'
      },
      {
        placa: 'N-654211', marca: 'Nissan', modelo: 'Frontier', anio: 2023,
        color: 'Rojo', tipo: 'Pick-up', origen: 'Estados Unidos',
        precio: 28000, estado: 'Disponible',
        departamento: 'San Miguel', lat: 13.4833, lng: -88.1833,
        direccion: 'Importadora del Oriente, Centro',
        notas: 'Modelo 2023 cero kilómetros.'
      },
      {
        placa: 'P-112345', marca: 'Kia', modelo: 'Sportage', anio: 2022,
        color: 'Gris', tipo: 'SUV', origen: 'Corea del Sur',
        precio: 21500, estado: 'Disponible',
        departamento: 'Usulután', lat: 13.3500, lng: -88.4333,
        direccion: 'Concesionaria Oriental, Usulután',
        notas: 'Full equipo, segunda dueña.'
      },
    ];
    ejemplos.forEach(v => this.add(v));
  }
};
