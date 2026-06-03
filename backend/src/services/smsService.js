// Service d'envoi de SMS
class SmsService {
    // Envoyer un SMS (simulé pour le développement)
    async sendSms(phoneNumber, message) {
        console.log(`========================================`);
        console.log(`📱 ENVOI SMS VERS: ${phoneNumber}`);
        console.log(`📝 MESSAGE: ${message}`);
        console.log(`========================================`);
        return { success: true, message: 'SMS envoyé' };
    }

    // Envoyer un code de validation après inscription
    async sendValidationCode(phone, code) {
        const message = `Bienvenue sur AgriConnect Sénégal ! Votre code de validation est : ${code}. Valide 10 minutes.`;
        return this.sendSms(phone, message);
    }

    // Envoyer une confirmation de commande (à l'acheteur)
    async sendOrderConfirmation(phone, orderNumber, total) {
        const message = `AgriConnect : Votre commande ${orderNumber} d'un montant de ${total} FCFA a été confirmée. Merci !`;
        return this.sendSms(phone, message);
    }

    // Envoyer une notification de nouvelle commande (au producteur)
    async sendNewOrderNotification(phone, orderNumber, buyerName, total) {
        const message = `🆕 Nouvelle commande ${orderNumber} de ${buyerName} pour ${total} FCFA. Connectez-vous pour la traiter.`;
        return this.sendSms(phone, message);
    }

    // Envoyer une confirmation de commande (méthode alternative)
    async sendOrderConfirmed(phone, orderNumber) {
        const message = `✅ AgriConnect - Votre commande ${orderNumber} a été confirmée. Merci pour votre confiance !`;
        return this.sendSms(phone, message);
    }

    // Envoyer une notification d'expédition
    async sendOrderShipped(phone, orderNumber) {
        const message = `🚚 AgriConnect - Votre commande ${orderNumber} a été expédiée. Vous serez notifié à la livraison.`;
        return this.sendSms(phone, message);
    }

    // Envoyer une notification de livraison
    async sendOrderDelivered(phone, orderNumber) {
        const message = `🎉 AgriConnect - Votre commande ${orderNumber} a été livrée ! Merci d'avoir utilisé AgriConnect.`;
        return this.sendSms(phone, message);
    }

    // Envoyer une notification d'annulation
    async sendOrderCancelled(phone, orderNumber) {
        const message = `❌ AgriConnect - Votre commande ${orderNumber} a été annulée. Contactez-nous pour plus d'informations.`;
        return this.sendSms(phone, message);
    }
}

module.exports = new SmsService();