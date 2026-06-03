// ==========================================
// Sistema de Inventario de Vehículos
// ==========================================

// Variables Globales
let vehicles = [];
let filteredVehicles = [];
let vehicleWorker;
let currentEditId = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeApp();
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        showToast('Error al inicializar la aplicación', 'error');
    }
});

function initializeApp() {
    // Cargar vehículos desde LocalStorage
    loadVehicles();

    // Inicializar Web Worker
    try {
        if (typeof Worker !== 'undefined') {
            vehicleWorker = new Worker('js/worker.js');
            vehicleWorker.onmessage = handleWorkerMessage;
        } else {
            console.warn('Web Workers no soportados en este navegador');
        }
    } catch (error) {
        console.warn('No se pudo iniciar Web Worker:', error);
        vehicleWorker = null;
    }

    // Cargar información del usuario desde SessionStorage
    loadUserInfo();

    // Guardar última visita en SessionStorage
    updateLastVisit();

    // Agregar listeners a eventos
    setupEventListeners();

    // Inicializar dashboard
    updateDashboard();

    // Mostrar la sección de dashboard por defecto
    showSection('dashboard');
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Formulario de registro
    const vehicleForm = document.getElementById('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', handleAddVehicle);
    }

    // Formulario de edición
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditVehicle);
    }

    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            if (searchInput.value) {
                searchVehicles();
            }
        });
    }
}

// ==========================================
// GESTIÓN DE SECCIONES
// ==========================================

function showSection(sectionId) {
    try {
        // Ocultar todas las secciones
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar la sección seleccionada
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('active');
            
            // Actualizar dashboard si es necesario
            if (sectionId === 'dashboard') {
                updateDashboard();
            }
            
            // Mostrar inventario si es necesario
            if (sectionId === 'inventory') {
                displayVehicles(vehicles);
            }

            // Cargar información del usuario
            if (sectionId === 'api') {
                loadDisplayUserInfo();
            }
        }
    } catch (error) {
        console.error('Error al cambiar de sección:', error);
    }
}

// ==========================================
// CRUD - CREAR (Agregar Vehículo)
// ==========================================

async function handleAddVehicle(e) {
    e.preventDefault();

    try {
        // Obtener valores del formulario
        const brand = document.getElementById('brand').value.trim();
        const model = document.getElementById('model').value.trim();
        const year = parseInt(document.getElementById('year').value);
        const color = document.getElementById('color').value.trim();
        const plate = document.getElementById('plate').value.trim().toUpperCase();
        const status = document.getElementById('status').value;
        const price = parseFloat(document.getElementById('price').value);
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;

        // Validar formulario
        if (!validateVehicleForm(brand, model, year, color, plate, status, price)) {
            return;
        }

        // Crear objeto de vehículo
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

        // Guardar en array
        vehicles.push(vehicle);
        saveVehicles();

        // Mostrar mensaje de éxito
        showToast('Vehículo registrado exitosamente', 'success');

        // Limpiar formulario
        document.getElementById('vehicleForm').reset();
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';

        // Actualizar vistas
        updateDashboard();
        displayVehicles(vehicles);

        // Limpiar mensaje del formulario
        clearFormMessage();

    } catch (error) {
        console.error('Error al agregar vehículo:', error);
        showFormMessage('Error al registrar el vehículo', 'error');
    }
}

// ==========================================
// VALIDACIÓN DE FORMULARIO
// ==========================================

function validateVehicleForm(brand, model, year, color, plate, status, price) {
    let isValid = true;
    const currentYear = new Date().getFullYear();

    // Limpiar mensajes de error
    clearErrors();

    // Validar marca
    if (!brand || brand.length < 2) {
        showError('brandError', 'La marca debe tener al menos 2 caracteres');
        isValid = false;
    }

    // Validar modelo
    if (!model || model.length < 2) {
        showError('modelError', 'El modelo debe tener al menos 2 caracteres');
        isValid = false;
    }

    // Validar año
    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        showError('yearError', `El año debe estar entre 1900 y ${currentYear + 1}`);
        isValid = false;
    }

    // Validar color
    if (!color || color.length < 2) {
        showError('colorError', 'El color debe tener al menos 2 caracteres');
        isValid = false;
    }

    // Validar placa (verifcar que no esté duplicada)
    if (!plate || plate.length < 3) {
        showError('plateError', 'La placa debe tener al menos 3 caracteres');
        isValid = false;
    }

    const plateExists = vehicles.some(v => v.plate === plate);
    if (plateExists) {
        showError('plateError', 'Esta placa ya está registrada');
        isValid = false;
    }

    // Validar estado
    if (!status) {
        showError('statusError', 'Debe seleccionar un estado');
        isValid = false;
    }

    // Validar precio
    if (isNaN(price) || price <= 0) {
        showError('priceError', 'El precio debe ser mayor a 0');
        isValid = false;
    }

    return isValid;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearErrors() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(error => {
        error.textContent = '';
        error.classList.remove('show');
    });
}

// ==========================================
// CRUD - LEER (Mostrar Vehículos)
// ==========================================

function displayVehicles(vehiclesToDisplay) {
    try {
        const tableBody = document.getElementById('vehicleTableBody');
        const currentVehicles = vehiclesToDisplay || vehicles;

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
                    <span class="status-badge status-${vehicle.status.toLowerCase().replace(' ', '-')}">
                        ${vehicle.status}
                    </span>
                </td>
                <td>$${vehicle.price.toLocaleString('es-ES')}</td>
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
    }
}

// ==========================================
// CRUD - ACTUALIZAR (Editar Vehículo)
// ==========================================

function openEditModal(vehicleId) {
    try {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            showToast('Vehículo no encontrado', 'error');
            return;
        }

        // Guardar ID actual
        currentEditId = vehicleId;

        // Llenar formulario modal
        document.getElementById('editId').value = vehicle.id;
        document.getElementById('editBrand').value = vehicle.brand;
        document.getElementById('editModel').value = vehicle.model;
        document.getElementById('editYear').value = vehicle.year;
        document.getElementById('editColor').value = vehicle.color;
        document.getElementById('editPlate').value = vehicle.plate;
        document.getElementById('editStatus').value = vehicle.status;
        document.getElementById('editPrice').value = vehicle.price;

        // Mostrar modal
        document.getElementById('editModal').classList.add('show');

    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        showToast('Error al abrir el formulario de edición', 'error');
    }
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    currentEditId = null;
}

function handleEditVehicle(e) {
    e.preventDefault();

    try {
        const vehicleId = parseInt(document.getElementById('editId').value);
        const vehicle = vehicles.find(v => v.id === vehicleId);

        if (!vehicle) {
            showToast('Vehículo no encontrado', 'error');
            return;
        }

        // Actualizar propiedades
        vehicle.brand = document.getElementById('editBrand').value.trim();
        vehicle.model = document.getElementById('editModel').value.trim();
        vehicle.year = parseInt(document.getElementById('editYear').value);
        vehicle.color = document.getElementById('editColor').value.trim();
        vehicle.plate = document.getElementById('editPlate').value.trim().toUpperCase();
        vehicle.status = document.getElementById('editStatus').value;
        vehicle.price = parseFloat(document.getElementById('editPrice').value);

        // Guardar cambios
        saveVehicles();

        // Mostrar mensaje de éxito
        showToast('Vehículo actualizado exitosamente', 'success');

        // Cerrar modal
        closeEditModal();

        // Actualizar vistas
        updateDashboard();
        displayVehicles(vehicles);

    } catch (error) {
        console.error('Error al editar vehículo:', error);
        showToast('Error al actualizar el vehículo', 'error');
    }
}

// ==========================================
// CRUD - ELIMINAR (Eliminar Vehículo)
// ==========================================

function deleteVehicle(vehicleId) {
    try {
        if (!confirm('¿Está seguro de que desea eliminar este vehículo?')) {
            return;
        }

        // Encontrar el índice del vehículo
        const index = vehicles.findIndex(v => v.id === vehicleId);

        if (index === -1) {
            showToast('Vehículo no encontrado', 'error');
            return;
        }

        // Guardar el nombre del vehículo para el mensaje
        const vehicleName = `${vehicles[index].brand} ${vehicles[index].model}`;

        // Eliminar del array
        vehicles.splice(index, 1);

        // Guardar cambios
        saveVehicles();

        // Mostrar mensaje de éxito
        showToast(`${vehicleName} eliminado correctamente`, 'success');

        // Actualizar vistas
        updateDashboard();
        displayVehicles(vehicles);

    } catch (error) {
        console.error('Error al eliminar vehículo:', error);
        showToast('Error al eliminar el vehículo', 'error');
    }
}

// ==========================================
// BÚSQUEDA Y FILTRADO
// ==========================================

function searchVehicles() {
    try {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

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
    document.getElementById('searchInput').value = '';
    filteredVehicles = vehicles;
    displayVehicles(vehicles);
    showToast('Búsqueda limpiada', 'success');
}

// ==========================================
// ALMACENAMIENTO LOCAL (LocalStorage)
// ==========================================

function saveVehicles() {
    try {
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        console.log('Vehículos guardados en LocalStorage');
    } catch (error) {
        console.error('Error al guardar en LocalStorage:', error);
        showToast('Error al guardar los datos', 'error');
    }
}

function loadVehicles() {
    try {
        const stored = localStorage.getItem('vehicles');
        if (stored) {
            vehicles = JSON.parse(stored);
            console.log(`${vehicles.length} vehículos cargados desde LocalStorage`);
        } else {
            vehicles = [];
            console.log('No hay vehículos guardados');
        }
    } catch (error) {
        console.error('Error al cargar vehículos:', error);
        vehicles = [];
    }
}

// ==========================================
// ALMACENAMIENTO DE SESIÓN (SessionStorage)
// ==========================================

function updateLastVisit() {
    try {
        const lastVisit = new Date().toLocaleString('es-ES');
        sessionStorage.setItem('lastVisit', lastVisit);
        sessionStorage.setItem('lastSearch', '');
        console.log('Última visita registrada:', lastVisit);
    } catch (error) {
        console.error('Error al guardar en SessionStorage:', error);
    }
}

function getLastVisit() {
    return sessionStorage.getItem('lastVisit') || 'Primera visita';
}

function saveUserInfo(name, email) {
    try {
        sessionStorage.setItem('userName', name);
        sessionStorage.setItem('userEmail', email);
        console.log('Información del usuario guardada en SessionStorage');
    } catch (error) {
        console.error('Error al guardar información del usuario:', error);
    }
}

function loadUserInfo() {
    try {
        const name = sessionStorage.getItem('userName') || '';
        const email = sessionStorage.getItem('userEmail') || '';

        if (document.getElementById('userName')) {
            document.getElementById('userName').value = name;
        }
        if (document.getElementById('userEmail')) {
            document.getElementById('userEmail').value = email;
        }
    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
    }
}

// ==========================================
// DASHBOARD Y ESTADÍSTICAS
// ==========================================

function updateDashboard() {
    try {
        // Enviar datos al Web Worker para procesamiento
        if (vehicleWorker) {
            vehicleWorker.postMessage({
                type: 'calculateStats',
                vehicles: vehicles
            });
        } else {
            // Si no hay Web Worker, calcular directamente
            calculateStatsDirectly();
        }

        // Actualizar última visita
        document.getElementById('lastVisit').textContent = getLastVisit();

    } catch (error) {
        console.error('Error al actualizar dashboard:', error);
    }
}

function calculateStatsDirectly() {
    try {
        const stats = {
            totalVehicles: vehicles.length,
            availableVehicles: vehicles.filter(v => v.status === 'Disponible').length,
            soldVehicles: vehicles.filter(v => v.status === 'Vendido').length,
            maintenanceVehicles: vehicles.filter(v => v.status === 'En mantenimiento').length,
            averagePrice: vehicles.length > 0 ? vehicles.reduce((sum, v) => sum + v.price, 0) / vehicles.length : 0
        };

        updateDashboardUI(stats);
    } catch (error) {
        console.error('Error al calcular estadísticas:', error);
    }
}

function updateDashboardUI(stats) {
    try {
        document.getElementById('totalVehicles').textContent = stats.totalVehicles;
        document.getElementById('availableVehicles').textContent = stats.availableVehicles;
        document.getElementById('soldVehicles').textContent = stats.soldVehicles;
        document.getElementById('maintenanceVehicles').textContent = stats.maintenanceVehicles;
        document.getElementById('averagePrice').textContent = '$' + stats.averagePrice.toLocaleString('es-ES', { maximumFractionDigits: 2 });

        // Crear gráfico
        createChart(stats);
    } catch (error) {
        console.error('Error al actualizar UI del dashboard:', error);
    }
}

// ==========================================
// GRÁFICOS
// ==========================================

function createChart(stats) {
    try {
        const canvas = document.getElementById('vehicleStatusChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const chartData = {
            labels: ['Disponibles', 'Vendidos', 'En Mantenimiento'],
            datasets: [{
                label: 'Estado de Vehículos',
                data: [stats.availableVehicles, stats.soldVehicles, stats.maintenanceVehicles],
                backgroundColor: ['#2ecc71', '#3498db', '#f39c12'],
                borderColor: ['#27ae60', '#2980b9', '#e67e22'],
                borderWidth: 2
            }]
        };

        // Limpiar canvas si ya hay un gráfico
        if (window.vehicleChart) {
            window.vehicleChart.destroy();
        }

        // Crear nuevo gráfico
        window.vehicleChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error al crear gráfico:', error);
    }
}

// Nota: Para que los gráficos funcionen, necesitas incluir Chart.js
// <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

// ==========================================
// WEB WORKER
// ==========================================

function handleWorkerMessage(event) {
    try {
        const { type, data } = event.data;

        if (type === 'statsCalculated') {
            updateDashboardUI(data);
        }
    } catch (error) {
        console.error('Error procesando mensaje del Web Worker:', error);
    }
}

// ==========================================
// API REST - FETCH
// ==========================================

async function searchCountry() {
    try {
        const countryInput = document.getElementById('countryInput').value.trim();

        if (!countryInput) {
            showToast('Por favor ingresa un país', 'warning');
            return;
        }

        const resultElement = document.getElementById('countryResult');
        resultElement.innerHTML = '<div class="loading"></div> Buscando...';

        const response = await fetch(`https://restcountries.com/v3.1/name/${countryInput}`);

        if (!response.ok) {
            throw new Error('País no encontrado');
        }

        const data = await response.json();
        const country = data[0];

        const resultHTML = `
            <strong>${country.name.official}</strong><br>
            Capital: ${country.capital ? country.capital[0] : 'N/A'}<br>
            Región: ${country.region}<br>
            Población: ${country.population?.toLocaleString('es-ES')}<br>
            Moneda: ${Object.values(country.currencies)[0]?.name}<br>
            Idiomas: ${Object.values(country.languages).join(', ')}<br>
            <img src="${country.flags.svg}" alt="Bandera" style="width: 100px; margin-top: 10px; border-radius: 5px;">
        `;

        resultElement.innerHTML = resultHTML;
        showToast('País encontrado', 'success');

    } catch (error) {
        console.error('Error al buscar país:', error);
        document.getElementById('countryResult').innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        showToast('Error al buscar el país', 'error');
    }
}

// ==========================================
// GEOLOCALIZACIÓN
// ==========================================

function getGeolocation() {
    try {
        if (!navigator.geolocation) {
            showToast('Geolocalización no soportada en este navegador', 'warning');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                document.getElementById('latitude').value = latitude.toFixed(6);
                document.getElementById('longitude').value = longitude.toFixed(6);
                showToast('Ubicación obtenida exitosamente', 'success');
            },
            (error) => {
                console.error('Error de geolocalización:', error);
                showToast('Error al obtener la ubicación', 'error');
            }
        );

    } catch (error) {
        console.error('Error en geolocalización:', error);
        showToast('Error en geolocalización', 'error');
    }
}

function getUserLocation() {
    try {
        if (!navigator.geolocation) {
            showToast('Geolocalización no soportada', 'warning');
            return;
        }

        const resultElement = document.getElementById('locationResult');
        resultElement.innerHTML = '<div class="loading"></div> Obteniendo ubicación...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const resultHTML = `
                    <strong>Ubicación Actual</strong><br>
                    Latitud: ${latitude.toFixed(6)}<br>
                    Longitud: ${longitude.toFixed(6)}<br>
                    Precisión: ±${accuracy.toFixed(0)} metros<br>
                    <br>
                    <a href="https://maps.google.com/?q=${latitude},${longitude}" target="_blank" class="btn btn-primary">Ver en Google Maps</a>
                `;
                resultElement.innerHTML = resultHTML;
                showToast('Ubicación obtenida', 'success');
            },
            (error) => {
                resultElement.innerHTML = `<span style="color: red;">Error: Permiso de ubicación denegado</span>`;
                showToast('Permiso de ubicación denegado', 'error');
            }
        );

    } catch (error) {
        console.error('Error al obtener ubicación:', error);
        showToast('Error al obtener ubicación', 'error');
    }
}

// ==========================================
// INFORMACIÓN DEL USUARIO (API Section)
// ==========================================

function saveUserInfo() {
    try {
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();

        if (!name || !email) {
            showToast('Por favor completa todos los campos', 'warning');
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Email inválido', 'warning');
            return;
        }

        // Guardar en SessionStorage
        sessionStorage.setItem('userName', name);
        sessionStorage.setItem('userEmail', email);

        showToast('Información de usuario guardada', 'success');
        loadDisplayUserInfo();

    } catch (error) {
        console.error('Error al guardar información del usuario:', error);
        showToast('Error al guardar información', 'error');
    }
}

function loadDisplayUserInfo() {
    try {
        const name = sessionStorage.getItem('userName') || '';
        const email = sessionStorage.getItem('userEmail') || '';

        const userHTML = name && email ? `
            <strong>Usuario Registrado:</strong><br>
            Nombre: ${name}<br>
            Email: ${email}
        ` : 'No hay usuario registrado';

        document.getElementById('userResult').innerHTML = userHTML;

    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
    }
}

function showSystemInfo() {
    try {
        const systemInfo = `
            <strong>Información del Sistema</strong><br>
            Navegador: ${navigator.userAgent.substring(0, 80)}...<br>
            Plataforma: ${navigator.platform}<br>
            Lenguaje: ${navigator.language}<br>
            Cookies Habilitadas: ${navigator.cookieEnabled ? 'Sí' : 'No'}<br>
            <br>
            <strong>Almacenamiento</strong><br>
            Vehículos en LocalStorage: ${vehicles.length}<br>
            Tamaño aproximado: ${new Blob([JSON.stringify(vehicles)]).size} bytes<br>
        `;

        document.getElementById('systemResult').innerHTML = systemInfo;

    } catch (error) {
        console.error('Error al mostrar información del sistema:', error);
    }
}

// ==========================================
// UTILIDADES
// ==========================================

function generateId() {
    return Math.floor(Date.now() % 10000) + Math.floor(Math.random() * 10000);
}

function showToast(message, type = 'success') {
    try {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);

    } catch (error) {
        console.error('Error al mostrar notificación:', error);
    }
}

function showFormMessage(message, type) {
    try {
        const messageElement = document.getElementById('formMessage');
        messageElement.textContent = message;
        messageElement.className = `form-message ${type}`;
    } catch (error) {
        console.error('Error al mostrar mensaje del formulario:', error);
    }
}

function clearFormMessage() {
    try {
        const messageElement = document.getElementById('formMessage');
        messageElement.textContent = '';
        messageElement.className = 'form-message';
    } catch (error) {
        console.error('Error al limpiar mensaje del formulario:', error);
    }
}

// ==========================================
// LOG DE CONSOLA INICIAL
// ==========================================

console.log('%c🚗 Sistema de Inventario de Vehículos', 'font-size: 16px; font-weight: bold; color: #3498db;');
console.log('%cv1.0.0 - 2026', 'font-size: 12px; color: #95a5a6;');
console.log('Características disponibles:');
console.log('✓ CRUD completo de vehículos');
console.log('✓ LocalStorage para persistencia');
console.log('✓ SessionStorage para datos temporales');
console.log('✓ Web Workers para procesamiento paralelo');
console.log('✓ Consumo de APIs REST');
console.log('✓ Geolocalización');
console.log('✓ Gráficos y estadísticas');
