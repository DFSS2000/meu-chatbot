const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Inicializa o cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // Roda em modo headless para o Railway
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Gera o QR code para autenticação
client.on('qr', (qr) => {
    console.log('Escaneie o QR code com o WhatsApp Business:');
    qrcode.generate(qr, { small: true });
});

// Quando o cliente estiver pronto
client.on('ready', () => {
    console.log('Bot conectado com sucesso!');
});

// Lógica para responder mensagens
client.on('message', async (message) => {
    const texto = message.body.toLowerCase();
    if (texto === 'oi') {
        message.reply('Olá! Bem-vindo ao meu chatbot. Como posso ajudar?');
    } else if (texto === 'suporte') {
        message.reply('Para suporte, envie um e-mail para suporte@exemplo.com');
    } else if (texto === 'info') {
        message.reply('Sou um bot criado para ajudar! Digite "oi", "suporte" ou "info".');
    } else {
        message.reply('Desculpe, não entendi. Tente "oi", "suporte" ou "info".');
    }
});

// Tratamento de erros
client.on('disconnected', (reason) => {
    console.log('Bot desconectado:', reason);
    client.initialize(); // Tenta reconectar
});

// Inicializa o cliente
client.initialize();