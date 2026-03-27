// Contrôleur des produits
const Product = require('../models/Product');

// Créer un produit (producteur uniquement)
exports.createProduct = async (req, res) => {
    try {
        // Vérifier que l'utilisateur est un producteur
        if (req.user.role !== 'farmer') {
            return res.status(403).json({ error: 'Seuls les producteurs peuvent ajouter des produits' });
        }
        
        const { name, categoryId, description, price, unit, quantity, minOrder, images } = req.body;
        
        // Validation des champs obligatoires
        if (!name || !price || !unit || !quantity) {
            return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires' });
        }
        
        const product = await Product.create(req.user.id, {
            name,
            categoryId,
            description,
            price,
            unit,
            quantity,
            minOrder,
            images
        });
        
        res.status(201).json({
            success: true,
            product
        });
        
    } catch (error) {
        console.error('Erreur création produit:', error);
        res.status(500).json({ error: 'Erreur lors de la création du produit' });
    }
};

// Lister tous les produits
exports.getAllProducts = async (req, res) => {
    try {
        const { category, region, maxPrice, search, sort, page = 1, limit = 20 } = req.query;
        
        const filters = {
            categoryId: category,
            region: region,
            maxPrice: maxPrice,
            search: search,
            sort: sort,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const products = await Product.findAll(filters);
        
        res.json({
            success: true,
            products,
            page: parseInt(page),
            limit: parseInt(limit)
        });
        
    } catch (error) {
        console.error('Erreur liste produits:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
    }
};

// Obtenir un produit par ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }
        
        res.json({
            success: true,
            product
        });
        
    } catch (error) {
        console.error('Erreur récupération produit:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
    }
};

// Obtenir les produits d'un producteur
exports.getFarmerProducts = async (req, res) => {
    try {
        const farmerId = req.params.farmerId || req.user.id;
        const products = await Product.findByFarmer(farmerId);
        
        res.json({
            success: true,
            products
        });
        
    } catch (error) {
        console.error('Erreur récupération produits producteur:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
    }
};

// Mettre à jour un produit (producteur uniquement)
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, quantity, description, isAvailable } = req.body;
        
        const product = await Product.update(id, req.user.id, {
            name,
            price,
            quantity,
            description,
            isAvailable
        });
        
        if (!product) {
            return res.status(404).json({ error: 'Produit non trouvé ou vous n\'avez pas les droits' });
        }
        
        res.json({
            success: true,
            product
        });
        
    } catch (error) {
        console.error('Erreur mise à jour produit:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du produit' });
    }
};

// Supprimer un produit (producteur uniquement)
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.delete(id, req.user.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Produit non trouvé ou vous n\'avez pas les droits' });
        }
        
        res.json({
            success: true,
            message: 'Produit supprimé avec succès'
        });
        
    } catch (error) {
        console.error('Erreur suppression produit:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
    }
};