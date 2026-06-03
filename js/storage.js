// ==========================================
// LOCALSTORAGE Y SESSIONSTORAGE
// ==========================================

function saveVehicles() {
    try {
        localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles));
        console.log('Vehículos guardados en LocalStorage');
    } catch (error) {
        console.error('Error al guardar en LocalStorage:', error);
        showToast('Error al guardar los datos', 'error');
    }
}

function loadVehicles() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.vehicles);

        if (stored) {
            vehicles = JSON.parse(stored);

            if (!Array.isArray(vehicles)) {
                vehicles = [];
            }

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

function updateLastVisit() {
    try {
        const lastVisit = new Date().toLocaleString('es-ES');
        sessionStorage.setItem(STORAGE_KEYS.lastVisit, lastVisit);
        console.log('Última visita registrada:', lastVisit);
    } catch (error) {
        console.error('Error al guardar última visita en SessionStorage:', error);
    }
}

function getLastVisit() {
    return sessionStorage.getItem(STORAGE_KEYS.lastVisit) || 'Primera visita';
}

function saveLastSearch(searchTerm) {
    try {
        sessionStorage.setItem(STORAGE_KEYS.lastSearch, searchTerm || '');
    } catch (error) {
        console.error('Error al guardar última búsqueda:', error);
    }
}

function getLastSearch() {
    return sessionStorage.getItem(STORAGE_KEYS.lastSearch) || '';
}

function saveSessionUserInfo(name, email) {
    try {
        sessionStorage.setItem(STORAGE_KEYS.userName, name);
        sessionStorage.setItem(STORAGE_KEYS.userEmail, email);
        console.log('Información del usuario guardada en SessionStorage');
    } catch (error) {
        console.error('Error al guardar información del usuario:', error);
    }
}

function loadUserInfo() {
    try {
        const name = sessionStorage.getItem(STORAGE_KEYS.userName) || '';
        const email = sessionStorage.getItem(STORAGE_KEYS.userEmail) || '';

        const userNameInput = document.getElementById('userName');
        const userEmailInput = document.getElementById('userEmail');

        if (userNameInput) {
            userNameInput.value = name;
        }

        if (userEmailInput) {
            userEmailInput.value = email;
        }
    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
    }
}