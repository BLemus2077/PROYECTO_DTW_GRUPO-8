// ==========================================
// UTILIDADES GENERALES
// ==========================================

function generateId() {
    return Math.floor(Date.now() % 10000) + Math.floor(Math.random() * 10000);
}

function showToast(message, type = 'success') {
    try {
        const toast = document.getElementById('toast');

        if (!toast) {
            console.warn('No se encontró el contenedor toast');
            return;
        }

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

        if (!messageElement) return;

        messageElement.textContent = message;
        messageElement.className = `form-message ${type}`;
    } catch (error) {
        console.error('Error al mostrar mensaje del formulario:', error);
    }
}

function clearFormMessage() {
    try {
        const messageElement = document.getElementById('formMessage');

        if (!messageElement) return;

        messageElement.textContent = '';
        messageElement.className = 'form-message';
    } catch (error) {
        console.error('Error al limpiar mensaje del formulario:', error);
    }
}

function formatCurrency(value) {
    const numberValue = Number(value) || 0;
    return '$' + numberValue.toLocaleString('es-ES', {
        maximumFractionDigits: 2
    });
}

function normalizeText(value) {
    return String(value || '').trim();
}

function normalizePlate(value) {
    return String(value || '').trim().toUpperCase();
}

function logInitialInfo() {
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
}