// ==========================================
// VALIDACIONES
// ==========================================

function validateVehicleForm(brand, model, year, color, plate, status, price) {
    return validateVehicleData({
        brand,
        model,
        year,
        color,
        plate,
        status,
        price,
        currentVehicleId: null,
        errorPrefix: ''
    });
}

function validateEditVehicleForm(vehicleId, brand, model, year, color, plate, status, price) {
    return validateVehicleData({
        brand,
        model,
        year,
        color,
        plate,
        status,
        price,
        currentVehicleId: vehicleId,
        errorPrefix: 'edit'
    });
}

function validateVehicleData(data) {
    let isValid = true;
    const currentYear = new Date().getFullYear();

    const brand = normalizeText(data.brand);
    const model = normalizeText(data.model);
    const color = normalizeText(data.color);
    const plate = normalizePlate(data.plate);
    const year = Number(data.year);
    const price = Number(data.price);
    const status = data.status;

    clearErrors();

    if (!brand || brand.length < 2) {
        showFieldError(data.errorPrefix, 'brandError', 'La marca debe tener al menos 2 caracteres');
        isValid = false;
    }

    if (!model || model.length < 2) {
        showFieldError(data.errorPrefix, 'modelError', 'El modelo debe tener al menos 2 caracteres');
        isValid = false;
    }

    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        showFieldError(data.errorPrefix, 'yearError', `El año debe estar entre 1900 y ${currentYear + 1}`);
        isValid = false;
    }

    if (!color || color.length < 2) {
        showFieldError(data.errorPrefix, 'colorError', 'El color debe tener al menos 2 caracteres');
        isValid = false;
    }

    if (!plate || plate.length < 3) {
        showFieldError(data.errorPrefix, 'plateError', 'La placa debe tener al menos 3 caracteres');
        isValid = false;
    }

    const plateExists = vehicles.some(vehicle => {
        const samePlate = vehicle.plate === plate;
        const differentVehicle = data.currentVehicleId === null || vehicle.id !== data.currentVehicleId;
        return samePlate && differentVehicle;
    });

    if (plateExists) {
        showFieldError(data.errorPrefix, 'plateError', 'Esta placa ya está registrada');
        isValid = false;
    }

    if (!status) {
        showFieldError(data.errorPrefix, 'statusError', 'Debe seleccionar un estado');
        isValid = false;
    }

    if (isNaN(price) || price <= 0) {
        showFieldError(data.errorPrefix, 'priceError', 'El precio debe ser mayor a 0');
        isValid = false;
    }

    return isValid;
}

function showFieldError(prefix, baseErrorId, message) {
    if (!prefix) {
        showError(baseErrorId, message);
        return;
    }

    const editErrorId = prefix + baseErrorId.charAt(0).toUpperCase() + baseErrorId.slice(1);
    showError(editErrorId, message);
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}