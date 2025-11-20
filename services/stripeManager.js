const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

// IDs de produto fornecidos pelo usuário
const PRODUCT_IDS = {
    SUBSCRIPTION_SCREEN: 'prod_TSBFAZOMsCNIAT',
    FIXED_BOT: 'prod_TSBFZleC61Rm5y',
    // O usuário pediu para remover prod_TSBEUvesZnyFJO
};

// Chaves de API (o usuário forneceu IDs de produto, mas usaremos as chaves de API do .env)
// Assumindo que as chaves de API do Stripe serão adicionadas ao .env
const STRIPE_KEYS = {
    PUBLIC: process.env.STRIPE_PUBLIC_KEY,
    SECRET: process.env.STRIPE_SECRET_KEY,
};

/**
 * Cria uma sessão de checkout para um novo cliente.
 * @param {string} email - Email do cliente.
 * @param {string} priceId - ID do preço do Stripe.
 * @param {string} mode - 'subscription' ou 'payment'.
 * @returns {Promise<object>} - Objeto de sessão do Stripe.
 */
async function createCheckoutSession(email, priceId, mode = 'subscription') {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: mode,
            customer_email: email,
            success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
        });
        return session;
    } catch (error) {
        console.error('Erro ao criar sessão de checkout do Stripe:', error);
        throw new Error('Falha ao criar sessão de checkout.');
    }
}

/**
 * Lógica para lidar com o webhook do Stripe.
 * @param {object} event - Objeto de evento do Stripe.
 */
async function handleWebhook(event) {
    const data = event.data.object;
    const eventType = event.type;

    console.log(`Webhook Stripe Recebido: ${eventType}`);

    switch (eventType) {
        case 'checkout.session.completed':
            // O pagamento foi bem-sucedido e a assinatura foi criada
            const customerEmail = data.customer_details.email;
            const subscriptionId = data.subscription;
            const customerId = data.customer;
            
            // 1. Criar o novo usuário no sistema
            const users = db.readUsers();
            const newUserId = customerEmail.split('@')[0]; // Usando o prefixo do email como ID de usuário/cliente
            
            if (!users[newUserId]) {
                users[newUserId] = {
                    email: customerEmail,
                    password: 'TEMP_PASSWORD', // O usuário deve ser forçado a definir uma senha
                    clientId: newUserId,
                    stripe: {
                        customerId: customerId,
                        subscriptionId: subscriptionId,
                        status: 'active',
                        plan: 'free_trial' // Assumindo que o primeiro pagamento é um trial
                    }
                };
                db.writeUsers(users);
                db.ensureClientDir(newUserId); // Cria o diretório do novo cliente/banco
                console.log(`Novo cliente criado: ${newUserId}. Banco de dados multi-tenant inicializado.`);
            }
            
            // 2. Ativar o plano free de 30 dias (se aplicável)
            // A lógica de trial é geralmente configurada no Price do Stripe.
            // Aqui, apenas garantimos que o status está ativo.
            
            break;
            
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            // Lidar com mudanças de status da assinatura (ativa, cancelada, etc.)
            const sub = data;
            const subCustomerId = sub.customer;
            const subStatus = sub.status;
            
            // Encontrar o usuário pelo customerId do Stripe e atualizar o status
            const allUsers = db.readUsers();
            for (const userId in allUsers) {
                if (allUsers[userId].stripe && allUsers[userId].stripe.customerId === subCustomerId) {
                    allUsers[userId].stripe.status = subStatus;
                    // Se o status for 'canceled' ou 'unpaid', desativar o acesso
                    if (subStatus === 'canceled' || subStatus === 'unpaid') {
                        console.log(`Assinatura do cliente ${userId} cancelada/inativa. Desativando acesso.`);
                        // Lógica para desativar o acesso e desconectar bots
                    }
                    db.writeUsers(allUsers);
                    break;
                }
            }
            break;
            
        // Outros eventos importantes: invoice.payment_succeeded, invoice.payment_failed
        default:
            console.log(`Evento Stripe não tratado: ${eventType}`);
    }
}

/**
 * Verifica se um cliente tem uma assinatura ativa.
 * @param {string} clientId - ID do cliente.
 * @returns {boolean} - True se a assinatura estiver ativa.
 */
function isSubscriptionActive(clientId) {
    const users = db.readUsers();
    const user = users[clientId];
    
    if (!user || !user.stripe) {
        return false;
    }
    
    // O Stripe usa status como 'active', 'trialing', 'past_due', 'canceled', 'unpaid'
    const activeStatuses = ['active', 'trialing'];
    return activeStatuses.includes(user.stripe.status);
}

module.exports = {
    stripe,
    PRODUCT_IDS,
    STRIPE_KEYS,
    createCheckoutSession,
    handleWebhook,
    isSubscriptionActive
};
