// ==========================================
// Sistema de Inventario de Vehículos
// DTW135 · Grupo 8 · 2026
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
            document.getElementById('workerBadge') &&
                (document.getElementById('workerBadge').innerHTML =
                    '<span class="worker-dot"></span> Web Worker activo — procesando en segundo plano');
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

    // Búsqueda en tiempo real
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            if (searchInput.value) searchVehicles();
        });
    }

    // Hamburger menú
    const navToggle = document.getElementById('navToggle');
    const navMenu   = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    // Reset form limpia también el estado de GPS
    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            const gs = document.getElementById('geoStatus');
            if (gs) gs.textContent = '';
        });
    }
}

// ==========================================
// GESTIÓN DE SECCIONES
// ==========================================

function showSection(sectionId) {
    try {
        // Cerrar menú móvil si está abierto
        const navMenu = document.getElementById('navMenu');
        if (navMenu) navMenu.classList.remove('open');

        // Ocultar todas las secciones
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('active');

            if (sectionId === 'dashboard') updateDashboard();
            if (sectionId === 'inventory') displayVehicles(vehicles);
            if (sectionId === 'api')       loadDisplayUserInfo();
        }
    } catch (error) {
        console.error('Error al cambiar de sección:', error);
    }
}

// ==========================================
// CRUD — CREAR
// ==========================================

async function handleAddVehicle(e) {
    e.preventDefault();
    try {
        const brand      = document.getElementById('brand').value.trim();
        const model      = document.getElementById('model').value.trim();
        const year       = parseInt(document.getElementById('year').value);
        const color      = document.getElementById('color').value.trim();
        const plate      = document.getElementById('plate').value.trim().toUpperCase();
        const status     = document.getElementById('status').value;
        const price      = parseFloat(document.getElementById('price').value);
        const origin     = document.getElementById('origin').value;
        const department = document.getElementById('department').value;
        const address    = document.getElementById('address').value.trim();
        const latitude   = document.getElementById('latitude').value;
        const longitude  = document.getElementById('longitude').value;

        if (!validateVehicleForm(brand, model, year, color, plate, status, price, department)) return;

        const vehicle = {
            id:               generateId(),
            brand, model, year, color, plate, status, price,
            origin, department, address, latitude, longitude,
            registrationDate: new Date().toLocaleDateString('es-ES')
        };

        vehicles.push(vehicle);
        saveVehicles();

        showToast('Vehículo registrado exitosamente', 'success');
        document.getElementById('vehicleForm').reset();
        document.getElementById('latitude').value  = '';
        document.getElementById('longitude').value = '';
        document.getElementById('geoStatus').textContent = '';

        updateDashboard();
        displayVehicles(vehicles);
        clearFormMessage();

    } catch (error) {
        console.error('Error al agregar vehículo:', error);
        showFormMessage('Error al registrar el vehículo', 'error');
    }
}

// ==========================================
// VALIDACIÓN
// ==========================================

function validateVehicleForm(brand, model, year, color, plate, status, price, department) {
    let isValid = true;
    const currentYear = new Date().getFullYear();
    clearErrors();

    if (!brand || brand.length < 2) {
        showError('brandError', 'La marca debe tener al menos 2 caracteres'); isValid = false;
    }
    if (!model || model.length < 2) {
        showError('modelError', 'El modelo debe tener al menos 2 caracteres'); isValid = false;
    }
    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        showError('yearError', `El año debe estar entre 1900 y ${currentYear + 1}`); isValid = false;
    }
    if (!color || color.length < 2) {
        showError('colorError', 'El color debe tener al menos 2 caracteres'); isValid = false;
    }
    if (!plate || plate.length < 3) {
        showError('plateError', 'La placa debe tener al menos 3 caracteres'); isValid = false;
    }
    if (vehicles.some(v => v.plate === plate)) {
        showError('plateError', 'Esta placa ya está registrada'); isValid = false;
    }
    if (!status) {
        showError('statusError', 'Debe seleccionar un estado'); isValid = false;
    }
    if (isNaN(price) || price <= 0) {
        showError('priceError', 'El precio debe ser mayor a 0'); isValid = false;
    }
    if (!department) {
        showError('deptError', 'Selecciona el departamento donde se ubica el vehículo'); isValid = false;
    }

    return isValid;
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) { el.textContent = message; el.classList.add('show'); }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(e => {
        e.textContent = '';
        e.classList.remove('show');
    });
}

// ==========================================
// CRUD — LEER
// ==========================================

function displayVehicles(vehiclesToDisplay) {
    try {
        const tableBody = document.getElementById('vehicleTableBody');
        const list = vehiclesToDisplay || vehicles;

        if (list.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="11" class="empty-message">No hay vehículos registrados</td></tr>';
            return;
        }

        tableBody.innerHTML = list.map(v => {
            const statusClass = v.status.toLowerCase().replace(/ /g, '-');
            const deptLabel   = v.department ? `📍 ${v.department}` : '—';
            return `
            <tr>
                <td>${v.id}</td>
                <td>${v.brand}</td>
                <td>${v.model}</td>
                <td>${v.year}</td>
                <td>${v.color}</td>
                <td><strong>${v.plate}</strong></td>
                <td><span class="status-badge status-${statusClass}">${v.status}</span></td>
                <td>$${v.price.toLocaleString('es-ES')}</td>
                <td>${deptLabel}</td>
                <td>${v.registrationDate}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="openEditModal(${v.id})" class="btn btn-warning">Editar</button>
                        <button onclick="deleteVehicle(${v.id})" class="btn btn-danger">Eliminar</button>
                    </div>
                </td>
            </tr>`;
        }).join('');

    } catch (error) {
        console.error('Error al mostrar vehículos:', error);
    }
}

// ==========================================
// CRUD — ACTUALIZAR
// ==========================================

function openEditModal(vehicleId) {
    try {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) { showToast('Vehículo no encontrado', 'error'); return; }

        currentEditId = vehicleId;
        document.getElementById('editId').value         = vehicle.id;
        document.getElementById('editBrand').value      = vehicle.brand;
        document.getElementById('editModel').value      = vehicle.model;
        document.getElementById('editYear').value       = vehicle.year;
        document.getElementById('editColor').value      = vehicle.color;
        document.getElementById('editPlate').value      = vehicle.plate;
        document.getElementById('editStatus').value     = vehicle.status;
        document.getElementById('editPrice').value      = vehicle.price;
        document.getElementById('editDepartment').value = vehicle.department || '';

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
        const vehicle   = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) { showToast('Vehículo no encontrado', 'error'); return; }

        vehicle.brand      = document.getElementById('editBrand').value.trim();
        vehicle.model      = document.getElementById('editModel').value.trim();
        vehicle.year       = parseInt(document.getElementById('editYear').value);
        vehicle.color      = document.getElementById('editColor').value.trim();
        vehicle.plate      = document.getElementById('editPlate').value.trim().toUpperCase();
        vehicle.status     = document.getElementById('editStatus').value;
        vehicle.price      = parseFloat(document.getElementById('editPrice').value);
        vehicle.department = document.getElementById('editDepartment').value;

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

// ==========================================
// CRUD — ELIMINAR
// ==========================================

function deleteVehicle(vehicleId) {
    try {
        if (!confirm('¿Está seguro de que desea eliminar este vehículo?')) return;

        const index = vehicles.findIndex(v => v.id === vehicleId);
        if (index === -1) { showToast('Vehículo no encontrado', 'error'); return; }

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

// ==========================================
// BÚSQUEDA
// ==========================================

function searchVehicles() {
    try {
        const q = document.getElementById('searchInput').value.toLowerCase();
        filteredVehicles = q
            ? vehicles.filter(v =>
                v.brand.toLowerCase().includes(q)      ||
                v.model.toLowerCase().includes(q)      ||
                v.plate.toLowerCase().includes(q)      ||
                v.color.toLowerCase().includes(q)      ||
                (v.department || '').toLowerCase().includes(q))
            : vehicles;

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
// LOCALSTORAGE
// ==========================================

function saveVehicles() {
    try {
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
    } catch (error) {
        console.error('Error al guardar en LocalStorage:', error);
        showToast('Error al guardar los datos', 'error');
    }
}

function loadVehicles() {
    try {
        const stored = localStorage.getItem('vehicles');
        vehicles = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error al cargar vehículos:', error);
        vehicles = [];
    }
}

// ==========================================
// SESSIONSTORAGE
// ==========================================

function updateLastVisit() {
    try {
        const lastVisit = new Date().toLocaleString('es-ES');
        sessionStorage.setItem('lastVisit', lastVisit);
        sessionStorage.setItem('lastSearch', '');
    } catch (error) {
        console.error('Error al guardar en SessionStorage:', error);
    }
}

function getLastVisit() {
    return sessionStorage.getItem('lastVisit') || 'Primera visita';
}

function loadUserInfo() {
    try {
        const name  = sessionStorage.getItem('userName')  || '';
        const email = sessionStorage.getItem('userEmail') || '';
        if (document.getElementById('userName'))  document.getElementById('userName').value  = name;
        if (document.getElementById('userEmail')) document.getElementById('userEmail').value = email;
    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
    }
}

// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {
    try {
        if (vehicleWorker) {
            vehicleWorker.postMessage({ type: 'calculateStats', vehicles });
        } else {
            calculateStatsDirectly();
        }
        document.getElementById('lastVisit').textContent = getLastVisit();
    } catch (error) {
        console.error('Error al actualizar dashboard:', error);
    }
}

function calculateStatsDirectly() {
    try {
        const stats = {
            totalVehicles:       vehicles.length,
            availableVehicles:   vehicles.filter(v => v.status === 'Disponible').length,
            soldVehicles:        vehicles.filter(v => v.status === 'Vendido').length,
            maintenanceVehicles: vehicles.filter(v => v.status === 'En mantenimiento').length,
            averagePrice:        vehicles.length > 0
                ? vehicles.reduce((s, v) => s + v.price, 0) / vehicles.length : 0
        };
        updateDashboardUI(stats);
    } catch (error) {
        console.error('Error al calcular estadísticas:', error);
    }
}

function updateDashboardUI(stats) {
    try {
        document.getElementById('totalVehicles').textContent       = stats.totalVehicles;
        document.getElementById('availableVehicles').textContent   = stats.availableVehicles;
        document.getElementById('soldVehicles').textContent        = stats.soldVehicles;
        document.getElementById('maintenanceVehicles').textContent = stats.maintenanceVehicles;
        document.getElementById('averagePrice').textContent        =
            '$' + stats.averagePrice.toLocaleString('es-ES', { maximumFractionDigits: 2 });
        createChart(stats);
    } catch (error) {
        console.error('Error al actualizar UI del dashboard:', error);
    }
}

// ==========================================
// GRÁFICO
// ==========================================

function createChart(stats) {
    try {
        const canvas = document.getElementById('vehicleStatusChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (window.vehicleChart) window.vehicleChart.destroy();

        window.vehicleChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Disponibles', 'Vendidos', 'En Mantenimiento'],
                datasets: [{
                    data: [stats.availableVehicles, stats.soldVehicles, stats.maintenanceVehicles],
                    backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b'],
                    borderColor:     ['#16a34a', '#2563eb', '#d97706'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: "'Inter', sans-serif", size: 13, weight: '600' },
                            padding: 16
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error al crear gráfico:', error);
    }
}

// ==========================================
// WEB WORKER
// ==========================================

function handleWorkerMessage(event) {
    try {
        const { type, data } = event.data;
        if (type === 'statsCalculated') updateDashboardUI(data);
    } catch (error) {
        console.error('Error procesando mensaje del Web Worker:', error);
    }
}

// ==========================================
// CLIMA — API REST (Open-Meteo + Geolocalización)
// ==========================================

const WMO_MAP = {
    0: { label: 'Despejado',             icon: '☀️'  },
    1: { label: 'Principalmente despejado', icon: '🌤' },
    2: { label: 'Parcialmente nublado',  icon: '⛅' },
    3: { label: 'Nublado',               icon: '☁️'  },
    45:{ label: 'Neblina',               icon: '🌫'  },
    48:{ label: 'Neblina con escarcha',  icon: '🌫'  },
    51:{ label: 'Llovizna leve',         icon: '🌦'  },
    61:{ label: 'Lluvia leve',           icon: '🌧'  },
    63:{ label: 'Lluvia moderada',       icon: '🌧'  },
    65:{ label: 'Lluvia fuerte',         icon: '🌧'  },
    80:{ label: 'Chubascos',             icon: '🌦'  },
    95:{ label: 'Tormenta eléctrica',    icon: '⛈'  },
};

async function cargarClima() {
    const resultEl = document.getElementById('climaResult');
    resultEl.innerHTML = '<div class="loading"></div> Obteniendo ubicación y clima...';

    try {
        // 1. Obtener coordenadas via Geolocation API
        const coords = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                // fallback a San Salvador
                resolve({ latitude: 13.6929, longitude: -89.2182, fallback: true });
                return;
            }
            navigator.geolocation.getCurrentPosition(
                pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                ()  => resolve({ latitude: 13.6929, longitude: -89.2182, fallback: true }),
                { timeout: 8000 }
            );
        });

        // 2. Consultar Open-Meteo con Fetch API (respuesta JSON)
        const url = `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${coords.latitude}&longitude=${coords.longitude}` +
            `&current_weather=true` +
            `&hourly=relative_humidity_2m` +
            `&timezone=America%2FEl_Salvador&forecast_days=1`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const cw   = data.current_weather;
        const wmo  = WMO_MAP[cw.weathercode] || { label: 'Variable', icon: '🌡' };

        // Humedad del índice más cercano
        const hIdx = data.hourly.time.findIndex(t => t.startsWith(cw.time.slice(0, 13)));
        const humidity = hIdx >= 0 ? data.hourly.relative_humidity_2m[hIdx] + '%' : '—';

        const locLabel = coords.fallback
            ? 'San Salvador (predeterminado)'
            : `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`;

        resultEl.innerHTML = `
            <div class="clima-result-box">
                <div style="font-size:.8rem;opacity:.7;margin-bottom:.2rem">📍 ${locLabel}</div>
                <div style="font-size:2.8rem;line-height:1.1">${wmo.icon}</div>
                <div class="clima-temp-big">${cw.temperature}°C</div>
                <div class="clima-desc-text">${wmo.label}</div>
                <div class="clima-meta-row">
                    <span>💨 ${cw.windspeed} km/h</span>
                    <span>💧 ${humidity}</span>
                    <span>🕐 ${new Date(cw.time).toLocaleTimeString('es-SV',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
            </div>
            <p style="font-size:.76rem;color:#64748b;margin-top:.5rem;text-align:center">
                Fuente: Open-Meteo · Fetch API · JSON
            </p>`;

    } catch (error) {
        console.error('Error cargando clima:', error);
        resultEl.innerHTML = `<span style="color:#dc2626">⚠️ Error al obtener el clima: ${error.message}</span>`;
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
        const statusEl = document.getElementById('geoStatus');
        if (statusEl) statusEl.textContent = '⏳ Obteniendo ubicación GPS...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                document.getElementById('latitude').value  = latitude.toFixed(6);
                document.getElementById('longitude').value = longitude.toFixed(6);
                if (statusEl) statusEl.textContent = `✅ Ubicación obtenida: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                showToast('Ubicación GPS obtenida', 'success');
            },
            (error) => {
                const msgs = {
                    1: 'Permiso de ubicación denegado',
                    2: 'Posición no disponible',
                    3: 'Tiempo de espera agotado'
                };
                const msg = msgs[error.code] || 'Error de geolocalización';
                if (statusEl) statusEl.textContent = `❌ ${msg}`;
                showToast(msg, 'error');
            },
            { timeout: 10000 }
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
        const resultEl = document.getElementById('locationResult');
        resultEl.innerHTML = '<div class="loading"></div> Obteniendo ubicación...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                resultEl.innerHTML = `
                    <strong>Ubicación Actual</strong><br>
                    Latitud: ${latitude.toFixed(6)}<br>
                    Longitud: ${longitude.toFixed(6)}<br>
                    Precisión: ±${accuracy.toFixed(0)} metros<br><br>
                    <a href="https://maps.google.com/?q=${latitude},${longitude}"
                       target="_blank" class="btn btn-primary" style="font-size:.82rem;padding:.45rem .9rem">
                       Ver en Google Maps
                    </a>`;
                showToast('Ubicación obtenida', 'success');
            },
            () => {
                resultEl.innerHTML = '<span style="color:#dc2626">Permiso de ubicación denegado</span>';
                showToast('Permiso denegado', 'error');
            }
        );
    } catch (error) {
        console.error('Error al obtener ubicación:', error);
        showToast('Error al obtener ubicación', 'error');
    }
}

// ==========================================
// INFORMACIÓN DEL USUARIO
// ==========================================

function saveUserInfo() {
    try {
        const name  = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();

        if (!name || !email) { showToast('Por favor completa todos los campos', 'warning'); return; }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { showToast('Email inválido', 'warning'); return; }

        sessionStorage.setItem('userName',  name);
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
        const name  = sessionStorage.getItem('userName')  || '';
        const email = sessionStorage.getItem('userEmail') || '';
        const html  = name && email
            ? `<strong>Usuario registrado:</strong><br>Nombre: ${name}<br>Email: ${email}`
            : 'No hay usuario registrado en esta sesión.';
        document.getElementById('userResult').innerHTML = html;
    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
    }
}

function showSystemInfo() {
    try {
        document.getElementById('systemResult').innerHTML = `
            <strong>Navegador:</strong> ${navigator.userAgent.substring(0, 70)}...<br>
            <strong>Plataforma:</strong> ${navigator.platform}<br>
            <strong>Idioma:</strong> ${navigator.language}<br>
            <strong>Cookies:</strong> ${navigator.cookieEnabled ? 'Habilitadas' : 'Deshabilitadas'}<br>
            <br>
            <strong>Almacenamiento:</strong><br>
            Vehículos en LocalStorage: ${vehicles.length}<br>
            Tamaño aprox.: ${new Blob([JSON.stringify(vehicles)]).size} bytes`;
    } catch (error) {
        console.error('Error al mostrar información del sistema:', error);
    }
}

// ==========================================
// UTILIDADES
// ==========================================

function generateId() {
    return Math.floor(Date.now() % 100000) + Math.floor(Math.random() * 10000);
}

function showToast(message, type = 'success') {
    try {
        const toast = document.getElementById('toast');
        toast.textContent  = message;
        toast.className    = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3200);
    } catch (error) {
        console.error('Error al mostrar notificación:', error);
    }
}

function showFormMessage(message, type) {
    try {
        const el = document.getElementById('formMessage');
        el.textContent = message;
        el.className   = `form-message ${type}`;
    } catch (error) {
        console.error('Error al mostrar mensaje del formulario:', error);
    }
}

function clearFormMessage() {
    try {
        const el = document.getElementById('formMessage');
        el.textContent = '';
        el.className   = 'form-message';
    } catch (error) {
        console.error('Error al limpiar mensaje del formulario:', error);
    }
}

// ==========================================
// LOG INICIAL
// ==========================================

console.log('%c🚗 Sistema de Inventario de Vehículos', 'font-size:16px;font-weight:bold;color:#2563eb');
console.log('%cDTW135 · Grupo 8 · 2026', 'font-size:12px;color:#64748b');
console.log('✓ CRUD completo + ubicación por departamento');
console.log('✓ LocalStorage + SessionStorage');
console.log('✓ Web Workers');
console.log('✓ Fetch API (Open-Meteo) + Geolocalización');
console.log('✓ Gráficos (Chart.js)');
