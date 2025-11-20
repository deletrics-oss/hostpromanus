# Instruções Finais e Guia de Teste

Parabéns! O projeto **ChatBot Host v2.5 - Multi-Tenant** foi atualizado e expandido para incluir as funcionalidades solicitadas:

1.  **Backend** em Node.js com Express, configurado para a porta **3035**.
2.  **Multi-tenancy** (novo banco de dados por cliente) com gerenciamento de usuários e autenticação.
3.  **Integração Stripe** para assinaturas, com rotas de checkout e webhook.
4.  **Frontend** (`index.html`) com telas de Login/Cadastro, Assinatura e o novo **Criador de Lógica IA (Gemini)**.
5.  **Gerenciamento de Bots** com conexão persistente e envio de QR Code via WebSocket.

## 1. Configuração do Ambiente

Antes de iniciar, você deve atualizar o arquivo `.env` com suas chaves reais:

| Variável | Descrição |
| :--- | :--- |
| `PORT` | **3035** (Já configurado) |
| `BASE_URL` | `http://72.60.246.250:3035` (Já configurado) |
| `GEMINI_API_KEY` | Sua chave de API do Gemini. |
| `STRIPE_PUBLIC_KEY` | Sua chave pública de teste/produção do Stripe. |
| `STRIPE_SECRET_KEY` | Sua chave secreta de teste/produção do Stripe. |
| `STRIPE_WEBHOOK_SECRET` | O segredo do webhook que você deve obter ao configurar o webhook no Stripe. |

**Importante:** Você deve configurar o webhook do Stripe para apontar para a URL `BASE_URL/api/stripe/webhook` para que o sistema possa receber notificações de pagamento e ativar as contas.

## 2. Guia de Teste para o Usuário

### A. Teste de Cadastro e Assinatura

1.  Acesse o dashboard em `http://72.60.246.250:3035`.
2.  Clique em **Novo Cadastro**.
3.  Preencha o email e senha e clique em **Cadastrar e Assinar**.
    *   **Resultado Esperado:** O sistema cria um novo registro de usuário e um novo diretório de banco de dados (`db/[prefixo_do_email]`).
4.  Faça login com o novo usuário.
5.  Navegue para **Assinatura (Stripe)**.
6.  Clique em um dos botões de assinatura.
    *   **Resultado Esperado:** Você será redirecionado para a página de checkout do Stripe.
7.  Após simular um pagamento bem-sucedido (usando o Stripe Test Mode), o webhook deve ser acionado, e o status da sua conta deve ser atualizado para **ativo**.

### B. Teste do Criador de Lógica IA (Gemini)

1.  Navegue para **Criador de Lógica IA (Gemini)**.
2.  No campo de descrição, insira uma descrição detalhada da lógica (ex: "Quero um bot que responda 'Olá! Como posso ajudar?' para qualquer mensagem e que saiba o endereço da minha loja, que é Rua Exemplo, 123.").
3.  Clique em **Gerar Lógica**.
    *   **Resultado Esperado:** A IA gera um JSON de fluxo e um TXT de base de conhecimento.
4.  Salve os arquivos (ex: `flow.json` e `base.txt`).
    *   **Resultado Esperado:** Os arquivos são salvos no diretório do seu cliente (`db/[prefixo_do_email]/logics/`).

### C. Teste de Conexão do Bot (QR Code e Persistência)

1.  Navegue para **Dashboard**.
2.  Adicione um novo dispositivo (ex: `vendas`).
3.  Selecione o dispositivo na lista.
    *   **Resultado Esperado:** O status muda para `QR_PENDING` e o QR Code aparece na tela (enviado via WebSocket).
4.  Escaneie o QR Code com o WhatsApp.
    *   **Resultado Esperado:** O status muda para `READY` e a mensagem "✅ Conectado" aparece.
5.  **Teste de Persistência:** Reinicie o servidor Node.js.
    *   **Resultado Esperado:** O bot deve se reconectar automaticamente sem pedir um novo QR Code.

## 3. Upload para o GitHub

O projeto foi inicializado com Git. Você pode fazer o upload para o seu repositório:

1.  **Definir o Repositório Remoto:**
    \`\`\`bash
    # Substitua <URL_DO_SEU_REPOSITORIO> pelo link do seu GitHub
    git remote add origin <URL_DO_SEU_REPOSITORIO>
    \`\`\`

2.  **Fazer o Push:**
    \`\`\`bash
    git push -u origin master
    \`\`\`

**Arquivos Incluídos no Commit:**

*   `index.js` (Atualizado para porta 3035 e multi-tenant)
*   `index.html` (Novo frontend com Stripe, Cadastro e Gemini IA)
*   `package.json`, `package-lock.json` (Com Stripe e Gemini)
*   `routes/api.js`, `routes/auth.js`, `routes/logic.js`, `routes/session.js`, `routes/stripe.js` (Novas rotas)
*   `services/db.js`, `services/logger.js`, `services/stripeManager.js`, `services/whatsappManager.js` (Nova arquitetura)
*   `README.md`, `INSTRUCOES_FINAIS.md`

**Arquivos Excluídos do Commit (via .gitignore):**

*   `.env` (Contém chaves sensíveis)
*   `node_modules`
*   `db/` (Contém dados de clientes)
*   `server.log` (Log de execução)

**Observação:** A lógica de **processamento de mensagens** no `whatsappManager.js` para **interpretar** os arquivos JSON/TXT gerados pelo Gemini **não foi implementada**. Isso é um motor de regras complexo que deve ser desenvolvido separadamente, mas a estrutura para carregar e gerenciar esses arquivos está pronta.
