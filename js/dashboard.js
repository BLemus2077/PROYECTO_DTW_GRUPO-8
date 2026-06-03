// ==========================================
// DASHBOARD, ESTADÍSTICAS Y WEB WORKER
// ==========================================

function initializeWorker() {
    try {
        if (typeof Worker !== 'undefined') {
            vehicleWorker = new Worker('js/worker.js');
            vehicleWorker.onmessage = handleWorkerMessage;
            vehicleWorker.onerror = handleWorkerError;
        } else {
            console.warn('Web Workers no soportados en este navegador');
            vehicleWorker = null;
        }
    } catch (error) {
        console.warn('No se pudo iniciar Web Worker:', error);
        vehicleWorker = null;
    }
}

function updateDashboard() {
    try {
        if (vehicleWorker) {
            vehicleWorker.postMessage({
                type: 'calculateStats',
                vehicles: vehicles
            });
        } else {
            calculateStatsDirectly();
        }

        const lastVisitElement = document.getElementById('lastVisit');

        if (lastVisitElement) {
            lastVisitElement.textContent = getLastVisit();
        }

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
            averagePrice: vehicles.length > 0
                ? vehicles.reduce((sum, v) => sum + (Number(v.price) || 0), 0) / vehicles.length
                : 0
        };

        updateDashboardUI(stats);
    } catch (error) {
        console.error('Error al calcular estadísticas:', error);
    }
}

function updateDashboardUI(stats) {
    try {
        setTextContent('totalVehicles', stats.totalVehicles);
        setTextContent('availableVehicles', stats.availableVehicles);
        setTextContent('soldVehicles', stats.soldVehicles);
        setTextContent('maintenanceVehicles', stats.maintenanceVehicles);
        setTextContent('averagePrice', formatCurrency(stats.averagePrice));

        createChart(stats);
    } catch (error) {
        console.error('Error al actualizar UI del dashboard:', error);
    }
}

function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}

function createChart(stats) {
    try {
        const canvas = document.getElementById('vehicleStatusChart');

        if (!canvas) return;

        if (typeof Chart === 'undefined') {
            console.warn('Chart.js no está disponible');
            return;
        }

        const ctx = canvas.getContext('2d');

        const chartData = {
            labels: ['Disponibles', 'Vendidos', 'En Mantenimiento'],
            datasets: [{
                label: 'Estado de Vehículos',
                data: [
                    stats.availableVehicles,
                    stats.soldVehicles,
                    stats.maintenanceVehicles
                ],
                backgroundColor: ['#2ecc71', '#3498db', '#f39c12'],
                borderColor: ['#27ae60', '#2980b9', '#e67e22'],
                borderWidth: 2
            }]
        };

        if (window.vehicleChart) {
            window.vehicleChart.destroy();
        }

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

function handleWorkerMessage(event) {
    try {
        const { type, data, message } = event.data;

        if (type === 'statsCalculated') {
            updateDashboardUI(data);
            return;
        }

        if (type === 'error') {
            console.error('Error enviado por el Web Worker:', message);
            showToast('Error al procesar estadísticas', 'error');
            calculateStatsDirectly();
            return;
        }

        console.warn('Mensaje desconocido del Web Worker:', event.data);

    } catch (error) {
        console.error('Error procesando mensaje del Web Worker:', error);
    }
}

function handleWorkerError(error) {
    console.error('Error del Web Worker:', error);
    showToast('Error del Web Worker. Se calcularán estadísticas directamente.', 'warning');
    vehicleWorker = null;
    calculateStatsDirectly();
}