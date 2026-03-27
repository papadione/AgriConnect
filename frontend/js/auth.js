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
  function formatPhoneWithSpaces(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 9) {
      value = value.slice(0, 9);
    }
    
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
    
    input.value = formatted;
    return value;
  }

  const loginPhoneInput = document.getElementById('loginPhone');
  if (loginPhoneInput) {
    loginPhoneInput.addEventListener('input', function() {
      formatPhoneWithSpaces(this);
    });
  }

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
  function formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\s/g, '').replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    if (cleaned.startsWith('221')) {
      cleaned = cleaned.substring(3);
    }
    
    return cleaned;
  }

  // ================= VALIDATION DU NUMÉRO SÉNÉGALAIS =================
  function isValidSenegalPhone(phone) {
    let cleaned = phone.replace(/\s/g, '');
    
    if (cleaned.startsWith('+221')) {
      cleaned = cleaned.substring(4);
    }
    else if (cleaned.startsWith('221')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    const senegalRegex = /^(70|75|76|77|78)[0-9]{7}$/;
    return senegalRegex.test(cleaned);
  }

  // ================= CONNEXION =================
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phone = document.getElementById('loginPhone')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    if (!phone || !password) {
      showError('Veuillez remplir tous les champs', 'loginForm');
      return;
    }
    
    if (!isValidSenegalPhone(phone)) {
      showError('Numéro de téléphone sénégalais invalide (ex: 77 123 45 67)', 'loginForm');
      return;
    }
    
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.utilisateur));
        
        if (data.utilisateur.role === 'agriculteur') {
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'catalogue.html';
        }
      } else {
        showError(data.erreur || 'Numéro ou mot de passe incorrect', 'loginForm');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showError('Erreur de connexion au serveur', 'loginForm');
    } finally {
      setLoading(btn, false);
    }
  });

  // ================= INSCRIPTION =================
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('regFirstName')?.value;
    const lastName = document.getElementById('regLastName')?.value;
    const phone = document.getElementById('regPhone')?.value;
    const password = document.getElementById('regPassword')?.value;
    const region = document.getElementById('regRegion')?.value;
    const acceptTerms = document.getElementById('acceptTerms')?.checked;
    
    let role = document.querySelector('input[name="role"]:checked')?.value;
    
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.utilisateur));
        
        alert('Inscription réussie ! Bienvenue sur AgriConnect Sénégal !');
        
        if (data.utilisateur.role === 'agriculteur') {
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'catalogue.html';
        }
      } else {
        showError(data.erreur || 'Erreur lors de l\'inscription', 'registerForm');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showError('Erreur de connexion au serveur', 'registerForm');
    } finally {
      setLoading(btn, false);
    }
  });

  // ================= FONCTIONS UTILITAIRES =================
  
  function setLoading(btn, state) {
    if (!btn) return;
    const span = btn.querySelector('span');
    if (state) {
      btn.dataset.originalText = span?.textContent || '';
      if (span) span.textContent = 'Chargement...';
      btn.disabled = true;
      btn.style.opacity = '0.75';
    } else {
      if (span) span.textContent = btn.dataset.originalText || 'Envoyer';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }
  
  function showError(msg, formId) {
    const form = document.getElementById(formId);
    let el = form?.querySelector('.form-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-error';
      el.style.cssText = 'color:#C0392B; font-size:.85rem; margin-top:8px; text-align:center; background:#FEF5F5; padding:8px; border-radius:8px;';
      form?.prepend(el);
    }
    el.textContent = msg;
    setTimeout(() => el.remove(), 5000);
  }
  
  // ================= VÉRIFICATION DE CONNEXION EXISTANTE =================
  function checkExistingSession() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user && window.location.pathname.includes('index.html')) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'agriculteur') {
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