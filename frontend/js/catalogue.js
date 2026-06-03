// =========================================
// AgriConnect Sénégal — catalogue.js
// =========================================

const API_URL = 'https://agriconnect-api-ylnb.onrender.com/api/v1';
const BACKEND_URL = 'http://localhost:3000';

// État des filtres
let currentFilters = {
    categorie: '',
    regions: [],
    prixMax: 100000,
    tri: 'recent',
    recherche: '',
    page: 1
};

// ================= AUTHENTIFICATION =================
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        localStorage.removeItem('agriconnect_cart');
        window.location.href = 'index.html';
        return null;
    }
    
    return { token, user: JSON.parse(user) };
}

function displayUserName() {
    const userData = checkAuth();
    if (userData) {
        const userNameSpan = document.getElementById('userNameDisplay');
        const now = new Date();
        const hour = now.getHours();
        
        let greeting = '';
        if (hour >= 5 && hour < 12) greeting = 'Bonjour';
        else if (hour >= 12 && hour < 18) greeting = 'Bon après-midi';
        else greeting = 'Bonsoir';
        
        if (userNameSpan) {
            userNameSpan.innerHTML = `${greeting}, <strong>${userData.user.nomComplet}</strong>`;
        }
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('agriconnect_cart');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
}

function setupDashboardRedirect() {
    const dashboardBtn = document.getElementById('dashboardBtn');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }
}

// ================= GESTION DES FILTRES =================
function setupRegionFilter() {
    const toggle = document.getElementById('filterToggle');
    const dropdown = document.getElementById('regionsDropdown');
    
    if (toggle && dropdown) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        dropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                currentFilters.regions = getSelectedRegions();
                currentFilters.page = 1;
                loadProducts();
            });
        });
    }
}

function getSelectedRegions() {
    const checkboxes = document.querySelectorAll('#regionsDropdown input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function setupFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.categorie = e.target.value;
            currentFilters.page = 1;
            loadProducts();
        });
    }
    
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            currentFilters.tri = e.target.value;
            currentFilters.page = 1;
            loadProducts();
        });
    }
    
    const priceFilter = document.getElementById('priceFilter');
    const priceValue = document.getElementById('priceValue');
    if (priceFilter && priceValue) {
        priceFilter.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            priceValue.textContent = value.toLocaleString();
            currentFilters.prixMax = value;
        });
        
        priceFilter.addEventListener('change', () => {
            currentFilters.page = 1;
            loadProducts();
        });
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentFilters.recherche = e.target.value;
                currentFilters.page = 1;
                loadProducts();
            }, 500);
        });
    }
    
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (categoryFilter) categoryFilter.value = '';
            if (sortFilter) sortFilter.value = 'recent';
            if (priceFilter) priceFilter.value = '100000';
            if (priceValue) priceValue.textContent = '100 000';
            if (searchInput) searchInput.value = '';
            
            const regionCheckboxes = document.querySelectorAll('#regionsDropdown input[type="checkbox"]');
            regionCheckboxes.forEach(cb => cb.checked = false);
            
            currentFilters = {
                categorie: '',
                regions: [],
                prixMax: 100000,
                tri: 'recent',
                recherche: '',
                page: 1
            };
            
            loadProducts();
        });
    }
}

// ================= CHARGEMENT DES PRODUITS =================
async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Chargement des produits...</p>
        </div>
    `;
    
    let url = `${API_URL}/produits?`;
    if (currentFilters.categorie) url += `categorie=${currentFilters.categorie}&`;
    if (currentFilters.tri) url += `tri=${currentFilters.tri}&`;
    if (currentFilters.prixMax && currentFilters.prixMax < 100000) url += `prixMax=${currentFilters.prixMax}&`;
    if (currentFilters.recherche) url += `recherche=${encodeURIComponent(currentFilters.recherche)}&`;
    if (currentFilters.regions.length > 0) url += `region=${currentFilters.regions[0]}&`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.succes && data.produits) {
            displayProducts(data.produits);
        } else {
            productsGrid.innerHTML = '<p class="empty-message">Aucun produit disponible</p>';
        }
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        productsGrid.innerHTML = '<p class="error-message">Erreur de chargement des produits</p>';
    }
}

function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = '<p class="empty-message">Aucun produit trouvé</p>';
        return;
    }
    
    productsGrid.innerHTML = products.map(product => {
        let imageUrl = '';
        if (product.images && product.images.length > 0) {
            let imgPath = product.images[0];
            if (typeof imgPath === 'object' && imgPath.url) imgPath = imgPath.url;
            imageUrl = `${BACKEND_URL}${imgPath}`;
        }
        
        const regionsText = product.regions && product.regions.length > 0 
            ? `📍 ${product.regions.join(', ')}` 
            : '📍 Livraison nationale';
        
        const farmerId = product.producteur?.id || product.farmer_id;
        
        return `
            <div class="product-card" data-id="${product.id}" data-farmer-id="${farmerId || ''}">
                <div class="product-image">
                    ${imageUrl ? 
                        `<img src="${imageUrl}" alt="${product.nom}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                        '<span>🌾</span>'}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${escapeHtml(product.nom)}</h3>
                    <p class="product-farmer">${escapeHtml(product.producteur?.nom || 'Producteur')} • ${escapeHtml(product.producteur?.localisation || '')}</p>
                    <p class="product-price">${Math.floor(product.prix).toLocaleString()} FCFA <small>/${product.unite}</small></p>
                    <p class="product-regions" style="font-size: 0.7rem; color: #7AB648; margin: 0.25rem 0;">${regionsText}</p>
                    <div class="product-footer">
                        <span class="product-stock">Stock: ${Math.floor(product.quantite)} ${product.unite}</span>
                        <button class="btn-add-cart" data-id="${product.id}">Ajouter</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-add-cart')) {
                openProductDetail(card.dataset.id);
            }
        });
    });
    
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(btn.dataset.id);
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================= MODAL DÉTAILS =================
async function openProductDetail(productId) {
    const modal = document.getElementById('productDetailModal');
    if (!modal) return;
    
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
        const response = await fetch(`${API_URL}/produits/${productId}`, { headers });
        const data = await response.json();
        
        if (response.ok && data.succes && data.produit) {
            const p = data.produit;
            
            document.getElementById('detailProductName').textContent = p.nom || 'Sans nom';
            document.getElementById('detailProductPrice').textContent = `${Math.floor(p.prix || 0).toLocaleString()} FCFA`;
            document.getElementById('detailProductUnit').textContent = `/${p.unite || 'kg'}`;
            document.getElementById('detailProductFarmer').textContent = p.producteur?.nom || p.farmer_name || 'Inconnu';
            document.getElementById('detailProductLocation').textContent = p.producteur?.localisation || p.farmer_location || 'Non spécifiée';
            document.getElementById('detailProductRegions').textContent = p.regions && p.regions.length > 0 ? p.regions.join(', ') : 'Livraison nationale';
            document.getElementById('detailProductStock').textContent = `${Math.floor(p.quantite || 0)} ${p.unite || 'kg'}`;
            document.getElementById('detailProductDescription').textContent = p.description || 'Aucune description';
            document.getElementById('detailProductViews').textContent = p.vues || 0;
            document.getElementById('detailProductDate').textContent = new Date(p.dateCreation).toLocaleDateString('fr-FR');
            
            const imgElement = document.getElementById('detailProductImage');
            if (p.images && p.images.length > 0) {
                let imgPath = p.images[0];
                if (typeof imgPath === 'object' && imgPath.url) imgPath = imgPath.url;
                imgElement.src = `${BACKEND_URL}${imgPath}`;
                imgElement.style.display = 'block';
            } else {
                imgElement.style.display = 'none';
            }
            
            modal.dataset.productId = productId;
            modal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de chargement des détails', 'error', 'Erreur');
    }
}

function closeProductDetailModal() {
    const modal = document.getElementById('productDetailModal');
    if (modal) modal.style.display = 'none';
}

function addToCartFromDetail() {
    const modal = document.getElementById('productDetailModal');
    const productId = modal?.dataset.productId;
    if (productId) {
        addToCart(productId);
        closeProductDetailModal();
    }
}

function setupDetailModal() {
    const modal = document.getElementById('productDetailModal');
    const closeBtn = document.getElementById('closeDetailModal');
    const closeBtn2 = document.getElementById('closeDetailModalBtn');
    const addToCartBtn = document.getElementById('detailAddToCart');
    
    if (closeBtn) closeBtn.onclick = closeProductDetailModal;
    if (closeBtn2) closeBtn2.onclick = closeProductDetailModal;
    if (addToCartBtn) addToCartBtn.onclick = addToCartFromDetail;
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeProductDetailModal();
        });
    }
}

// ================= PANIER =================
function addToCart(productId) {
    const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (!productCard) return;
    
    const productName = productCard.querySelector('.product-name')?.textContent || 'Produit';
    const productPriceText = productCard.querySelector('.product-price')?.textContent || '0';
    const productPrice = parseInt(productPriceText.replace(/\D/g, ''));
    const productUnit = productCard.querySelector('.product-price small')?.textContent?.replace('/', '') || 'kg';
    let farmerId = productCard.dataset.farmerId;
    
    let productImage = '';
    const productImageElem = productCard.querySelector('.product-image img');
    if (productImageElem) productImage = productImageElem.src;
    
    Cart.addItem({
        id: parseInt(productId),
        name: productName,
        price: productPrice,
        unit: productUnit,
        image: productImage,
        farmerId: farmerId
    });
}

// ================= NOTIFICATIONS =================
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

// ================= AVATAR =================
function setupAvatarRedirect() {
    const userAvatar = document.querySelector('.user-avatar-small');
    if (userAvatar) {
        userAvatar.addEventListener('click', () => {
            window.location.href = 'dashboard.html?tab=profile';
        });
    }
}

// ================= COMMANDE =================
let pendingOrder = null;

function openDeliveryModal() {
    const modal = document.getElementById('deliveryModal');
    const userData = checkAuth();
    
    if (modal && userData) {
        const userPhone = userData.user.telephone;
        const formattedPhone = userPhone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
        document.getElementById('existingPhoneDisplay').textContent = formattedPhone;
        
        document.getElementById('deliveryRegion').value = '';
        document.getElementById('deliveryQuartier').value = '';
        document.getElementById('deliveryPhoneNew').value = '';
        document.getElementById('deliveryPhoneNew').style.display = 'none';
        document.querySelector('input[name="deliveryPhoneOption"][value="existing"]').checked = true;
        
        modal.style.display = 'flex';
    }
}

function closeDeliveryModal() {
    const modal = document.getElementById('deliveryModal');
    if (modal) modal.style.display = 'none';
}

function setupDeliveryModal() {
    const closeBtn = document.getElementById('closeDeliveryModal');
    const cancelBtn = document.getElementById('cancelDeliveryBtn');
    const confirmBtn = document.getElementById('confirmDeliveryBtn');
    const phoneOptions = document.querySelectorAll('input[name="deliveryPhoneOption"]');
    const newPhoneInput = document.getElementById('deliveryPhoneNew');
    
    if (closeBtn) closeBtn.onclick = closeDeliveryModal;
    if (cancelBtn) cancelBtn.onclick = closeDeliveryModal;
    
    phoneOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            newPhoneInput.style.display = e.target.value === 'new' ? 'block' : 'none';
        });
    });
    
    if (confirmBtn) confirmBtn.onclick = confirmOrder;
    
    const modal = document.getElementById('deliveryModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDeliveryModal();
        });
    }
}

async function createOrder() {
    const userData = checkAuth();
    if (!userData) return;
    
    const items = Cart.getItems();
    if (items.length === 0) {
        showNotification('Votre panier est vide', 'warning', 'Panier');
        return;
    }
    
    const farmerId = items[0].farmerId;
    const sameFarmer = items.every(item => item.farmerId === farmerId);
    
    if (!sameFarmer) {
        showNotification('Vous ne pouvez commander que des produits du même producteur', 'warning', 'Commande');
        return;
    }
    
    if (!farmerId) {
        showNotification('Impossible d\'identifier le producteur', 'error', 'Erreur');
        return;
    }
    
    pendingOrder = {
        farmerId: parseInt(farmerId),
        items: items.map(item => ({ productId: item.id, quantity: item.quantity }))
    };
    
    openDeliveryModal();
}

async function confirmOrder() {
    const region = document.getElementById('deliveryRegion').value;
    const quartier = document.getElementById('deliveryQuartier').value;
    const useExisting = document.querySelector('input[name="deliveryPhoneOption"][value="existing"]').checked;
    let deliveryPhone = useExisting ? checkAuth().user.telephone : document.getElementById('deliveryPhoneNew').value;
    
    if (!region || !quartier) {
        showNotification('Veuillez remplir tous les champs', 'warning', 'Champs manquants');
        return;
    }
    
    if (!useExisting && !deliveryPhone) {
        showNotification('Veuillez entrer votre numéro de téléphone', 'warning', 'Champs manquants');
        return;
    }
    
    let cleanedPhone = deliveryPhone.toString().replace(/\s/g, '').replace(/\D/g, '');
    if (cleanedPhone.startsWith('221')) cleanedPhone = cleanedPhone.substring(3);
    if (cleanedPhone.startsWith('0')) cleanedPhone = cleanedPhone.substring(1);
    
    if (cleanedPhone.length !== 9) {
        showNotification('Numéro de téléphone invalide (9 chiffres)', 'warning', 'Format invalide');
        return;
    }
    
    const deliveryAddress = `${quartier}, ${region}`;
    const formattedPhone = '221' + cleanedPhone;
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/commandes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                farmerId: pendingOrder.farmerId,
                items: pendingOrder.items,
                deliveryAddress: deliveryAddress,
                deliveryPhone: formattedPhone
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Commande créée avec succès !', 'success', 'Commande');
            Cart.clear();
            closeDeliveryModal();
            pendingOrder = null;
        } else {
            showNotification(data.erreur || 'Erreur lors de la création', 'error', 'Erreur');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion au serveur', 'error', 'Connexion');
    }
}

// ================= INITIALISATION =================
function initCart() {
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => Cart.openModal());
    }
    
    const closeCart = document.getElementById('closeCartModal');
    if (closeCart) {
        closeCart.addEventListener('click', () => Cart.closeModal());
    }
    
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) Cart.closeModal();
        });
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            Cart.closeModal();
            createOrder();
        });
    }
    
    Cart.updateBadge();
}

document.addEventListener('DOMContentLoaded', () => {
    initCart();
    displayUserName();
    setupLogout();
    setupDashboardRedirect();
    setupRegionFilter();
    setupFilters();
    setupDetailModal();
    setupDeliveryModal();
    setupAvatarRedirect();
    loadProducts();
});