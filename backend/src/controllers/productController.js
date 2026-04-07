// Contrôleur des produits
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// Créer un produit
exports.createProduct = async (req, res) => {
    try {
        if (req.user.role !== 'farmer') {
            return res.status(403).json({ erreur: 'Seuls les agriculteurs peuvent ajouter des produits' });
        }
        
        const { name, categoryId, description, price, unit, quantity, minOrder, images } = req.body;
        
        if (!name || !price || !unit || !quantity) {
            return res.status(400).json({ erreur: 'Veuillez remplir tous les champs obligatoires' });
        }
        
        let imagesArray = [];
        if (images) {
            if (Array.isArray(images)) {
                imagesArray = images;
            } else if (typeof images === 'string') {
                imagesArray = [images];
            }
        }
        
        const product = await Product.create(req.user.id, {
            name,
            categoryId,
            description,
            price,
            unit,
            quantity,
            minOrder: minOrder || 1,
            images: imagesArray
        });
        
        res.status(201).json({
            succes: true,
            produit: {
                id: product.id,
                nom: product.name,
                prix: product.price,
                unite: product.unit,
                quantite: product.quantity,
                dateCreation: product.created_at
            }
        });
        
    } catch (error) {
        console.error('Erreur création produit:', error);
        res.status(500).json({ erreur: 'Erreur lors de la création du produit' });
    }
};

// Lister tous les produits
exports.getAllProducts = async (req, res) => {
    try {
        const { categorie, region, prixMax, recherche, tri, page = 1, limit = 20 } = req.query;
        
        const filters = {
            categoryId: categorie,
            region: region,
            maxPrice: prixMax,
            search: recherche,
            sort: tri,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const products = await Product.findAll(filters);
        
        const produitsFormatés = products.map(p => ({
            id: p.id,
            nom: p.name,
            prix: p.price,
            unite: p.unit,
            quantite: p.quantity,
            description: p.description,
            images: p.images,
            regions: p.regions,  // ← AJOUTER CETTE LIGNE
            producteur: {
                id: p.farmer_id,
                nom: p.farmer_name,
                localisation: p.farmer_location
            },
            categorie: p.category_name,
            disponible: p.is_available,
            vues: p.views
        }));
        
        res.json({
            succes: true,
            produits: produitsFormatés,
            page: parseInt(page),
            limite: parseInt(limit)
        });
        
    } catch (error) {
        console.error('Erreur liste produits:', error);
        res.status(500).json({ erreur: 'Erreur lors de la récupération des produits' });
    }
};

// Obtenir un produit par ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(parseInt(id));
        
        if (!product) {
            return res.status(404).json({ erreur: 'Produit non trouvé' });
        }
        
        res.json({
            succes: true,
            produit: {
                id: product.id,
                nom: product.name,
                prix: product.price,
                unite: product.unit,
                quantite: product.quantity,
                description: product.description,
                images: product.images,
                regions: product.regions,  // ← AJOUTER CETTE LIGNE
                producteur: {
                    id: product.farmer_id,
                    nom: product.farmer_name,
                    telephone: product.farmer_phone,
                    localisation: product.farmer_location
                },
                categorie: product.category_name,
                disponible: product.is_available,
                vues: product.views,
                dateCreation: product.created_at
            }
        });
        
    } catch (error) {
        console.error('Erreur récupération produit:', error);
        res.status(500).json({ erreur: 'Erreur lors de la récupération du produit' });
    }
};

// Obtenir les produits d'un agriculteur
exports.getFarmerProducts = async (req, res) => {
    try {
        const farmerId = req.params.farmerId || req.user.id;
        const products = await Product.findByFarmer(farmerId);
        
        const produitsFormatés = products.map(p => ({
            id: p.id,
            nom: p.name,
            prix: p.price,
            unite: p.unit,
            quantite: p.quantity,
            description: p.description,
            images: p.images,
            regions: p.regions, 
            farmer_id: p.farmer_id,
            categorie: p.category_name,
            disponible: p.is_available,
            vues: p.views,
            dateCreation: p.created_at
        }));
        
        res.json({
            succes: true,
            produits: produitsFormatés
        });
        
    } catch (error) {
        console.error('Erreur récupération produits agriculteur:', error);
        res.status(500).json({ erreur: 'Erreur lors de la récupération des produits' });
    }
};

// Mettre à jour un produit
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, quantity, description, unit, categoryId, isAvailable, images, regions } = req.body;
        
        console.log('🟢 Modification produit - Régions reçues:', regions);
        
        const oldProduct = await Product.findById(parseInt(id));
        
        if (!oldProduct) {
            return res.status(404).json({ erreur: 'Produit non trouvé' });
        }
        
        if (oldProduct.farmer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ erreur: 'Vous n\'avez pas les droits' });
        }
        
        const product = await Product.update(parseInt(id), req.user.id, {
            name,
            price,
            quantity,
            description,
            unit,
            categoryId,
            isAvailable,
            images,
            regions  // ← AJOUTER CETTE LIGNE
        });
        
        if (!product) {
            return res.status(404).json({ erreur: 'Produit non trouvé ou vous n\'avez pas les droits' });
        }
        
        res.json({
            succes: true,
            produit: {
                id: product.id,
                nom: product.name,
                prix: product.price,
                unite: product.unit,
                quantite: product.quantity,
                disponible: product.is_available
            }
        });
        
    } catch (error) {
        console.error('Erreur mise à jour produit:', error);
        res.status(500).json({ erreur: 'Erreur lors de la mise à jour du produit' });
    }
};

// Activer/Désactiver un produit
exports.toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body;
        
        const product = await Product.updateStatus(parseInt(id), req.user.id, isAvailable);
        
        if (!product) {
            return res.status(404).json({ erreur: 'Produit non trouvé ou vous n\'avez pas les droits' });
        }
        
        res.json({
            succes: true,
            produit: {
                id: product.id,
                nom: product.name,
                disponible: product.is_available
            }
        });
        
    } catch (error) {
        console.error('Erreur changement statut:', error);
        res.status(500).json({ erreur: 'Erreur lors du changement de statut' });
    }
};

// Supprimer un produit
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findById(parseInt(id));
        
        if (!product) {
            return res.status(404).json({ erreur: 'Produit non trouvé' });
        }
        
        if (product.farmer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ erreur: 'Vous n\'avez pas les droits' });
        }
        
        // Supprimer les images
        if (product.images && product.images.length > 0) {
            for (const img of product.images) {
                let imgPath = img;
                if (typeof img === 'object' && img.url) {
                    imgPath = img.url;
                }
                const filename = path.basename(imgPath);
                const filePath = path.join(__dirname, '../../uploads/', filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Image supprimée:', filePath);
                }
            }
        }
        
        const deleted = await Product.delete(parseInt(id), req.user.id);
        
        if (!deleted) {
            return res.status(404).json({ erreur: 'Produit non trouvé ou vous n\'avez pas les droits' });
        }
        
        res.json({
            succes: true,
            message: 'Produit supprimé avec succès'
        });
        
    } catch (error) {
        console.error('Erreur suppression produit:', error);
        res.status(500).json({ erreur: 'Erreur lors de la suppression du produit' });
    }
};