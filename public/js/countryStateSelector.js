/**
 * Populates the state dropdown based on the selected country code.
 * 
 * This function fetches the list of states for a given country code from an external API
 * and populates the state dropdown with the retrieved states. If no country code is provided,
 * the state dropdown is reset to its default state. If an error occurs during the fetch operation,
 * an error message is displayed in the state dropdown.
 * 
 */

const countrySelect = document.getElementById('country');
const stateSelect = document.getElementById('state');

async function populateCountries() {
    try {
        const response = await fetch('https://api.countrystatecity.in/v1/countries', {
            headers: {
                'X-CSCAPI-KEY': 'NHhvOEcyWk50N2Vna3VFTE00bFp3MjFKR0ZEOUhkZlg4RTk1MlJlaA=='
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const countries = await response.json();
        countries.sort((a, b) => a.name.localeCompare(b.name));
        countrySelect.innerHTML = '<option value="">Select Country</option>';
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.iso2;
            option.textContent = country.name;
            countrySelect.appendChild(option);
        });
    } catch (error) {
        countrySelect.innerHTML = '<option value="">Error loading countries</option>';
    }
}

async function populateStates(countryCode) {
    try {
        stateSelect.innerHTML = '<option value="">Loading states...</option>';
        stateSelect.disabled = true;
        
        if (!countryCode) {
            stateSelect.innerHTML = '<option value="">Select State</option>';
            stateSelect.disabled = false;
            return;
        }

        const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/states`, {
            headers: {
                'X-CSCAPI-KEY': 'NHhvOEcyWk50N2Vna3VFTE00bFp3MjFKR0ZEOUhkZlg4RTk1MlJlaA=='
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const states = await response.json();
        
        if (states.length === 0) {
            stateSelect.innerHTML = '<option value="">No states available</option>';
            stateSelect.disabled = true;
            return;
        }

        states.sort((a, b) => a.name.localeCompare(b.name));
        stateSelect.innerHTML = '<option value="">Select State</option>';
        
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state.iso2;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });

        stateSelect.disabled = false;

    } catch (error) {
        stateSelect.innerHTML = '<option value="">Error loading states</option>';
        stateSelect.disabled = true;
    }
}

countrySelect.addEventListener('change', (e) => {
    populateStates(e.target.value);
});

window.addEventListener('load', () => {
    populateCountries();
});
