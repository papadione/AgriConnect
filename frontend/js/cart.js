// =========================================
// AgriConnect Sénégal — cart.js
// =========================================

const CART_KEY = 'agriconnect_cart';

// Gestion du panier
const Cart = {
    getItems() {
        const cart = localStorage.getItem(CART_KEY);
        return cart ? JSON.parse(cart) : [];
    },
    
    saveItems(items) {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
        this.updateBadge();
        this.updateCartModal();
    },
    
    addItem(product) {
        const items = this.getItems();
        const existing = items.find(item => item.id === product.id);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                image: product.image,
                quantity: 1
            });
        }
        
        this.saveItems(items);
        this.showNotification(`${product.name} ajouté au panier`, 'success');
    },
    
    // === NOTIFICATION (AJOUTER CETTE FONCTION) ===
    showNotification(message, type = 'success') {
        const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
        const titles = { success: 'Succès', error: 'Erreur', info: 'Information', warning: 'Attention' };
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${icons[type]}</div>
            <div class="notification-content">
                <div class="notification-title">${titles[type]}</div>
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
        }, 3000);
    },
    
    removeItem(productId) {
        let items = this.getItems();
        items = items.filter(item => item.id !== productId);
        this.saveItems(items);
        this.showNotification('Article retiré du panier', 'info');
    },
    
    updateQuantity(productId, quantity) {
        if (quantity <= 0) {
            this.removeItem(productId);
            return;
        }
        
        const items = this.getItems();
        const item = items.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            this.saveItems(items);
        }
    },
    
    getTotal() {
        const items = this.getItems();
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    getItemCount() {
        const items = this.getItems();
        return items.reduce((count, item) => count + item.quantity, 0);
    },
    
    updateBadge() {
        const badge = document.getElementById('cartCount');
        if (badge) {
            const count = this.getItemCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },
    
    updateCartModal() {
        const cartItemsDiv = document.getElementById('cartItems');
        const cartTotalSpan = document.getElementById('cartTotal');
        
        if (!cartItemsDiv) return;
        
        const items = this.getItems();
        
        if (items.length === 0) {
            cartItemsDiv.innerHTML = '<p class="empty-cart">Votre panier est vide</p>';
            if (cartTotalSpan) cartTotalSpan.textContent = '0 FCFA';
            return;
        }
        
        cartItemsDiv.innerHTML = items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price.toLocaleString()} FCFA / ${item.unit}</div>
                    <div class="cart-item-quantity">
                        <button class="cart-qty-minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="cart-qty-plus" data-id="${item.id}">+</button>
                        <button class="cart-item-remove" data-id="${item.id}" title="Supprimer">✕</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.cart-qty-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const item = items.find(i => i.id === id);
                if (item) this.updateQuantity(id, item.quantity - 1);
            });
        });
        
        document.querySelectorAll('.cart-qty-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const item = items.find(i => i.id === id);
                if (item) this.updateQuantity(id, item.quantity + 1);
            });
        });
        
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.removeItem(id);
            });
        });
        
        if (cartTotalSpan) {
            cartTotalSpan.textContent = `${this.getTotal().toLocaleString()} FCFA`;
        }
    },
    
    openModal() {
        const modal = document.getElementById('cartModal');
        if (modal) {
            this.updateCartModal();
            modal.style.display = 'flex';
        }
    },
    
    closeModal() {
        const modal = document.getElementById('cartModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
};

// Initialisation
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
    
    Cart.updateBadge();
}