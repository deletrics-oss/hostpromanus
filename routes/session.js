const express = require('express');
const router = express.Router();
const whatsappManager = require('../services/whatsappManager');
const db = require('../services/db');

// Rota para listar todas as sessões ativas do cliente
router.get('/', (req, res) => {
    // Em um sistema multi-tenant real, isso filtraria por req.clientId
    const sessions = Object.keys(whatsappManager.clients).map(id => ({
        id: id,
        status: whatsappManager.clients[id].info ? 'READY' : 'INITIALIZING' // Simplificado
    }));
    res.json(sessions);
});

// Rota para criar uma nova sessão
router.post('/', (req, res) => {
    const { sessionId } = req.body;
    const clientId = req.clientId || 'admin'; // Usando 'admin' temporariamente
    
    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID é obrigatório.' });
    }
    
    // Verificar se o cliente tem assinatura ativa (lógica a ser implementada)
    // if (!stripeManager.isSubscriptionActive(clientId)) {
    //     return res.status(403).json({ error: 'Assinatura inativa. Não é possível criar novas sessões.' });
    // }
    
    whatsappManager.createSession(sessionId, clientId);
    res.json({ success: true, message: `Sessão ${sessionId} iniciada.` });
});

// Rota para deletar uma sessão
router.delete('/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const clientId = req.clientId || 'admin';
    
    await whatsappManager.destroySession(sessionId, clientId);
    res.json({ success: true, message: `Sessão ${sessionId} destruída.` });
});

// Rota para reiniciar uma sessão
router.post('/:sessionId/restart', (req, res) => {
    const { sessionId } = req.params;
    const clientId = req.clientId || 'admin';
    
    // Destrói e recria
    whatsappManager.destroySession(sessionId, clientId).then(() => {
        whatsappManager.createSession(sessionId, clientId);
        res.json({ success: true, message: `Sessão ${sessionId} reiniciada.` });
    });
});

// Rota para enviar mensagem
router.post('/:sessionId/send', async (req, res) => {
    const { sessionId } = req.params;
    const { number, text } = req.body;
    
    if (!number || !text) {
        return res.status(400).json({ error: 'Número e texto são obrigatórios.' });
    }
    
    try {
        const success = await whatsappManager.sendMessage(sessionId, number, text);
        if (success) {
            res.json({ success: true, message: 'Mensagem enviada.' });
        } else {
            res.status(500).json({ success: false, message: 'Falha ao enviar mensagem. Cliente não está pronto.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para obter o QR Code (temporário, será ajustado)
router.get('/:sessionId/qr', (req, res) => {
    // Esta rota é temporária. O QR Code deve ser enviado via WebSocket.
    // No entanto, o frontend espera uma URL de QR Code.
    // Por enquanto, retornaremos um erro 404 ou uma URL fictícia.
    res.status(404).json({ error: 'QR Code deve ser obtido via WebSocket.' });
});

module.exports = router;
