// ==========================================
// CRUD DE VEHÍCULOS
// ==========================================

async function handleAddVehicle(event) {
    event.preventDefault();

    try {
        const brand = normalizeText(document.getElementById('brand').value);
        const model = normalizeText(document.getElementById('model').value);
        const year = parseInt(document.getElementById('year').value);
        const color = normalizeText(document.getElementById('color').value);
        const plate = normalizePlate(document.getElementById('plate').value);
        const status = document.getElementById('status').value;
        const price = parseFloat(document.getElementById('price').value);
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;

        if (!validateVehicleForm(brand, model, year, color, plate, status, price)) {
            return;
        }

        const vehicle = {
            id: generateId(),
            brand,
            model,
            year,
            color,
            plate,
            status,
            price,
            latitude,
            longitude,
            registrationDate: new Date().toLocaleDateString('es-ES')
        };

        vehicles.push(vehicle);
        saveVehicles();

        showToast('Vehículo registrado exitosamente', 'success');

        document.getElementById('vehicleForm').reset();
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';

        updateDashboard();
        displayVehicles(vehicles);
        clearFormMessage();

    } catch (error) {
        console.error('Error al agregar vehículo:', error);
        showFormMessage('Error al registrar el vehículo', 'error');
    }
}

function displayVehicles(vehiclesToDisplay) {
    try {
        const tableBody = document.getElementById('vehicleTableBody');
        const currentVehicles = vehiclesToDisplay || vehicles;

        if (!tableBody) return;

        if (currentVehicles.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10" class="empty-message">No hay vehículos registrados</td></tr>';
            return;
        }

        tableBody.innerHTML = currentVehicles.map(vehicle => `
            <tr>
                <td>${vehicle.id}</td>
                <td>${vehicle.brand}</td>
                <td>${vehicle.model}</td>
                <td>${vehicle.year}</td>
                <td>${vehicle.color}</td>
                <td><strong>${vehicle.plate}</strong></td>
                <td>
                    <span class="status-badge ${getStatusClass(vehicle.status)}">
                        ${vehicle.status}
                    </span>
                </td>
                <td>${formatCurrency(vehicle.price)}</td>
                <td>${vehicle.registrationDate}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="openEditModal(${vehicle.id})" class="btn btn-warning">Editar</button>
                        <button onclick="deleteVehicle(${vehicle.id})" class="btn btn-danger">Eliminar</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al mostrar vehículos:', error);
        showToast('Error al mostrar vehículos', 'error');
    }
}

function getStatusClass(status) {
    const statusClasses = {
        'Disponible': 'status-disponible',
        'Vendido': 'status-vendido',
        'En mantenimiento': 'status-en-mantenimiento'
    };

    return statusClasses[status] || 'status-badge';
}

function handleEditVehicle(event) {
    event.preventDefault();

    try {
        const vehicleId = parseInt(document.getElementById('editId').value);
        const vehicle = vehicles.find(v => v.id === vehicleId);

        if (!vehicle) {
            showToast('Vehículo no encontrado', 'error');
            return;
        }

        const brand = normalizeText(document.getElementById('editBrand').value);
        const model = normalizeText(document.getElementById('editModel').value);
        const year = parseInt(document.getElementById('editYear').value);
        const color = normalizeText(document.getElementById('editColor').value);
        const plate = normalizePlate(document.getElementById('editPlate').value);
        const status = document.getElementById('editStatus').value;
        const price = parseFloat(document.getElementById('editPrice').value);

        if (!validateEditVehicleForm(vehicleId, brand, model, year, color, plate, status, price)) {
            showToast('Revise los datos del formulario de edición', 'warning');
            return;
        }

        vehicle.brand = brand;
        vehicle.model = model;
        vehicle.year = year;
        vehicle.color = color;
        vehicle.plate = plate;
        vehicle.status = status;
        vehicle.price = price;

        saveVehicles();

        showToast('Vehículo actualizado exitosamente', 'success');

        closeEditModal();
        updateDashboard();
        displayVehicles(vehicles);

    } catch (error) {
        console.error('Error al editar vehículo:', error);
        showToast('Error al actualizar el vehículo', 'error');
    }
}

function deleteVehicle(vehicleId) {
    try {
        if (!confirm('¿Está seguro de que desea eliminar este vehículo?')) {
            return;
        }

        const index = vehicles.findIndex(v => v.id === vehicleId);

        if (index === -1) {
            showToast('Vehículo no encontrado', 'error');
            return;
        }

        const vehicleName = `${vehicles[index].brand} ${vehicles[index].model}`;

        vehicles.splice(index, 1);
        saveVehicles();

        showToast(`${vehicleName} eliminado correctamente`, 'success');

        updateDashboard();
        displayVehicles(vehicles);

    } catch (error) {
        console.error('Error al eliminar vehículo:', error);
        showToast('Error al eliminar el vehículo', 'error');
    }
}

function searchVehicles() {
    try {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput.value.toLowerCase().trim();

        saveLastSearch(searchTerm);

        if (!searchTerm) {
            filteredVehicles = vehicles;
        } else {
            filteredVehicles = vehicles.filter(vehicle => {
                return (
                    vehicle.brand.toLowerCase().includes(searchTerm) ||
                    vehicle.model.toLowerCase().includes(searchTerm) ||
                    vehicle.plate.toLowerCase().includes(searchTerm) ||
                    vehicle.color.toLowerCase().includes(searchTerm)
                );
            });
        }

        displayVehicles(filteredVehicles);
        showToast(`${filteredVehicles.length} vehículo(s) encontrado(s)`, 'success');

    } catch (error) {
        console.error('Error en la búsqueda:', error);
        showToast('Error al buscar', 'error');
    }
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.value = '';
    }

    saveLastSearch('');
    filteredVehicles = vehicles;
    displayVehicles(vehicles);
    showToast('Búsqueda limpiada', 'success');
}

function restoreLastSearch() {
    try {
        const searchInput = document.getElementById('searchInput');
        const lastSearch = getLastSearch();

        if (searchInput && lastSearch) {
            searchInput.value = lastSearch;
            searchVehicles();
        }
    } catch (error) {
        console.error('Error al restaurar última búsqueda:', error);
    }
}