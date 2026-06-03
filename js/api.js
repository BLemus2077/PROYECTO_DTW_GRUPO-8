// ==========================================
// API REST - FETCH
// ==========================================

async function searchCountry() {
    try {
        const countryInputElement = document.getElementById('countryInput');
        const countryInput = countryInputElement.value.trim();

        if (!countryInput) {
            showToast('Por favor ingresa un país', 'warning');
            return;
        }

        const resultElement = document.getElementById('countryResult');

        if (!resultElement) return;

        resultElement.innerHTML = '<div class="loading"></div> Buscando...';

        const response = await fetch(`https://restcountries.com/v3.1/name/${countryInput}`);

        if (!response.ok) {
            throw new Error('País no encontrado');
        }

        const data = await response.json();
        const country = data[0];

        const resultHTML = `
            <strong>${country.name.official}</strong><br>
            Capital: ${country.capital ? country.capital[0] : 'N/A'}<br>
            Región: ${country.region}<br>
            Población: ${country.population?.toLocaleString('es-ES')}<br>
            Moneda: ${country.currencies ? Object.values(country.currencies)[0]?.name : 'N/A'}<br>
            Idiomas: ${country.languages ? Object.values(country.languages).join(', ') : 'N/A'}<br>
            <img src="${country.flags.svg}" alt="Bandera" style="width: 100px; margin-top: 10px; border-radius: 5px;">
        `;

        resultElement.innerHTML = resultHTML;
        showToast('País encontrado', 'success');

    } catch (error) {
        console.error('Error al buscar país:', error);

        const resultElement = document.getElementById('countryResult');

        if (resultElement) {
            resultElement.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        }

        showToast('Error al buscar el país', 'error');
    }
}

function saveUserInfo() {
    try {
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();

        if (!name || !email) {
            showToast('Por favor completa todos los campos', 'warning');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Email inválido', 'warning');
            return;
        }

        saveSessionUserInfo(name, email);
        showToast('Información de usuario guardada', 'success');
        loadDisplayUserInfo();

    } catch (error) {
        console.error('Error al guardar información del usuario:', error);
        showToast('Error al guardar información', 'error');
    }
}