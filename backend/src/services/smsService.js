// Service d'envoi de SMS
class SmsService {
    // Envoyer un SMS (simulé pour le développement)
    async sendSms(phoneNumber, message) {
        console.log(`========================================`);
        console.log(`📱 ENVOI SMS VERS: ${phoneNumber}`);
        console.log(`📝 MESSAGE: ${message}`);
        console.log(`========================================`);
        
        // Ici, plus tard on ajoutera l'API réelle d'Orange
        return { success: true, message: 'SMS envoyé' };
    }

    // Envoyer un code de validation après inscription
    async sendValidationCode(phone, code) {
        const message = `Bienvenue sur AgriConnect Sénégal ! Votre code de validation est : ${code}. Ce code expire dans 10 minutes.`;
        return this.sendSms(phone, message);
    }

    // Envoyer une confirmation de commande
    async sendOrderConfirmation(phone, orderNumber, total) {
        const message = `AgriConnect : Votre commande ${orderNumber} d'un montant de ${total} FCFA a été confirmée. Vous serez notifié de sa livraison. Merci !`;
        return this.sendSms(phone, message);
    }
}

module.exports = new SmsService();