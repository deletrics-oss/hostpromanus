const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const stripeManager = require('../services/stripeManager');

// Rota para criar uma sessão de checkout
router.post('/create-checkout-session', async (req, res) => {
    const { email, priceId, mode } = req.body;
    
    if (!email || !priceId) {
        return res.status(400).json({ error: 'Email e Price ID são obrigatórios.' });
    }
    
    try {
        const session = await stripeManager.createCheckoutSession(email, priceId, mode);
        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota de Webhook do Stripe
// O Stripe exige o uso de raw body para validação da assinatura
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // O segredo do webhook deve ser adicionado ao .env
        event = stripeManager.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`⚠️ Erro de verificação do Webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Passa o evento para o manager para processamento
    await stripeManager.handleWebhook(event);

    // Retorna um 200 para o Stripe
    res.json({ received: true });
});

module.exports = router;
