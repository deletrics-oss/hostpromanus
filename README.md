# ChatBot Host v2.5 - Multi-Tenant com Stripe e Gemini IA

Este projeto é um dashboard de gerenciamento de bots WhatsApp multi-tenant, com integração de pagamentos via Stripe e um criador de lógica de conversação baseado em Gemini IA.

## Configuração Inicial

1.  **Instalar Dependências:**
    \`\`\`bash
    npm install
    \`\`\`

2.  **Configurar Variáveis de Ambiente:**
    Edite o arquivo `.env` com suas chaves de API e configurações.

    \`\`\`env
    PORT=3035
    BASE_URL=http://72.60.246.250:3035

    # Chaves Stripe (Substitua pelos seus valores reais)
    STRIPE_PUBLIC_KEY=pk_test_...
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...

    # Chave Gemini (Substitua pela sua chave real)
    GEMINI_API_KEY=AIzaSyA-C6gzGd1Ypyeni7LQfFOgOBJrTdWW5Kg
    \`\`\`

3.  **Iniciar o Servidor:**
    \`\`\`bash
    npm start
    \`\`\`

O dashboard estará acessível em `http://72.60.246.250:3035`.

## Credenciais de Acesso

*   **Usuário Padrão (Admin):** `admin`
*   **Senha Padrão (Admin):** `suporte@1`

**Nota:** O sistema agora suporta **Novo Cadastro** na tela de login, criando um novo cliente multi-tenant.

## Testando as Lógicas de Conhecimento (JSON e TXT)

O sistema foi projetado para que o cliente possa criar suas próprias lógicas usando o **Criador de Lógica IA (Gemini)**.

### 1. Criação da Lógica

1.  Acesse o dashboard e navegue para **Criador de Lógica IA (Gemini)**.
2.  Descreva o seu negócio ou a lógica de conversação desejada (ex: "Quero um bot para minha pizzaria que responda o cardápio e o horário de funcionamento").
3.  Clique em **Gerar Lógica**. O Gemini irá gerar um arquivo JSON (para fluxo de conversação) e um arquivo TXT (para base de conhecimento).
4.  Revise os conteúdos gerados e salve-os com nomes de arquivo apropriados (ex: `flow.json`, `cardapio.txt`).

### 2. Como o Usuário Testa

A lógica de processamento de mensagens no `whatsappManager.js` (atualmente simplificada) deve ser expandida para:

1.  **Carregar Lógicas:** Ao receber uma mensagem, o bot deve carregar os arquivos de lógica (`.json` e `.txt`) salvos no diretório do cliente (`db/[clientId]/logics/`).
2.  **Processar Fluxo (JSON):**
    *   O bot deve primeiro tentar seguir o fluxo de conversação definido no arquivo JSON.
    *   Exemplo: Se o JSON define que a palavra "Cardápio" leva a uma resposta específica, o bot deve seguir essa regra.
3.  **Consultar Conhecimento (TXT):**
    *   Se a mensagem não se encaixar em um fluxo JSON, o bot deve usar o conteúdo do arquivo TXT como **Base de Conhecimento** para responder perguntas mais abertas.
    *   **Exemplo de Teste:** O usuário envia "Qual o horário de funcionamento?" e o bot consulta o `cardapio.txt` para responder.

**Para testar a lógica:**

1.  Crie e salve seus arquivos de lógica no dashboard.
2.  Inicie um dispositivo WhatsApp no dashboard.
3.  Envie mensagens para o número conectado ao bot, testando tanto as palavras-chave do fluxo JSON quanto as perguntas abertas que dependem do conteúdo TXT.

## Integração Stripe

O sistema está configurado para iniciar o checkout do Stripe.

*   **Tela de Assinatura:** Use a seção **Assinatura (Stripe)** no dashboard.
*   **IDs de Produto:** Os IDs fornecidos (`prod_TSBFAZOMsCNIAT` e `prod_TSBFZleC61Rm5y`) devem ser configurados no seu dashboard Stripe para gerar os `price_id` reais que devem ser usados no frontend (`index.html`).
*   **Webhooks:** Configure o webhook do Stripe para a URL `BASE_URL/api/stripe/webhook` para que o sistema possa ativar as contas após o pagamento.

## Próximos Passos (Desenvolvimento)

Para que o sistema funcione completamente, a lógica de processamento de mensagens no `whatsappManager.js` precisa ser implementada para ler e interpretar os arquivos de lógica gerados.

\`\`\`javascript
// Exemplo de como a lógica de processamento deve ser expandida em whatsappManager.js

client.on('message', async msg => {
    // 1. Obter as lógicas do cliente (JSON e TXT)
    const logics = db.getLogics(clientId); 
    
    // 2. Implementar o motor de fluxo (JSON)
    // ...
    
    // 3. Implementar a consulta de conhecimento (TXT)
    // ...
});
\`\`\`
