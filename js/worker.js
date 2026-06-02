// ==========================================
// Web Worker - Procesamiento en Segundo Plano
// ==========================================

// Listener para mensajes del hilo principal
self.addEventListener('message', (event) => {
    try {
        const { type, vehicles } = event.data;

        if (type === 'calculateStats') {
            const stats = calculateStatistics(vehicles);
            self.postMessage({
                type: 'statsCalculated',
                data: stats
            });
        }

    } catch (error) {
        console.error('Error en el Web Worker:', error);
        self.postMessage({
            type: 'error',
            message: error.message
        });
    }
});

// ==========================================
// FUNCIONES DE ESTADÍSTICAS
// ==========================================

function calculateStatistics(vehicles) {
    return {
        totalVehicles: calculateTotalVehicles(vehicles),
        availableVehicles: calculateByStatus(vehicles, 'Disponible'),
        soldVehicles: calculateByStatus(vehicles, 'Vendido'),
        maintenanceVehicles: calculateByStatus(vehicles, 'En mantenimiento'),
        averagePrice: calculateAveragePrice(vehicles),
        byStatus: groupByStatus(vehicles),
        priceStatistics: calculatePriceStatistics(vehicles),
        yearStatistics: calculateYearStatistics(vehicles)
    };
}

function calculateTotalVehicles(vehicles) {
    return vehicles.length;
}

function calculateByStatus(vehicles, status) {
    return vehicles.filter(v => v.status === status).length;
}

function calculateAveragePrice(vehicles) {
    if (vehicles.length === 0) return 0;
    
    const totalPrice = vehicles.reduce((sum, vehicle) => sum + vehicle.price, 0);
    return totalPrice / vehicles.length;
}

function groupByStatus(vehicles) {
    const grouped = {
        'Disponible': [],
        'Vendido': [],
        'En mantenimiento': []
    };

    vehicles.forEach(vehicle => {
        if (grouped[vehicle.status]) {
            grouped[vehicle.status].push(vehicle.id);
        }
    });

    return grouped;
}

function calculatePriceStatistics(vehicles) {
    if (vehicles.length === 0) {
        return {
            totalPrice: 0,
            averagePrice: 0,
            minPrice: 0,
            maxPrice: 0,
            medianPrice: 0
        };
    }

    const prices = vehicles.map(v => v.price).sort((a, b) => a - b);
    const totalPrice = prices.reduce((sum, price) => sum + price, 0);

    return {
        totalPrice: totalPrice,
        averagePrice: totalPrice / prices.length,
        minPrice: prices[0],
        maxPrice: prices[prices.length - 1],
        medianPrice: calculateMedian(prices)
    };
}

function calculateYearStatistics(vehicles) {
    if (vehicles.length === 0) return {};

    const groupedByYear = {};
    
    vehicles.forEach(vehicle => {
        if (!groupedByYear[vehicle.year]) {
            groupedByYear[vehicle.year] = 0;
        }
        groupedByYear[vehicle.year]++;
    });

    return groupedByYear;
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function calculateMedian(sortedArray) {
    const n = sortedArray.length;
    if (n % 2 === 0) {
        return (sortedArray[n / 2 - 1] + sortedArray[n / 2]) / 2;
    }
    return sortedArray[Math.floor(n / 2)];
}

// ==========================================
// FUNCIONES DE PROCESAMIENTO INTENSIVO
// ==========================================

/**
 * Simula procesamiento intensivo para demostrar el uso de Web Workers
 * Esta función no bloquea la interfaz de usuario
 */
function processLargeDataset(vehicles) {
    const results = [];
    
    // Procesar cada vehículo
    vehicles.forEach(vehicle => {
        // Cálculos adicionales complejos
        const processingResult = {
            id: vehicle.id,
            plate: vehicle.plate,
            depreciationRate: calculateDepreciation(vehicle.year),
            estimatedValue: calculateEstimatedValue(vehicle),
            taxCategory: calculateTaxCategory(vehicle)
        };
        
        results.push(processingResult);
    });

    return results;
}

function calculateDepreciation(year) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    // Depreciación aproximada: 15% primer año, 10% años siguientes
    if (age === 0) return 0;
    if (age === 1) return 0.15;
    return 0.15 + (Math.min(age - 1, 10) * 0.10);
}

function calculateEstimatedValue(vehicle) {
    const depreciation = calculateDepreciation(vehicle.year);
    return vehicle.price * (1 - depreciation);
}

function calculateTaxCategory(vehicle) {
    if (vehicle.price < 10000) return 'Económico';
    if (vehicle.price < 30000) return 'Estándar';
    if (vehicle.price < 60000) return 'Premium';
    return 'Lujo';
}

// ==========================================
// LOG DEL WORKER
// ==========================================

console.log('Web Worker inicializado - Listo para procesar datos');
