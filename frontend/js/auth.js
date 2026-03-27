/**
 * AUTH.JS : Gestion de la connexion (Login)
 */

const phoneInput = document.getElementById('phone');

// 1. Initialisation de la bibliothèque de drapeaux (intl-tel-input)
const iti = window.intlTelInput(phoneInput, {
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
    initialCountry: "sn",
    separateDialCode: true,
    preferredCountries: ["sn", "ci", "fr"]
});

/**
 * Fonction de formatage (2-3-2-2)
 * C'est cette fonction qui manquait et causait l'erreur "not defined"
 */
function formatPhoneNumber(value) {
    let numbers = value.replace(/\D/g, ''); // On enlève tout ce qui n'est pas chiffre
    numbers = numbers.substring(0, 9);      // Limite à 9 chiffres pour le Sénégal

    let formatted = "";
    if (numbers.length > 0) {
        formatted += numbers.substring(0, 2);
        if (numbers.length > 2) formatted += " " + numbers.substring(2, 5);
        if (numbers.length > 5) formatted += " " + numbers.substring(5, 7);
        if (numbers.length > 7) formatted += " " + numbers.substring(7, 9);
    }
    return formatted;
}

// Écouteur pour formater pendant que l'utilisateur tape ou colle
phoneInput.addEventListener('input', (e) => {
    e.target.value = formatPhoneNumber(e.target.value);
});

/**
 * Fonction principale de connexion
 */
async function login() {
    const messageDiv = document.getElementById('message');
    const password = document.getElementById('password').value;
    
    // Récupère le numéro au format international (ex: +221773869938)
    const fullNumber = iti.getNumber();

    // Vérification de la validité via la bibliothèque
    if (!iti.isValidNumber()) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "Numéro de téléphone invalide.";
        return;
    }

    try {
        // On utilise apiCall défini dans api.js (Assure-toi que api.js est chargé avant auth.js dans ton HTML)
        const data = await apiCall('/auth/login', 'POST', { 
            phone_number: fullNumber, 
            password: password 
        });

        if (data.token) {
            // Stockage des informations de session
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            messageDiv.style.color = "green";
            messageDiv.innerText = "Connexion réussie ! Redirection...";
            
            // Redirection vers le catalogue après un court délai
            setTimeout(() => {
                window.location.href = 'catalogue.html';
            }, 1000);
        } else {
            messageDiv.style.color = "red";
            messageDiv.innerText = data.error || "Identifiants incorrects";
        }
    } catch (error) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "Erreur de connexion au serveur.";
    }
}