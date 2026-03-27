// =========================================
// AgriConnect Sénégal — auth.js
// Version : Téléphone avec formatage automatique (espaces)
// =========================================

// Configuration de l'API
const API_URL = 'http://localhost:3000/api/v1';

document.addEventListener('DOMContentLoaded', () => {

  // ================= GESTION DES ONGLETS =================
  const tabs = document.querySelectorAll('.tab');
  const forms = document.querySelectorAll('.auth-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`${target}Form`)?.classList.add('active');
    });
  });

  // ================= AFFICHER/MASQUER MOT DE PASSE =================
  document.querySelectorAll('.toggle-pwd').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.input-wrap').querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  // ================= FORMATAGE AUTOMATIQUE DES NUMÉROS AVEC ESPACES =================
  /**
   * Formate un numéro de téléphone avec des espaces pendant la saisie
   * Format: 77 123 45 67
   */
  function formatPhoneWithSpaces(input) {
    // Supprimer tous les caractères non numériques
    let value = input.value.replace(/\D/g, '');
    
    // Limiter à 9 chiffres (numéro sénégalais sans indicatif)
    if (value.length > 9) {
      value = value.slice(0, 9);
    }
    
    // Ajouter les espaces selon le format: 77 123 45 67
    let formatted = '';
    if (value.length >= 1) {
      formatted = value.slice(0, 2);
      if (value.length >= 3) {
        formatted += ' ' + value.slice(2, 5);
      }
      if (value.length >= 6) {
        formatted += ' ' + value.slice(5, 7);
      }
      if (value.length >= 8) {
        formatted += ' ' + value.slice(7, 9);
      }
    }
    
    // Mettre à jour la valeur du champ
    input.value = formatted;
    
    // Retourner le numéro brut (sans espaces)
    return value;
  }

  // Appliquer le formatage au champ de connexion
  const loginPhoneInput = document.getElementById('loginPhone');
  if (loginPhoneInput) {
    loginPhoneInput.addEventListener('input', function() {
      formatPhoneWithSpaces(this);
    });
  }

  // Appliquer le formatage au champ d'inscription
  const regPhoneInput = document.getElementById('regPhone');
  if (regPhoneInput) {
    regPhoneInput.addEventListener('input', function() {
      formatPhoneWithSpaces(this);
    });
  }

  // ================= INDICATEUR DE FORCE DU MOT DE PASSE =================
  const regPasswordInput = document.getElementById('regPassword');
  const bars = document.querySelectorAll('.strength-bar');
  const colors = ['#E74C3C', '#E67E22', '#F1C40F', '#27AE60'];

  if (regPasswordInput) {
    regPasswordInput.addEventListener('input', () => {
      const score = calcStrength(regPasswordInput.value);
      bars.forEach((bar, i) => {
        bar.style.background = i < score ? colors[score - 1] : 'var(--border)';
      });
    });
  }

  /**
   * Calcule la force du mot de passe
   * @param {string} pwd - Le mot de passe à évaluer
   * @returns {number} Score de 0 à 4
   */
  function calcStrength(pwd) {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 4);
  }

  // ================= FORMATAGE DU NUMÉRO POUR LE BACKEND =================
  /**
   * Formate le numéro pour l'envoi à l'API
   * Supprime les espaces et ajoute le préfixe 221
   * @param {string} phone - Numéro avec espaces (ex: 77 123 45 67)
   * @returns {string} Numéro formaté (ex: 221771234567)
   */
  function formatPhoneNumber(phone) {
    // Supprimer tous les espaces et caractères non numériques
    let cleaned = phone.replace(/\s/g, '').replace(/\D/g, '');
    
    // Si le numéro commence par 0, le supprimer
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Ajouter le préfixe 221
    cleaned = '221' + cleaned;
    
    return cleaned;
  }

  // ================= VALIDATION DU NUMÉRO SÉNÉGALAIS =================
  /**
   * Valide un numéro de téléphone sénégalais
   * Accepte les formats: 77 123 45 67, 771234567, +221771234567, 221771234567
   * @param {string} phone - Numéro à valider
   * @returns {boolean} true si valide, false sinon
   */
  function isValidSenegalPhone(phone) {
    // Supprimer tous les espaces pour la validation
    let cleaned = phone.replace(/\s/g, '');
    
    // Supprimer le +221 si présent
    if (cleaned.startsWith('+221')) {
      cleaned = cleaned.substring(4);
    }
    // Supprimer le 221 si présent
    else if (cleaned.startsWith('221')) {
      cleaned = cleaned.substring(3);
    }
    // Supprimer le 0 si présent au début
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Vérifier que c'est un numéro sénégalais (70, 75, 76, 77, 78)
    const senegalRegex = /^(70|75|76|77|78)[0-9]{7}$/;
    return senegalRegex.test(cleaned);
  }

  // ================= CONNEXION =================
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phone = document.getElementById('loginPhone')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    // Validation
    if (!phone || !password) {
      showError('Veuillez remplir tous les champs', 'loginForm');
      return;
    }
    
    if (!isValidSenegalPhone(phone)) {
      showError('Numéro de téléphone sénégalais invalide (ex: 77 123 45 67)', 'loginForm');
      return;
    }
    
    // Formater le numéro (supprime les espaces et ajoute 221)
    const formattedPhone = formatPhoneNumber(phone);
    
    const btn = e.target.querySelector('.btn-primary');
    setLoading(btn, true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Connexion réussie
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirection selon le rôle
        if (data.user.role === 'farmer') {
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'catalogue.html';
        }
      } else {
        showError(data.error || 'Numéro ou mot de passe incorrect', 'loginForm');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showError('Erreur de connexion au serveur. Vérifiez que le backend est démarré.', 'loginForm');
    } finally {
      setLoading(btn, false);
    }
  });

  // ================= INSCRIPTION =================
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Récupérer les valeurs
    const firstName = document.getElementById('regFirstName')?.value;
    const lastName = document.getElementById('regLastName')?.value;
    const phone = document.getElementById('regPhone')?.value;
    const password = document.getElementById('regPassword')?.value;
    const region = document.getElementById('regRegion')?.value;
    const acceptTerms = document.getElementById('acceptTerms')?.checked;
    
    // Récupérer le rôle (acheteur, agriculteur, grossiste)
    let role = document.querySelector('input[name="role"]:checked')?.value;
    
    // Validation
    if (!firstName || !lastName || !phone || !password || !region) {
      showError('Veuillez remplir tous les champs', 'registerForm');
      return;
    }
    
    if (!acceptTerms) {
      showError('Vous devez accepter les conditions d\'utilisation', 'registerForm');
      return;
    }
    
    if (password.length < 6) {
      showError('Le mot de passe doit contenir au moins 6 caractères', 'registerForm');
      return;
    }
    
    if (!isValidSenegalPhone(phone)) {
      showError('Numéro de téléphone sénégalais invalide (ex: 77 123 45 67)', 'registerForm');
      return;
    }
    
    // Convertir les rôles en français vers anglais pour le backend
    const roleMapping = {
      'acheteur': 'buyer',
      'agriculteur': 'farmer',
      'grossiste': 'buyer'
    };
    
    const backendRole = roleMapping[role] || 'buyer';
    const fullName = `${firstName} ${lastName}`;
    const formattedPhone = formatPhoneNumber(phone);
    
    const btn = e.target.querySelector('.btn-primary');
    setLoading(btn, true);
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          password: password,
          fullName: fullName,
          role: backendRole,
          location: region
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Inscription réussie
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('✅ Inscription réussie ! Bienvenue sur AgriConnect Sénégal !');
        
        // Redirection selon le rôle
        if (data.user.role === 'farmer') {
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'catalogue.html';
        }
      } else {
        showError(data.error || 'Erreur lors de l\'inscription', 'registerForm');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showError('Erreur de connexion au serveur', 'registerForm');
    } finally {
      setLoading(btn, false);
    }
  });

  // ================= FONCTIONS UTILITAIRES =================
  
  /**
   * Gère l'état de chargement d'un bouton
   * @param {HTMLElement} btn - Le bouton
   * @param {boolean} state - true = chargement, false = normal
   */
  function setLoading(btn, state) {
    if (!btn) return;
    const span = btn.querySelector('span');
    if (state) {
      btn.dataset.originalText = span?.textContent || '';
      if (span) span.textContent = '⏳ Chargement...';
      btn.disabled = true;
      btn.style.opacity = '0.75';
    } else {
      if (span) span.textContent = btn.dataset.originalText || 'Envoyer';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }
  
  /**
   * Affiche un message d'erreur dans le formulaire
   * @param {string} msg - Le message d'erreur
   * @param {string} formId - L'ID du formulaire
   */
  function showError(msg, formId) {
    const form = document.getElementById(formId);
    let el = form?.querySelector('.form-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-error';
      el.style.cssText = 'color:#C0392B; font-size:.85rem; margin-top:8px; text-align:center; background:#FEF5F5; padding:8px; border-radius:8px;';
      form?.prepend(el);
    }
    el.textContent = '⚠️ ' + msg;
    setTimeout(() => el.remove(), 5000);
  }
  
  // ================= VÉRIFICATION DE CONNEXION EXISTANTE =================
  /**
   * Vérifie si l'utilisateur est déjà connecté et redirige si nécessaire
   */
  function checkExistingSession() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user && window.location.pathname.includes('index.html')) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'farmer') {
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'catalogue.html';
        }
      } catch (e) {
        console.error('Erreur parsing user', e);
      }
    }
  }
  
  checkExistingSession();
});