const express = require('express');
const router = express.Router();
const db = require('../services/db');

// Rota de Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = db.readUsers();
    
    // Assumindo que o "username" é o clientId (prefixo do email)
    const user = users[username];
    
    if (user && user.password === password) {
        // Autenticação bem-sucedida
        // Em um sistema real, a senha seria hasheada e o token JWT seria retornado.
        // Por simplicidade, retornamos o clientId.
        return res.json({ success: true, clientId: user.clientId });
    }
    
    res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
});

// Rota de Cadastro (simples, apenas para criar o registro inicial)
router.post('/register', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios.' });
    }
    
    const clientId = email.split('@')[0];
    const users = db.readUsers();
    
    if (users[clientId]) {
        return res.status(409).json({ success: false, message: 'Usuário já cadastrado.' });
    }
    
    // Cria o registro inicial do usuário (sem assinatura ativa)
    users[clientId] = {
        email: email,
        password: password, // Em um sistema real, hash da senha
        clientId: clientId,
        stripe: {
            status: 'pending',
            plan: 'none'
        }
    };
    
    db.writeUsers(users);
    
    // Cria o diretório de banco de dados para o novo cliente
    db.ensureClientDir(clientId);
    
    res.json({ success: true, message: 'Cadastro realizado com sucesso. Prossiga para a assinatura.' });
});

module.exports = router;
