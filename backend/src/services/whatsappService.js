// Service d'envoi de messages WhatsApp via Twilio
const twilio = require('twilio');

class WhatsAppService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.from = process.env.TWILIO_WHATSAPP_FROM;
        this.mode = process.env.SMS_MODE || 'development';
        
        if (this.accountSid && this.authToken && this.mode === 'production') {
            this.client = twilio(this.accountSid, this.authToken);
        }
    }

    // Formater le numéro pour WhatsApp
    formatPhoneNumber(phone) {
        let cleaned = phone.toString().replace(/\s/g, '').replace(/\D/g, '');
        if (cleaned.startsWith('221')) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        return `whatsapp:+221${cleaned}`;
    }

    // Envoyer un message WhatsApp via Twilio
    async sendWhatsApp(phoneNumber, message) {
        if (!this.client) {
            console.log(`⚠️ Twilio non configuré. Message non envoyé.`);
            return { success: false, error: 'Twilio non configuré' };
        }

        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            const twilioMessage = await this.client.messages.create({
                from: this.from,
                to: formattedPhone,
                body: message
            });

            console.log(`✅ WhatsApp envoyé à ${formattedPhone} (SID: ${twilioMessage.sid})`);
            return { success: true, sid: twilioMessage.sid };
        } catch (error) {
            console.error('Erreur envoi WhatsApp:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Envoyer un message (simulé ou réel)
    async sendMessage(phoneNumber, message) {
        if (this.mode === 'development') {
            console.log(`========================================`);
            console.log(`📱 [MODE DEV] WhatsApp à envoyer à: ${phoneNumber}`);
            console.log(`📝 MESSAGE: ${message}`);
            console.log(`========================================`);
            return { success: true };
        }
        
        return this.sendWhatsApp(phoneNumber, message);
    }

    // Code de validation
    async sendValidationCode(phone, code) {
        const message = `🌱 *AgriConnect Sénégal*\n\nBienvenue ! Votre code de validation est : *${code}*\nValable 10 minutes.\n\nMerci de nous faire confiance.`;
        return this.sendMessage(phone, message);
    }

    // Confirmation de commande
    async sendOrderConfirmed(phone, orderNumber) {
        const message = `✅ *AgriConnect Sénégal*\n\nVotre commande *${orderNumber}* a été confirmée.\n\nNous vous tiendrons informé. Merci !`;
        return this.sendMessage(phone, message);
    }

    // Nouvelle commande (producteur)
    async sendNewOrderNotification(phone, orderNumber, buyerName, total) {
        const message = `🆕 *AgriConnect Sénégal*\n\nNouvelle commande *${orderNumber}*\nClient: ${buyerName}\nMontant: ${total} FCFA\n\nConnectez-vous pour la traiter.`;
        return this.sendMessage(phone, message);
    }

    // Commande expédiée
    async sendOrderShipped(phone, orderNumber) {
        const message = `🚚 *AgriConnect Sénégal*\n\nVotre commande *${orderNumber}* a été expédiée !\n\nVous recevrez un message à la livraison.`;
        return this.sendMessage(phone, message);
    }

    // Commande livrée
    async sendOrderDelivered(phone, orderNumber) {
        const message = `🎉 *AgriConnect Sénégal*\n\nVotre commande *${orderNumber}* a été livrée !\n\nMerci d'avoir utilisé AgriConnect.`;
        return this.sendMessage(phone, message);
    }

    // Commande annulée
    async sendOrderCancelled(phone, orderNumber) {
        const message = `❌ *AgriConnect Sénégal*\n\nVotre commande *${orderNumber}* a été annulée.\n\nContactez-nous pour plus d'informations.`;
        return this.sendMessage(phone, message);
    }
}

module.exports = new WhatsAppService();