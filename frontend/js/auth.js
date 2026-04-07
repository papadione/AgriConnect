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
              
              // Redirection selon le rôle
              if (data.utilisateur.role === 'administrateur') {
                  window.location.href = 'admin.html';
              } else if (data.utilisateur.role === 'agriculteur') {
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
          'grossiste': 'wholesaler'
      };
      
      const backendRole = roleMapping[role] || 'buyer';
      const fullName = `${firstName} ${lastName}`;
      const formattedPhone = formatPhoneNumber(phone);
      
      const btn = e.target.querySelector('.btn-primary');
      setLoading(btn, true);
      
      try {
          const response = await fetch(`${API_URL}/auth/inscription`, {  // ← Utiliser /inscription au lieu de /register
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
          
          if (response.ok && data.requiresValidation) {
              // Afficher le modal de validation SMS
              showValidationModal(data.phone);
          } else if (response.ok) {
              // Inscription directe (si pas de validation)
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.utilisateur));
              
              showNotification('Inscription réussie ! Bienvenue sur AgriConnect Sénégal !', 'success', 'Bienvenue');
              
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
              if (userData.role === 'administrateur') {
                  window.location.href = 'admin.html';
              } else if (userData.role === 'agriculteur') {
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

// Variables pour la validation SMS
let pendingPhone = null;
let validationTimer = null;

// Après l'inscription, afficher le modal de validation
function showValidationModal(phone) {
    // Cacher le formulaire d'inscription
    document.getElementById('registerForm').style.display = 'none';
    
    // Créer le modal de validation s'il n'existe pas
    let modal = document.getElementById('validationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'validationModal';
        modal.className = 'validation-modal';
        modal.innerHTML = `
            <div class="validation-modal-content">
                <div class="validation-modal-header">
                    <h3>📱 Validation SMS</h3>
                    <button class="validation-close" id="closeValidationModal">&times;</button>
                </div>
                <div class="validation-modal-body">
                    <p>Un code de validation a été envoyé au <strong>${phone}</strong></p>
                    <div class="form-group">
                        <label>Code à 6 chiffres</label>
                        <input type="text" id="validationCode" placeholder="Entrez le code reçu par SMS" maxlength="6" autocomplete="off">
                    </div>
                    <div id="timerDisplay" class="timer">Expire dans 10:00</div>
                    <button id="resendCodeBtn" class="btn-resend" style="display: none;">Renvoyer le code</button>
                </div>
                <div class="validation-modal-footer">
                    <button id="cancelValidationBtn" class="btn-cancel">Annuler</button>
                    <button id="submitValidationBtn" class="btn-validate">Valider</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Gestionnaire de fermeture
        document.getElementById('closeValidationModal').onclick = closeValidationModal;
        document.getElementById('cancelValidationBtn').onclick = closeValidationModal;
        
        // Validation du code
        document.getElementById('submitValidationBtn').onclick = async () => {
            const code = document.getElementById('validationCode').value;
            if (!code || code.length !== 6) {
                showNotification('Veuillez entrer le code à 6 chiffres', 'warning', 'Code invalide');
                return;
            }
            await validateCode(phone, code);
        };
        
        // Renvoi du code
        document.getElementById('resendCodeBtn').onclick = async () => {
            await resendCode(phone);
            startTimer(600); // 10 minutes
        };
        
        // Fermeture en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeValidationModal();
        });
    }
    
    modal.style.display = 'flex';
    startTimer(600); // 10 minutes
    pendingPhone = phone;
}

function closeValidationModal() {
    const modal = document.getElementById('validationModal');
    if (modal) modal.style.display = 'none';
    // Réafficher le formulaire d'inscription
    document.getElementById('registerForm').style.display = 'block';
    if (validationTimer) clearInterval(validationTimer);
}

function startTimer(seconds) {
    const timerDisplay = document.getElementById('timerDisplay');
    const resendBtn = document.getElementById('resendCodeBtn');
    let remaining = seconds;
    
    if (validationTimer) clearInterval(validationTimer);
    
    validationTimer = setInterval(() => {
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerDisplay.textContent = `Expire dans ${minutes}:${secs.toString().padStart(2, '0')}`;
        
        if (remaining <= 0) {
            clearInterval(validationTimer);
            timerDisplay.textContent = 'Code expiré';
            resendBtn.style.display = 'block';
        }
        remaining--;
    }, 1000);
}

async function validateCode(phone, code) {
    try {
        const response = await fetch(`${API_URL}/auth/valider-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, code })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Inscription validée avec succès !', 'success', 'Bienvenue');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.utilisateur));
            closeValidationModal();
            
            if (data.utilisateur.role === 'agriculteur') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'catalogue.html';
            }
        } else {
            showNotification(data.erreur || 'Code invalide', 'error', 'Erreur');
        }
    } catch (error) {
        console.error('Erreur validation:', error);
        showNotification('Erreur de connexion au serveur', 'error', 'Erreur');
    }
}

async function resendCode(phone) {
    try {
        const response = await fetch(`${API_URL}/auth/renvoyer-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Nouveau code envoyé par SMS', 'success', 'Code renvoyé');
        } else {
            showNotification(data.erreur || 'Erreur lors du renvoi', 'error', 'Erreur');
        }
    } catch (error) {
        console.error('Erreur renvoi:', error);
        showNotification('Erreur de connexion au serveur', 'error', 'Erreur');
    }
}

function showNotification(message, type = 'success', title = '') {
    const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
    const titles = { success: 'Succès', error: 'Erreur', info: 'Information', warning: 'Attention' };
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-content">
            <div class="notification-title">${title || titles[type]}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('notification-hide');
        setTimeout(() => notification.remove(), 300);
    });
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('notification-hide');
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}