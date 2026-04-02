// Contrôleur des produits
const Product = require('../models/Product');

// Créer un produit (agriculteur uniquement)
exports.createProduct = async (req, res) => {
    try {
        if (req.user.role !== 'farmer') {
            return res.status(403).json({ erreur: 'Seuls les agriculteurs peuvent ajouter des produits' });
        }
        
        const { name, categoryId, description, price, unit, quantity, minOrder, images, regions } = req.body;
        
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
            images: imagesArray,
            regions: regions || []
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
            producteur: {
                id: p.farmer_id,        // ← AJOUTER CETTE LIGNE
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
        const product = await Product.findById(id);
        
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
                producteur: {
                    id: product.farmer_id,      // ← AJOUTER CETTE LIGNE
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
            farmer_id: p.farmer_id,     // ← AJOUTER CETTE LIGNE
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

// Mettre à jour un produit (agriculteur uniquement)
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, quantity, description, unit, categoryId, isAvailable, regions, images } = req.body;
        
        const product = await Product.update(id, req.user.id, {
            name,
            price,
            quantity,
            description,
            unit,
            categoryId,
            isAvailable,
            regions,
            images  // ← Ajouter cette ligne
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
                disponible: product.is_available,
                regions: product.regions || []
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
        
        const product = await Product.updateStatus(id, req.user.id, isAvailable);
        
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

// Supprimer un produit (agriculteur uniquement)
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.delete(id, req.user.id);
        
        if (!product) {
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