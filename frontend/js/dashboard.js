// =========================================
// AgriConnect Sénégal — dashboard.js
// =========================================

// Configuration
const API_URL = 'http://localhost:3000/api/v1';
const BACKEND_URL = 'http://localhost:3000';

// ================= NOTIFICATIONS =================
function showNotification(message, type = 'success', title = '', duration = 5000) {
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ',
        warning: '⚠'
    };
    
    const titles = {
        success: 'Succès',
        error: 'Erreur',
        info: 'Information',
        warning: 'Attention'
    };
    
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
    
    const displayDuration = duration || 5000;
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('notification-hide');
            setTimeout(() => notification.remove(), 300);
        }
    }, displayDuration);
}

// ================= MODAL DE CONFIRMATION PERSONNALISÉE =================
function showConfirmDialog(options) {
    return new Promise((resolve) => {
        const { title, message, confirmText = 'Supprimer', cancelText = 'Annuler', type = 'danger' } = options;
        
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        
        const iconColor = type === 'danger' ? '#E74C3C' : '#F39C12';
        const iconPath = type === 'danger' 
            ? '<path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="16" r="1" fill="currentColor"/>'
            : '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" fill="none"/>';
        
        modal.innerHTML = `
            <div class="confirm-modal-content">
                <div class="confirm-modal-header">
                    <div class="confirm-modal-icon" style="background: ${type === 'danger' ? '#FEF5F5' : '#FFF8F0'}">
                        <svg viewBox="0 0 24 24" fill="none" style="color: ${iconColor}">
                            ${iconPath}
                        </svg>
                    </div>
                    <h3>${title}</h3>
                    <p>${message}</p>
                </div>
                <div class="confirm-modal-body">
                    <div class="confirm-modal-actions">
                        <button class="btn-confirm-cancel" id="confirmCancelBtn">${cancelText}</button>
                        <button class="btn-confirm-delete" id="confirmDeleteBtn">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('#confirmCancelBtn');
        const deleteBtn = modal.querySelector('#confirmDeleteBtn');
        
        cancelBtn.addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
        
        deleteBtn.addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        });
    });
}

// Vérifier si l'utilisateur est connecté
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'index.html';
        return null;
    }
    
    return { token, user: JSON.parse(user) };
}

// Afficher les informations du profil
function displayProfile() {
    const userData = checkAuth();
    if (userData) {
        const user = userData.user;
        
        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = user.nomComplet;
        }
        
        const roleMap = {
            'agriculteur': 'Agriculteur',
            'acheteur': 'Acheteur',
            'grossiste': 'Grossiste'
        };
        
        const profileRole = document.getElementById('profileRole');
        if (profileRole) {
            profileRole.textContent = roleMap[user.role] || user.role;
        }
        
        const profileLocation = document.getElementById('profileLocation');
        if (profileLocation) {
            profileLocation.textContent = `${user.localisation}, Sénégal`;
        }
        
        const farmerTab = document.getElementById('farmerTab');
        if (farmerTab) {
            farmerTab.style.display = user.role === 'agriculteur' ? 'block' : 'none';
        }
    }
}

// Déconnexion
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
}

// Redirection vers le catalogue
function setupCatalogueRedirect() {
    const catalogueBtn = document.getElementById('catalogueBtn');
    if (catalogueBtn) {
        catalogueBtn.addEventListener('click', () => {
            window.location.href = 'catalogue.html';
        });
    }
}

// Gestion des onglets
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-dash');
    const panes = document.querySelectorAll('.tab-pane');
    const userData = checkAuth();
    
    if (userData && userData.user.role === 'agriculteur') {
        const productsTab = document.querySelector('.tab-dash[data-tab="products"]');
        const ordersTab = document.querySelector('.tab-dash[data-tab="orders"]');
        const productsPane = document.getElementById('productsPane');
        const ordersPane = document.getElementById('ordersPane');
        
        if (productsTab && productsPane) {
            productsTab.classList.add('active');
            ordersTab?.classList.remove('active');
            productsPane.classList.add('active');
            ordersPane?.classList.remove('active');
        }
    }
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${target}Pane`)?.classList.add('active');
        });
    });
}

// ================= GESTION DES COMMANDES =================

async function loadOrders() {
    const token = localStorage.getItem('token');
    const userData = checkAuth();
    
    if (!userData) return;
    
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    try {
        const response = await fetch(`${API_URL}/commandes/mes-commandes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.succes && data.commandes && data.commandes.length > 0) {
            displayOrders(data.commandes);
        } else {
            ordersList.innerHTML = '<p class="empty-message">Aucune commande pour le moment</p>';
        }
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
        ordersList.innerHTML = '<p class="error-message">Erreur de chargement des commandes</p>';
        showNotification('Erreur de chargement des commandes', 'error', 'Erreur');
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-number">${order.order_number}</span>
                <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-info">
                <p>Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                <p>Total: ${Math.floor(order.total_amount)} FCFA</p>
            </div>
            <div class="order-total">
                <strong>${Math.floor(order.total_amount)} FCFA</strong>
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'En attente',
        'confirmed': 'Confirmée',
        'preparing': 'En préparation',
        'shipped': 'Expédiée',
        'delivered': 'Livrée',
        'cancelled': 'Annulée'
    };
    return statusMap[status] || status;
}

// ================= GESTION DES PRODUITS =================

async function loadProducts() {
    const token = localStorage.getItem('token');
    const userData = checkAuth();
    
    if (!userData || userData.user.role !== 'agriculteur') return;
    
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    try {
        const response = await fetch(`${API_URL}/produits/mes-produits`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.succes && data.produits && data.produits.length > 0) {
            displayProducts(data.produits);
        } else {
            productsList.innerHTML = '<p class="empty-message">Vous n\'avez pas encore de produits</p>';
        }
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        productsList.innerHTML = '<p class="error-message">Erreur de chargement des produits</p>';
        showNotification('Erreur de chargement des produits', 'error', 'Erreur');
    }
}

function displayProducts(products) {
    const productsList = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
        productsList.innerHTML = '<p class="empty-message">Vous n\'avez pas encore de produits</p>';
        return;
    }
    
    productsList.innerHTML = products.map(product => {
        let imageUrl = '';
        if (product.images && product.images.length > 0) {
            let imgPath = product.images[0];
            if (typeof imgPath === 'object' && imgPath.url) {
                imgPath = imgPath.url;
            }
            imageUrl = `${BACKEND_URL}${imgPath}`;
        }
        
        const regionsText = product.regions && product.regions.length > 0 
            ? `📍 ${product.regions.join(', ')}` 
            : '📍 Livraison nationale';
        
        return `
            <div class="product-item">
                <div class="product-item-info">
                    <h4>${product.nom}</h4>
                    <p>${Math.floor(product.prix)} FCFA / ${product.unite} • Stock: ${Math.floor(product.quantite)}</p>
                    <p class="product-regions" style="font-size: 0.75rem; color: #7AB648; margin: 0.25rem 0;">${regionsText}</p>
                    ${imageUrl ? `<img src="${imageUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-top: 5px;">` : '<span style="font-size: 0.7rem; color: #8B7A68;">Pas d\'image</span>'}
                    <p class="product-status ${product.disponible ? 'disponible' : 'indisponible'}">
                        ${product.disponible ? '✓ Disponible' : '✗ Indisponible'}
                    </p>
                </div>
                <div class="product-item-actions">
                    <button class="btn-edit" data-id="${product.id}">✏️ Modifier</button>
                    <button class="btn-toggle" data-id="${product.id}" data-status="${product.disponible}">
                        ${product.disponible ? '⛔ Désactiver' : '✅ Activer'}
                    </button>
                    <button class="btn-delete" data-id="${product.id}">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editProduct(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => toggleProductStatus(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
}

function setupAddProductForm() {
    const showAddBtn = document.getElementById('showAddProductBtn');
    
    if (showAddBtn) {
        showAddBtn.addEventListener('click', () => {
            openAddProductModal();
        });
    }
    
    const closeBtn = document.getElementById('closeAddModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAddProductModal);
    }
    
    const cancelBtn = document.getElementById('cancelAddModal');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeAddProductModal);
    }
    
    const saveBtn = document.getElementById('saveProductModal');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProductFromModal);
    }
    
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAddProductModal();
            }
        });
    }
}

function openAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        document.getElementById('modalProductName').value = '';
        document.getElementById('modalProductPrice').value = '';
        document.getElementById('modalProductUnit').value = 'kg';
        document.getElementById('modalProductQuantity').value = '';
        document.getElementById('modalProductCategory').value = '1';
        document.getElementById('modalProductDescription').value = '';
        document.getElementById('modalProductImage').value = '';
        document.getElementById('modalImagePreview').innerHTML = '';
        
        const regionCheckboxes = document.querySelectorAll('#regionsCheckboxGroup input[type="checkbox"]');
        regionCheckboxes.forEach(cb => {
            cb.checked = false;
        });
        
        modal.style.display = 'flex';
        
        const imageInput = document.getElementById('modalProductImage');
        const preview = document.getElementById('modalImagePreview');
        imageInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    preview.innerHTML = `<img src="${event.target.result}" style="max-width: 100px; max-height: 100px; border-radius: 8px;">`;
                };
                reader.readAsDataURL(file);
            }
        };
    }
}

function closeAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ================= COMPRESSION D'IMAGE =================
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        if (file.size < 2 * 1024 * 1024) {
            console.log(`Image déjà petite: ${(file.size / 1024).toFixed(2)}KB - pas de compression`);
            resolve(file);
            return;
        }
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                
                const maxSize = 800;
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    console.log(`✅ Image compressée: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
                    resolve(compressedFile);
                }, 'image/jpeg', 0.7);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// ================= AJOUT PRODUIT =================
async function saveProductFromModal() {
    const token = localStorage.getItem('token');
    const userData = checkAuth();
    
    if (!userData || userData.user.role !== 'agriculteur') {
        showNotification('Vous devez être agriculteur pour ajouter un produit', 'warning', 'Accès refusé');
        return;
    }
    
    const name = document.getElementById('modalProductName').value;
    const price = document.getElementById('modalProductPrice').value;
    const unit = document.getElementById('modalProductUnit').value;
    const quantity = document.getElementById('modalProductQuantity').value;
    const categoryId = document.getElementById('modalProductCategory').value;
    const description = document.getElementById('modalProductDescription').value;
    const imageFile = document.getElementById('modalProductImage').files[0];
    
    const selectedRegions = Array.from(
        document.querySelectorAll('#regionsCheckboxGroup input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    if (!name || !price || !quantity) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'warning', 'Champs manquants');
        return;
    }
    
    if (price <= 0 || quantity <= 0) {
        showNotification('Le prix et la quantité doivent être supérieurs à 0', 'warning', 'Valeur invalide');
        return;
    }
    
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        showNotification('L\'image est trop volumineuse (maximum 5MB). Veuillez choisir une image plus petite.', 'error', 'Image trop grande');
        return;
    }
    
    const btn = document.getElementById('saveProductModal');
    const originalText = btn.textContent;
    btn.textContent = 'Publication...';
    btn.disabled = true;
    
    try {
        let imageUrl = '';
        
        if (imageFile) {
            let fileToUpload = imageFile;
            if (imageFile.size > 2 * 1024 * 1024) {
                showNotification('Compression de l\'image en cours...', 'info', 'Optimisation');
                fileToUpload = await compressImage(imageFile);
            }
            
            showNotification('Téléchargement de l\'image en cours...', 'info', 'Chargement');
            
            const formData = new FormData();
            formData.append('image', fileToUpload);
            
            const uploadResponse = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            const uploadData = await uploadResponse.json();
            if (uploadData.succes) {
                imageUrl = uploadData.url;
                showNotification('Image téléchargée avec succès !', 'success', 'Image ajoutée');
            } else {
                showNotification(uploadData.erreur || 'Erreur lors de l\'upload', 'error', 'Erreur');
                btn.textContent = originalText;
                btn.disabled = false;
                return;
            }
        }
        
        const response = await fetch(`${API_URL}/produits`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: name,
                price: parseFloat(price),
                unit: unit,
                quantity: parseFloat(quantity),
                categoryId: parseInt(categoryId),
                description: description,
                minOrder: 1,
                images: imageUrl ? [imageUrl] : [],
                regions: selectedRegions
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Produit ajouté avec succès !', 'success', 'Produit ajouté');
            closeAddProductModal();
            await loadProducts();
            
            const productsTab = document.querySelector('.tab-dash[data-tab="products"]');
            const ordersTab = document.querySelector('.tab-dash[data-tab="orders"]');
            const productsPane = document.getElementById('productsPane');
            const ordersPane = document.getElementById('ordersPane');
            
            if (productsTab && productsPane) {
                productsTab.classList.add('active');
                ordersTab?.classList.remove('active');
                productsPane.classList.add('active');
                ordersPane?.classList.remove('active');
            }
        } else {
            showNotification(data.erreur || 'Impossible d\'ajouter le produit', 'error', 'Erreur');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion au serveur', 'error', 'Connexion');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// ================= ACTIONS SUR LES PRODUITS =================

async function toggleProductStatus(productId) {
    const token = localStorage.getItem('token');
    const productItem = document.querySelector(`.btn-toggle[data-id="${productId}"]`);
    const isCurrentlyAvailable = productItem?.dataset.status === 'true';
    const newStatus = !isCurrentlyAvailable;
    
    try {
        const response = await fetch(`${API_URL}/produits/${productId}/statut`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isAvailable: newStatus })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`Produit ${newStatus ? 'activé' : 'désactivé'} avec succès !`, 'success', 'Statut modifié');
            loadProducts();
        } else {
            showNotification(data.erreur || 'Impossible de changer le statut', 'error', 'Erreur');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion au serveur', 'error', 'Connexion');
    }
}

// ================= SUPPRESSION AVEC CONFIRMATION PERSONNALISÉE =================
async function deleteProduct(productId) {
    const confirmed = await showConfirmDialog({
        title: 'Confirmer la suppression',
        message: 'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
    });
    
    if (!confirmed) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/produits/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Produit supprimé avec succès !', 'success', 'Produit supprimé');
            await loadProducts();
            
            const productsTab = document.querySelector('.tab-dash[data-tab="products"]');
            const ordersTab = document.querySelector('.tab-dash[data-tab="orders"]');
            const productsPane = document.getElementById('productsPane');
            const ordersPane = document.getElementById('ordersPane');
            
            if (productsTab && productsPane) {
                productsTab.classList.add('active');
                ordersTab?.classList.remove('active');
                productsPane.classList.add('active');
                ordersPane?.classList.remove('active');
            }
        } else {
            showNotification(data.erreur || 'Impossible de supprimer le produit', 'error', 'Erreur');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion au serveur', 'error', 'Connexion');
    }
}

async function editProduct(productId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/produits/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.succes) {
            const product = data.produit;
            showEditForm(product);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de chargement du produit', 'error', 'Erreur');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showEditForm(product) {
    let existingImageUrl = '';
    if (product.images && product.images.length > 0) {
        let imgPath = product.images[0];
        if (typeof imgPath === 'object' && imgPath.url) {
            imgPath = imgPath.url;
        }
        existingImageUrl = `${BACKEND_URL}${imgPath}`;
    }
    
    const regionsList = [
        'Dakar', 'Thiès', 'Saint-Louis', 'Diourbel', 'Fatick', 'Kaffrine',
        'Kaolack', 'Kédougou', 'Kolda', 'Louga', 'Matam', 'Sédhiou',
        'Tambacounda', 'Ziguinchor'
    ];
    
    const regionsHtml = regionsList.map(region => `
        <label class="region-checkbox" style="display: inline-flex; align-items: center; gap: 0.5rem; margin-right: 0.75rem; margin-bottom: 0.5rem;">
            <input type="checkbox" value="${region}" ${product.regions && product.regions.includes(region) ? 'checked' : ''}>
            ${region}
        </label>
    `).join('');
    
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="edit-modal-content">
            <div class="edit-modal-header">
                <h3>✏️ Modifier le produit</h3>
                <button class="edit-modal-close">&times;</button>
            </div>
            <div class="edit-modal-body">
                <div class="form-group">
                    <label>Nom du produit</label>
                    <input type="text" id="editName" value="${escapeHtml(product.nom)}" class="form-input">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Prix (FCFA)</label>
                        <input type="number" id="editPrice" value="${product.prix}" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Unité</label>
                        <select id="editUnit" class="form-input">
                            <option value="kg" ${product.unite === 'kg' ? 'selected' : ''}>Kilogramme (kg)</option>
                            <option value="litre" ${product.unite === 'litre' ? 'selected' : ''}>Litre (L)</option>
                            <option value="botte" ${product.unite === 'botte' ? 'selected' : ''}>Botte</option>
                            <option value="piece" ${product.unite === 'piece' ? 'selected' : ''}>Pièce</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Quantité</label>
                        <input type="number" id="editQuantity" value="${product.quantite}" class="form-input">
                    </div>
                </div>
                <div class="form-group">
                    <label>Catégorie</label>
                    <select id="editCategory" class="form-input">
                        <option value="1" ${product.categorie_id === 1 ? 'selected' : ''}>Légumes</option>
                        <option value="2" ${product.categorie_id === 2 ? 'selected' : ''}>Fruits</option>
                        <option value="3" ${product.categorie_id === 3 ? 'selected' : ''}>Céréales</option>
                        <option value="4" ${product.categorie_id === 4 ? 'selected' : ''}>Tubercules</option>
                        <option value="5" ${product.categorie_id === 5 ? 'selected' : ''}>Volaille</option>
                        <option value="6" ${product.categorie_id === 6 ? 'selected' : ''}>Produits laitiers</option>
                        <option value="7" ${product.categorie_id === 7 ? 'selected' : ''}>Poissons</option>
                        <option value="8" ${product.categorie_id === 8 ? 'selected' : ''}>Autres</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="editDescription" rows="3" class="form-input">${escapeHtml(product.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Régions de disponibilité</label>
                    <div class="regions-grid" id="editRegionsGroup" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; background: #F9F7F3; padding: 0.75rem; border-radius: 12px; border: 1px solid #EAE6DF;">
                        ${regionsHtml}
                    </div>
                    <small>Cochez les régions où le produit est disponible</small>
                </div>
                <div class="form-group">
                    <label>Image actuelle</label>
                    <div id="currentImageContainer">
                        ${existingImageUrl ? 
                            `<div class="current-image">
                                <img src="${existingImageUrl}" style="max-width: 100px; max-height: 100px; border-radius: 8px;">
                                <button type="button" class="btn-remove-image" data-image="${existingImageUrl}">Supprimer l'image</button>
                            </div>` : 
                            '<p class="no-image">Aucune image</p>'
                        }
                    </div>
                    <label style="margin-top: 10px;">Nouvelle image (laissez vide pour garder l'image actuelle)</label>
                    <input type="file" id="editImage" accept="image/*" class="form-input">
                    <div id="editImagePreview" style="margin-top: 10px;"></div>
                </div>
            </div>
            <div class="edit-modal-footer">
                <button class="btn-cancel" id="cancelEdit">Annuler</button>
                <button class="btn-save" id="saveEdit" data-id="${product.id}">Enregistrer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.edit-modal-close');
    closeBtn.onclick = () => modal.remove();
    document.getElementById('cancelEdit').onclick = () => modal.remove();
    
    const imageInput = document.getElementById('editImage');
    const preview = document.getElementById('editImagePreview');
    imageInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                preview.innerHTML = `<img src="${event.target.result}" style="max-width: 100px; max-height: 100px; border-radius: 8px; margin-top: 5px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    };
    
    const removeImageBtn = modal.querySelector('.btn-remove-image');
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', async () => {
            const confirmed = await showConfirmDialog({
                title: 'Supprimer l\'image',
                message: 'Êtes-vous sûr de vouloir supprimer cette image ?',
                confirmText: 'Supprimer',
                cancelText: 'Annuler',
                type: 'danger'
            });
            
            if (confirmed) {
                const container = document.getElementById('currentImageContainer');
                container.innerHTML = '<p class="no-image">Image supprimée</p>';
                modal.dataset.removeImage = 'true';
                showNotification('Image supprimée', 'info', 'Image', 3000);
            }
        });
    }
    
    document.getElementById('saveEdit').onclick = () => saveEditProduct(product.id, modal);
}

// ================= GESTION DU PROFIL =================

async function loadProfile() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/auth/profil`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.succes && data.utilisateur) {
            const user = data.utilisateur;
            
            document.getElementById('profileFullName').textContent = user.nomComplet;
            document.getElementById('profilePhone').textContent = formatPhoneForDisplay(user.telephone);
            document.getElementById('profileRoleDisplay').textContent = user.role === 'agriculteur' ? 'Agriculteur' : 'Acheteur';
            document.getElementById('profileLocationDisplay').textContent = user.localisation || 'Non spécifié';
            
            // Pré-remplir le formulaire
            document.getElementById('editFullName').value = user.nomComplet;
            document.getElementById('editPhone').value = formatPhoneForDisplay(user.telephone);
            document.getElementById('editLocation').value = user.localisation || 'Dakar';
            
            document.getElementById('editCurrentPassword').value = '';
            document.getElementById('editNewPassword').value = '';
            document.getElementById('editConfirmPassword').value = '';
        }
    } catch (error) {
        console.error('Erreur chargement profil:', error);
        showNotification('Erreur de chargement du profil', 'error', 'Erreur');
    }
}

function setupProfileEdit() {
    const editBtn = document.getElementById('editProfileBtn');
    const profileView = document.getElementById('profileView');
    const profileForm = document.getElementById('profileForm');
    const cancelBtn = document.getElementById('cancelProfileEdit');
    const saveBtn = document.getElementById('saveProfileBtn');
    const phoneInput = document.getElementById('editPhone');
    
    // Formatage automatique du numéro de téléphone
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 9) value = value.slice(0, 9);
            let formatted = '';
            if (value.length >= 1) {
                formatted = value.slice(0, 2);
                if (value.length >= 3) formatted += ' ' + value.slice(2, 5);
                if (value.length >= 6) formatted += ' ' + value.slice(5, 7);
                if (value.length >= 8) formatted += ' ' + value.slice(7, 9);
            }
            this.value = formatted;
        });
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            profileView.style.display = 'none';
            profileForm.style.display = 'block';
            editBtn.style.display = 'none';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            profileView.style.display = 'block';
            profileForm.style.display = 'none';
            if (editBtn) editBtn.style.display = 'block';
            loadProfile();
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }
}

async function saveProfile() {
    const token = localStorage.getItem('token');
    const fullName = document.getElementById('editFullName').value;
    let phone = document.getElementById('editPhone').value;
    const location = document.getElementById('editLocation').value;
    const currentPassword = document.getElementById('editCurrentPassword').value;
    const newPassword = document.getElementById('editNewPassword').value;
    const confirmPassword = document.getElementById('editConfirmPassword').value;
    
    if (!fullName && !phone && !location && !currentPassword && !newPassword && !confirmPassword) {
        showNotification('Aucune modification à enregistrer', 'info', 'Information');
        return;
    }
    
    if (phone) {
        const phoneCleaned = phone.replace(/\s/g, '');
        if (phoneCleaned.length !== 9) {
            showNotification('Le numéro de téléphone doit contenir 9 chiffres (ex: 77 123 45 67)', 'warning', 'Format invalide');
            return;
        }
        const prefix = phoneCleaned.slice(0, 2);
        const validPrefixes = ['70', '75', '76', '77', '78'];
        if (!validPrefixes.includes(prefix)) {
            showNotification('Le numéro doit commencer par 70, 75, 76, 77 ou 78', 'warning', 'Format invalide');
            return;
        }
        phone = '221' + phoneCleaned;
    }
    
    let passwordUpdate = false;
    if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('Pour changer le mot de passe, veuillez remplir tous les champs', 'warning', 'Champs incomplets');
            return;
        }
        if (newPassword.length < 6) {
            showNotification('Le nouveau mot de passe doit contenir au moins 6 caractères', 'warning', 'Mot de passe trop court');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('Les nouveaux mots de passe ne correspondent pas', 'warning', 'Confirmation invalide');
            return;
        }
        passwordUpdate = true;
    }
    
    const saveBtn = document.getElementById('saveProfileBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Enregistrement...';
    saveBtn.disabled = true;
    
    try {
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (location && location !== '') updateData.location = location;
        if (phone) updateData.phone = phone;
        if (passwordUpdate) {
            updateData.currentPassword = currentPassword;
            updateData.newPassword = newPassword;
        }
        
        const response = await fetch(`${API_URL}/auth/profil`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Profil mis à jour avec succès !', 'success', 'Profil modifié');
            
            const userData = JSON.parse(localStorage.getItem('user'));
            if (fullName) userData.nomComplet = fullName;
            if (phone) userData.telephone = phone;
            if (location) userData.localisation = location;
            localStorage.setItem('user', JSON.stringify(userData));
            
            document.getElementById('profileView').style.display = 'block';
            document.getElementById('profileForm').style.display = 'none';
            const editBtn = document.getElementById('editProfileBtn');
            if (editBtn) editBtn.style.display = 'block';
            loadProfile();
            displayProfile();
            
            if (passwordUpdate) {
                showNotification('Mot de passe modifié. Veuillez vous reconnecter.', 'info', 'Reconnexion nécessaire');
                setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'index.html';
                }, 3000);
            }
        } else {
            showNotification(data.erreur || 'Erreur lors de la mise à jour', 'error', 'Erreur');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion au serveur', 'error', 'Connexion');
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// Formater le numéro pour l'affichage (ex: 760000000 -> 76 000 00 00)
function formatPhoneForDisplay(phone) {
    if (!phone) return '';
    
    // Supprimer tout ce qui n'est pas un chiffre
    let cleaned = phone.toString().replace(/\D/g, '');
    
    // Supprimer le préfixe 221 s'il est présent
    if (cleaned.startsWith('221')) {
        cleaned = cleaned.substring(3);
    }
    
    // Supprimer le préfixe 0 s'il est présent
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // Si on a exactement 9 chiffres, formater avec espaces
    if (cleaned.length === 9) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
    }
    
    return cleaned;
}

async function saveEditProduct(productId, modal) {
    const token = localStorage.getItem('token');
    const name = document.getElementById('editName').value;
    const price = document.getElementById('editPrice').value;
    const unit = document.getElementById('editUnit').value;
    const quantity = document.getElementById('editQuantity').value;
    const categoryId = document.getElementById('editCategory').value;
    const description = document.getElementById('editDescription').value;
    const imageFile = document.getElementById('editImage').files[0];
    const removeImage = modal?.dataset.removeImage === 'true';
    
    // Récupérer les régions sélectionnées dans le modal d'édition
    const selectedRegions = Array.from(
        modal.querySelectorAll('#editRegionsGroup input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    if (!name || !price || !quantity) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'warning', 'Champs manquants', 5000);
        return;
    }
    
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        showNotification('L\'image est trop volumineuse (maximum 5MB). Veuillez choisir une image plus petite.', 'error', 'Image trop grande', 8000);
        return;
    }
    
    const btn = document.getElementById('saveEdit');
    const originalText = btn.textContent;
    btn.textContent = 'Enregistrement...';
    btn.disabled = true;
    
    try {
        let imageUrl = '';
        
        if (imageFile) {
            let fileToUpload = imageFile;
            if (imageFile.size > 2 * 1024 * 1024) {
                showNotification('Compression de l\'image en cours...', 'info', 'Optimisation', 3000);
                fileToUpload = await compressImage(imageFile);
            }
            
            showNotification('Téléchargement de l\'image en cours...', 'info', 'Chargement', 3000);
            
            const formData = new FormData();
            formData.append('image', fileToUpload);
            
            const uploadResponse = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            const uploadData = await uploadResponse.json();
            if (uploadData.succes) {
                imageUrl = uploadData.url;
                showNotification('Image téléchargée avec succès !', 'success', 'Image ajoutée', 4000);
            } else {
                showNotification(uploadData.erreur || 'Erreur lors de l\'upload', 'error', 'Erreur', 6000);
                btn.textContent = originalText;
                btn.disabled = false;
                return;
            }
        }
        
        const updateData = {
            name,
            price: parseFloat(price),
            unit,
            quantity: parseFloat(quantity),
            categoryId: parseInt(categoryId),
            description,
            regions: selectedRegions
        };
        
        if (removeImage) {
            updateData.images = [];
        } else if (imageUrl) {
            updateData.images = [imageUrl];
        }
        
        const response = await fetch(`${API_URL}/produits/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Produit modifié avec succès !', 'success', 'Produit modifié', 6000);
            if (modal) modal.remove();
            await loadProducts();
            
            const productsTab = document.querySelector('.tab-dash[data-tab="products"]');
            const ordersTab = document.querySelector('.tab-dash[data-tab="orders"]');
            const productsPane = document.getElementById('productsPane');
            const ordersPane = document.getElementById('ordersPane');
            
            if (productsTab && productsPane) {
                productsTab.classList.add('active');
                ordersTab?.classList.remove('active');
                productsPane.classList.add('active');
                ordersPane?.classList.remove('active');
            }
        } else {
            showNotification(data.erreur || 'Impossible de modifier le produit', 'error', 'Erreur', 8000);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion au serveur', 'error', 'Connexion', 8000);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Redirection vers l'onglet profil
function setupAvatarRedirect() {
    const userAvatar = document.querySelector('.user-avatar-small');
    if (userAvatar) {
        userAvatar.addEventListener('click', () => {
            // Activer l'onglet profil
            const profileTab = document.querySelector('.tab-dash[data-tab="profile"]');
            const ordersTab = document.querySelector('.tab-dash[data-tab="orders"]');
            const productsTab = document.querySelector('.tab-dash[data-tab="products"]');
            const profilePane = document.getElementById('profilePane');
            const ordersPane = document.getElementById('ordersPane');
            const productsPane = document.getElementById('productsPane');
            
            // Désactiver tous les onglets
            ordersTab?.classList.remove('active');
            productsTab?.classList.remove('active');
            
            // Activer l'onglet profil
            profileTab?.classList.add('active');
            
            // Désactiver tous les panes
            ordersPane?.classList.remove('active');
            productsPane?.classList.remove('active');
            
            // Activer le pane profil
            profilePane?.classList.add('active');
        });
    }
}

// Ouvrir un onglet spécifique via l'URL
function openTabFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab === 'profile') {
        const profileTab = document.querySelector('.tab-dash[data-tab="profile"]');
        const ordersTab = document.querySelector('.tab-dash[data-tab="orders"]');
        const productsTab = document.querySelector('.tab-dash[data-tab="products"]');
        const profilePane = document.getElementById('profilePane');
        const ordersPane = document.getElementById('ordersPane');
        const productsPane = document.getElementById('productsPane');
        
        if (profileTab) {
            ordersTab?.classList.remove('active');
            productsTab?.classList.remove('active');
            profileTab.classList.add('active');
            
            ordersPane?.classList.remove('active');
            productsPane?.classList.remove('active');
            profilePane?.classList.add('active');
        }
    }
}


// ================= INITIALISATION =================

document.addEventListener('DOMContentLoaded', () => {
    displayProfile();
    setupLogout();
    setupCatalogueRedirect();
    setupTabs();
    setupAddProductForm();
    setupProfileEdit();
    openTabFromUrl();  
    loadOrders();
    loadProducts();
    loadProfile();
});