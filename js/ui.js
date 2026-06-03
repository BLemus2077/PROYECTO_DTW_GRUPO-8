// ==========================================
// INTERFAZ DE USUARIO
// ==========================================

function showSection(sectionId) {
    try {
        const sections = document.querySelectorAll('.section');

        sections.forEach(section => {
            section.classList.remove('active');
        });

        const activeSection = document.getElementById(sectionId);

        if (activeSection) {
            activeSection.classList.add('active');

            if (sectionId === 'dashboard') {
                updateDashboard();
            }

            if (sectionId === 'inventory') {
                displayVehicles(vehicles);
            }

            if (sectionId === 'api') {
                loadDisplayUserInfo();
            }
        }
    } catch (error) {
        console.error('Error al cambiar de sección:', error);
        showToast('Error al cambiar de sección', 'error');
    }
}

function openEditModal(vehicleId) {
    try {
        const vehicle = vehicles.find(v => v.id === vehicleId);

        if (!vehicle) {
            showToast('Vehículo no encontrado', 'error');
            return;
        }

        currentEditId = vehicleId;

        document.getElementById('editId').value = vehicle.id;
        document.getElementById('editBrand').value = vehicle.brand;
        document.getElementById('editModel').value = vehicle.model;
        document.getElementById('editYear').value = vehicle.year;
        document.getElementById('editColor').value = vehicle.color;
        document.getElementById('editPlate').value = vehicle.plate;
        document.getElementById('editStatus').value = vehicle.status;
        document.getElementById('editPrice').value = vehicle.price;

        document.getElementById('editModal').classList.add('show');

    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        showToast('Error al abrir el formulario de edición', 'error');
    }
}

function closeEditModal() {
    const modal = document.getElementById('editModal');

    if (modal) {
        modal.classList.remove('show');
    }

    currentEditId = null;
}

function loadDisplayUserInfo() {
    try {
        const name = sessionStorage.getItem(STORAGE_KEYS.userName) || '';
        const email = sessionStorage.getItem(STORAGE_KEYS.userEmail) || '';

        const userHTML = name && email ? `
            <strong>Usuario Registrado:</strong><br>
            Nombre: ${name}<br>
            Email: ${email}
        ` : 'No hay usuario registrado';

        const userResult = document.getElementById('userResult');

        if (userResult) {
            userResult.innerHTML = userHTML;
        }

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

        const systemResult = document.getElementById('systemResult');

        if (systemResult) {
            systemResult.innerHTML = systemInfo;
        }

    } catch (error) {
        console.error('Error al mostrar información del sistema:', error);
        showToast('Error al mostrar información del sistema', 'error');
    }
}