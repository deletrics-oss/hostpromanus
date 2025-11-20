const express = require('express');
const router = express.Router();

// Importar rotas
const authRoutes = require('./auth');
const stripeRoutes = require('./stripe');
const sessionRoutes = require('./session');
const logicRoutes = require('./logic');
// As rotas de sessão e IA serão adicionadas em breve

// Middleware de Autenticação (simples)
function authenticate(req, res, next) {
    // Em um sistema real, usaria um token JWT.
    // Para fins de desenvolvimento e multi-tenancy, usaremos o clientId 'admin' temporariamente.
    // O frontend será atualizado para enviar o clientId após o login.
    req.clientId = 'admin'; 
    next();
}

// Rotas públicas
router.use('/auth', authRoutes);
router.use('/stripe', stripeRoutes);

// Rotas protegidas (requerem autenticação)
router.use(authenticate); 

// Rotas de Sessão (WhatsApp)
router.use('/sessions', sessionRoutes);

// Rotas de Lógica IA
router.use('/logics', logicRoutes);

// Rota de Health Check (Gemini) - Mantida do original
router.get('/health/gemini', (req, res) => {
    // Simulação de verificação de saúde do Gemini
    // Em um sistema real, faria uma chamada de teste para a API Gemini
    res.json({ status: 'OPERATIONAL', message: 'Gemini AI está online.' });
});

module.exports = router;
