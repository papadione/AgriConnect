/**
 * PRODUCT.CONTROLLER : Logique métier pour les produits
 * Reçoit la requête, traite les données, et renvoie la réponse.
 */

exports.getAllProducts = async (req, res) => {
    try {
        // Simulation de données (Le futur SELECT * FROM products en SQL)
        const products = [
            { id: 1, name: "Mangue Kent", price: 500, unit: "kg", region: "Casamance", category: "Fruits" },
            { id: 2, name: "Riz Parfumé", price: 17500, unit: "sac", region: "Saint-Louis", category: "Céréales" }
        ];

        // On renvoie un code 200 (Succès) avec les données en JSON
        res.status(200).json(products);
    } catch (error) {
        // En cas de bug, on renvoie une erreur 500
        res.status(500).json({ error: "Impossible de récupérer les produits pour le moment." });
    }
};