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
                showToast(getGeolocationErrorMessage(error), 'error');
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

        if (!resultElement) return;

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
                resultElement.innerHTML = `<span style="color: red;">Error: ${getGeolocationErrorMessage(error)}</span>`;
                showToast(getGeolocationErrorMessage(error), 'error');
            }
        );

    } catch (error) {
        console.error('Error al obtener ubicación:', error);
        showToast('Error al obtener ubicación', 'error');
    }
}

function getGeolocationErrorMessage(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return 'Permiso de ubicación denegado';
        case error.POSITION_UNAVAILABLE:
            return 'Ubicación no disponible';
        case error.TIMEOUT:
            return 'Tiempo de espera agotado al obtener ubicación';
        default:
            return 'Error al obtener la ubicación';
    }
}