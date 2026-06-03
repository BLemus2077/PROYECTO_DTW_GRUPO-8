// ==========================================
// INICIALIZACIÓN GENERAL DE LA APP
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
    loadVehicles();
    initializeWorker();
    loadUserInfo();
    updateLastVisit();
    setupEventListeners();
    restoreLastSearch();
    updateDashboard();
    showSection('dashboard');
    logInitialInfo();
}

function setupEventListeners() {
    const vehicleForm = document.getElementById('vehicleForm');

    if (vehicleForm) {
        vehicleForm.addEventListener('submit', handleAddVehicle);
    }

    const editForm = document.getElementById('editForm');

    if (editForm) {
        editForm.addEventListener('submit', handleEditVehicle);
    }

    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            searchVehicles();
        });
    }
}