const express = require('express');
const fs = require('fs');
const router = express.Router();
const db = require('../services/db');
const { GoogleGenAI } = require('@google/generative-ai');

// Inicializa o cliente Gemini
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Rota para listar os arquivos de lógica de um cliente
router.get('/', (req, res) => {
    const clientId = req.clientId;
    try {
        const files = db.getLogics(clientId);
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar arquivos de lógica.' });
    }
});

// Rota para salvar um arquivo de lógica (TXT ou JSON)
router.post('/save', (req, res) => {
    const clientId = req.clientId;
    const { fileName, content } = req.body;
    
    if (!fileName || !content) {
        return res.status(400).json({ error: 'Nome do arquivo e conteúdo são obrigatórios.' });
    }
    
    try {
        const filePath = db.getLogicFilePath(clientId, fileName);
        fs.writeFileSync(filePath, content, 'utf8');
        res.json({ success: true, message: `Lógica ${fileName} salva com sucesso.` });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar arquivo de lógica.' });
    }
});

// Rota para deletar um arquivo de lógica
router.delete('/:fileName', (req, res) => {
    const clientId = req.clientId;
    const { fileName } = req.params;
    
    try {
        const filePath = db.getLogicFilePath(clientId, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
            return res.status(404).json({ error: 'Arquivo de lógica não encontrado.' });
        }
        res.json({ success: true, message: `Lógica ${fileName} deletada com sucesso.` });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar arquivo de lógica.' });
    }
});

// Rota para gerar lógica usando Gemini AI
router.post('/generate', async (req, res) => {
    const { description } = req.body;
    
    if (!description) {
        return res.status(400).json({ error: 'A descrição da lógica é obrigatória.' });
    }
    
    const prompt = `Você é um gerador de lógica de chatbot. Com base na seguinte descrição, gere dois arquivos:
1. Um arquivo JSON de lógica de fluxo de conversação (ex: flow.json).
2. Um arquivo TXT de base de conhecimento (ex: knowledge.txt).

Descrição: "${description}"

Formato de Saída:
JSON: [Aqui vai o JSON de fluxo de conversação]
TXT: [Aqui vai o texto da base de conhecimento]

Certifique-se de que o JSON seja válido e o TXT seja claro.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const text = response.text.trim();
        
        // Extrair JSON e TXT da resposta
        const jsonMatch = text.match(/JSON:\s*(\[[\s\S]*\])/i);
        const txtMatch = text.match(/TXT:\s*([\s\S]*)/i);
        
        const jsonContent = jsonMatch ? jsonMatch[1].trim() : 'Não foi possível gerar o JSON.';
        const txtContent = txtMatch ? txtMatch[1].trim() : 'Não foi possível gerar o TXT.';
        
        res.json({ 
            success: true, 
            json: jsonContent, 
            txt: txtContent,
            message: 'Lógicas geradas com sucesso. Revise e salve.'
        });
        
    } catch (error) {
        console.error('Erro ao gerar lógica com Gemini:', error);
        res.status(500).json({ error: 'Falha na geração de lógica pela IA.' });
    }
});

module.exports = router;
