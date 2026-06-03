// ==========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================

let vehicles = [];
let filteredVehicles = [];
let vehicleWorker = null;
let currentEditId = null;

// Claves usadas en LocalStorage y SessionStorage
const STORAGE_KEYS = {
    vehicles: 'vehicles',
    lastVisit: 'lastVisit',
    lastSearch: 'lastSearch',
    userName: 'userName',
    userEmail: 'userEmail'
};