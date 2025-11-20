let wss = null;

const logger = {
    log: (message) => {
        console.log(`[INFO] ${message}`);
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({ type: 'log', level: 'INFO', message: message }));
                }
            });
        }
    },
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error);
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({ type: 'log', level: 'ERROR', message: `${message}: ${error.message || error}` }));
                }
            });
        }
    },
    warn: (message) => {
        console.warn(`[WARN] ${message}`);
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({ type: 'log', level: 'WARN', message: message }));
                }
            });
        }
    }
};

function setWss(newWss) {
    wss = newWss;
}

module.exports = {
    logger,
    setWss
};
