//Operaciones CRUD del inventario

const Inventario = {
  _filtro: '',

  render(lista) {
    const tbody = document.getElementById('vehicleTableBody');
    if (!tbody) return;
    const vehiculos = lista || (this._filtro
      ? Storage.getAll().filter(v =>
          [v.placa, v.marca, v.modelo, v.color, v.departamento, v.estado]
          .some(f => (f||'').toLowerCase().includes(this._filtro)))
      : Storage.getAll());

    if (!vehiculos.length) {
      tbody.innerHTML = `<tr><td colspan="10" class="empty-msg">
        ${this._filtro ? 'Sin resultados para "' + this._filtro + '"' : 'No hay vehículos registrados.'}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = vehiculos.map(v => {
      const cls = { Disponible:'badge-disp', Vendido:'badge-vend', Reservado:'badge-res' }[v.estado] || '';
      const fecha = v.fechaRegistro ? new Date(v.fechaRegistro).toLocaleDateString('es-SV') : '—';
      return `
      <tr>
        <td><strong>${v.placa}</strong></td>
        <td>${v.marca}</td>
        <td>${v.modelo}</td>
        <td>${v.anio}</td>
        <td>${v.color}</td>
        <td><span class="badge ${cls}">${v.estado}</span></td>
        <td class="price-cell">$${Number(v.precio).toLocaleString('es-SV')}</td>
        <td>${v.departamento || '—'}</td>
        <td>${fecha}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon btn-edit" onclick="Inventario.abrirEdicion('${v.id}')" title="Editar">✏️</button>
            <button class="btn-icon btn-del"  onclick="Inventario.eliminar('${v.id}')"      title="Eliminar">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  buscar(q) {
    this._filtro = (q || '').toLowerCase().trim();
    this.render();
    showToast(`${this._getFiltered().length} resultado(s)`, 'success');
  },

  _getFiltered() {
    if (!this._filtro) return Storage.getAll();
    return Storage.getAll().filter(v =>
      [v.placa, v.marca, v.modelo, v.color, v.departamento, v.estado]
      .some(f => (f||'').toLowerCase().includes(this._filtro)));
  },

  limpiarBusqueda() {
    this._filtro = '';
    document.getElementById('searchInput').value = '';
    this.render();
  },

  // CREAR 
  handleAdd(e) {
    e.preventDefault();
    const datos = this._leerFormulario('reg');
    const errores = validarVehiculo(datos);
    if (Object.keys(errores).length) {
      mostrarErrores(errores, 'reg');
      return;
    }
    try {
      Storage.add(datos);
      showToast('Vehículo registrado exitosamente ✓', 'success');
      document.getElementById('regForm').reset();
      document.getElementById('regGeoStatus').textContent = '';
      limpiarErrores('reg');
      Dashboard.refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // EDITAR
  abrirEdicion(id) {
    const v = Storage.getById(id);
    if (!v) { showToast('Vehículo no encontrado', 'error'); return; }

    const f = (campo, val) => {
      const el = document.getElementById('edit_' + campo);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    f('id',           v.id);
    f('placa',        v.placa);
    f('marca',        v.marca);
    f('modelo',       v.modelo);
    f('anio',         v.anio);
    f('color',        v.color);
    f('tipo',         v.tipo || '');
    f('origen',       v.origen || '');
    f('estado',       v.estado);
    f('precio',       v.precio);
    f('departamento', v.departamento || '');
    f('direccion',    v.direccion || '');
    f('lat',          v.lat || '');
    f('lng',          v.lng || '');
    f('notas',        v.notas || '');

    const statusEl = document.getElementById('editGeoStatus');
    if (statusEl) {
      statusEl.textContent = v.lat && v.lng
        ? `📍 Ubicación guardada: ${Number(v.lat).toFixed(5)}, ${Number(v.lng).toFixed(5)}`
        : 'Sin ubicación GPS registrada.';
    }

    limpiarErrores('edit');
    openModal('editModal');
  },

  handleEdit(e) {
    e.preventDefault();
    const id    = document.getElementById('edit_id').value;
    const datos = this._leerFormulario('edit');
    const errores = validarVehiculo(datos, true, id);
    if (Object.keys(errores).length) {
      mostrarErrores(errores, 'edit');
      return;
    }
    try {
      Storage.update(id, datos);
      showToast('Vehículo actualizado ✓', 'success');
      closeModal('editModal');
      this.render();
      Dashboard.refresh();
      Mapa.refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // ELIMINAR 
  eliminar(id) {
    const v = Storage.getById(id);
    if (!v) return;
    if (!confirm(`¿Eliminar ${v.marca} ${v.modelo} (${v.placa})?`)) return;
    try {
      Storage.delete(id);
      showToast(`${v.marca} ${v.modelo} eliminado`, 'success');
      this.render();
      Dashboard.refresh();
      Mapa.refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // HELPERS 
  _leerFormulario(prefix) {
    const g = id => {
      const el = document.getElementById(`${prefix === 'reg' ? '' : 'edit_'}${id}`);
      return el ? el.value.trim() : '';
    };
    return {
      placa        : g('placa').toUpperCase(),
      marca        : g('marca'),
      modelo       : g('modelo'),
      anio         : parseInt(g('anio')),
      color        : g('color'),
      tipo         : g('tipo'),
      origen       : g('origen'),
      estado       : g('estado'),
      precio       : parseFloat(g('precio')),
      departamento : g('departamento'),
      direccion    : g('direccion'),
      lat          : parseFloat(g('lat')) || null,
      lng          : parseFloat(g('lng')) || null,
      notas        : g('notas'),
    };
  }
};
