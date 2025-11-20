const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'db');

// Função para garantir que o diretório do cliente exista
function ensureClientDir(clientId) {
    const clientDir = path.join(BASE_DIR, clientId);
    if (!fs.existsSync(clientDir)) {
        fs.mkdirSync(clientDir, { recursive: true });
    }
    return clientDir;
}

// Função para obter o caminho do arquivo de dados de um cliente
function getClientFilePath(clientId, filename) {
    const clientDir = ensureClientDir(clientId);
    return path.join(clientDir, filename);
}

// Função para ler dados de um cliente
function readClientData(clientId, filename, defaultValue = {}) {
    const filePath = getClientFilePath(clientId, filename);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return defaultValue;
        }
        console.error(`Erro ao ler dados do cliente ${clientId} no arquivo ${filename}:`, error);
        return defaultValue;
    }
}

// Função para escrever dados de um cliente
function writeClientData(clientId, filename, data) {
    const filePath = getClientFilePath(clientId, filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Erro ao escrever dados do cliente ${clientId} no arquivo ${filename}:`, error);
        return false;
    }
}

// --- Funções Específicas do Projeto ---

// Simulação de gerenciamento de usuários (global)
const USERS_FILE = path.join(BASE_DIR, 'users.json');

function readUsers() {
    try {
        if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
        if (!fs.existsSync(USERS_FILE)) return {};
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Erro ao escrever dados de usuários:', error);
        return false;
    }
}

// Gerenciamento de dispositivos (por cliente)
function getDevices(clientId) {
    const devices = readClientData(clientId, 'devices.json', { sessions: [] });
    return devices.sessions;
}

function saveDevice(clientId, sessionId) {
    const devices = readClientData(clientId, 'devices.json', { sessions: [] });
    if (!devices.sessions.includes(sessionId)) {
        devices.sessions.push(sessionId);
        writeClientData(clientId, 'devices.json', devices);
    }
}

function deleteDevice(clientId, sessionId) {
    const devices = readClientData(clientId, 'devices.json', { sessions: [] });
    devices.sessions = devices.sessions.filter(id => id !== sessionId);
    writeClientData(clientId, 'devices.json', devices);
}

// Gerenciamento de lógicas (por cliente)
function getLogicsPath(clientId) {
    return path.join(ensureClientDir(clientId), 'logics');
}

function ensureLogicsDir(clientId) {
    const logicsDir = getLogicsPath(clientId);
    if (!fs.existsSync(logicsDir)) {
        fs.mkdirSync(logicsDir, { recursive: true });
    }
    return logicsDir;
}

function getLogicFilePath(clientId, filename) {
    return path.join(ensureLogicsDir(clientId), filename);
}

function getLogics(clientId) {
    const logicsDir = getLogicsPath(clientId);
    if (!fs.existsSync(logicsDir)) return [];
    return fs.readdirSync(logicsDir);
}

module.exports = {
    ensureClientDir,
    readClientData,
    writeClientData,
    readUsers,
    writeUsers,
    getDevices,
    saveDevice,
    deleteDevice,
    getLogicsPath,
    getLogicFilePath,
    getLogics
};
