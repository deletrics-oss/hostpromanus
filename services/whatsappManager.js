const { Client, LocalAuth } = require('whatsapp-web.js');
const { logger } = require('./logger');
const db = require('./db');

let wss = null;
const clients = {}; // Armazena as instâncias do Client

function setWss(newWss) {
    wss = newWss;
}

/**
 * Envia uma atualização de status para o cliente via WebSocket.
 * @param {string} sessionId - ID da sessão.
 * @param {string} status - Status da sessão (QR_PENDING, READY, etc.).
 */
function sendStatusUpdate(sessionId, status) {
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify({
                    type: 'status_update',
                    sessionId: sessionId,
                    status: status
                }));
            }
        });
    }
}

/**
 * Cria e inicializa uma nova sessão do WhatsApp.
 * @param {string} sessionId - ID da sessão (ex: 'vendas', 'suporte').
 * @param {string} clientId - ID do cliente (para multi-tenancy).
 */
function createSession(sessionId, clientId = 'admin') {
    if (clients[sessionId]) {
        logger.warn(`Sessão ${sessionId} já está em andamento.`);
        return;
    }

    // O LocalAuth usa o caminho do diretório para salvar os dados da sessão.
    // Usaremos o clientId para isolar os dados de sessão de cada cliente.
    const sessionPath = db.ensureClientDir(clientId);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId, dataPath: sessionPath }),
        puppeteer: {
            args: ['--no-sandbox'],
        }
    });

    clients[sessionId] = client;
    
    logger.log(`Iniciando sessão ${sessionId} para o cliente ${clientId}...`);
    sendStatusUpdate(sessionId, 'INITIALIZING');

    client.on('qr', (qr) => {
        logger.log(`QR Code recebido para ${sessionId}.`);
        // Converte o QR Code para URL de dados e envia via WebSocket
        require('qrcode').toDataURL(qr, (err, url) => {
            if (err) {
                logger.error(`Erro ao gerar QR Code para ${sessionId}:`, err);
                return;
            }
            if (wss) {
                wss.clients.forEach(client => {
                    if (client.readyState === client.OPEN) {
                        client.send(JSON.stringify({
                            type: 'qr_code',
                            sessionId: sessionId,
                            qrCodeUrl: url
                        }));
                    }
                });
            }
        });
        sendStatusUpdate(sessionId, 'QR_PENDING');
    });

    client.on('ready', () => {
        logger.log(`✅ Cliente ${sessionId} pronto!`);
        sendStatusUpdate(sessionId, 'READY');
        // Salva o dispositivo no banco de dados do cliente
        db.saveDevice(clientId, sessionId);
    });

    client.on('authenticated', () => {
        logger.log(`Autenticado com sucesso: ${sessionId}`);
        sendStatusUpdate(sessionId, 'AUTHENTICATED');
    });

    client.on('auth_failure', msg => {
        logger.error(`Falha na autenticação para ${sessionId}: ${msg}`);
        sendStatusUpdate(sessionId, 'AUTH_FAILURE');
    });

    client.on('disconnected', (reason) => {
        logger.warn(`Cliente ${sessionId} desconectado: ${reason}`);
        sendStatusUpdate(sessionId, 'DISCONNECTED');
        delete clients[sessionId];
        // O cliente deve ser reiniciado automaticamente se a razão for "autenticação falhou"
        if (reason === 'NAVIGATION' || reason === 'NO_AUTH') {
            // Tentativa de reconexão
            setTimeout(() => createSession(sessionId, clientId), 5000);
        }
    });

    client.on('message', async msg => {
        // Lógica de processamento de mensagens (IA, lógicas, etc.)
        // Será implementada em uma fase posterior.
        logger.log(`[${sessionId}] Mensagem de ${msg.from}: ${msg.body}`);
        // Enviar mensagem para o chat em tempo real no dashboard
        if (wss) {
            wss.clients.forEach(wsClient => {
                if (wsClient.readyState === wsClient.OPEN) {
                    wsClient.send(JSON.stringify({
                        type: 'new_message',
                        from: msg.from,
                        to: msg.to,
                        body: msg.body,
                        timestamp: Date.now()
                    }));
                }
            });
        }
    });

    client.initialize().catch(err => {
        logger.error(`Erro ao inicializar cliente ${sessionId}:`, err);
        sendStatusUpdate(sessionId, 'ERROR');
        delete clients[sessionId];
    });
}

/**
 * Destrói uma sessão do WhatsApp.
 * @param {string} sessionId - ID da sessão.
 * @param {string} clientId - ID do cliente.
 */
async function destroySession(sessionId, clientId = 'admin') {
    if (clients[sessionId]) {
        await clients[sessionId].destroy();
        delete clients[sessionId];
        db.deleteDevice(clientId, sessionId);
        logger.log(`Sessão ${sessionId} destruída.`);
        sendStatusUpdate(sessionId, 'DESTROYED');
    }
}

/**
 * Envia uma mensagem.
 * @param {string} sessionId - ID da sessão.
 * @param {string} number - Número de destino.
 * @param {string} text - Texto da mensagem.
 */
async function sendMessage(sessionId, number, text) {
    const client = clients[sessionId];
    if (client && client.info) {
        await client.sendMessage(number, text);
        logger.log(`Mensagem enviada por ${sessionId} para ${number}: ${text}`);
        return true;
    }
    return false;
}

module.exports = {
    setWss,
    createSession,
    destroySession,
    sendMessage,
    clients
};
