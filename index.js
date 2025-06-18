const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '/app/data' }), // Caminho do volume para persistência no Railway
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: null // Desativa download automático do Chromium
    }
});

// Controle dos atendimentos
const contatosStatus = {}; // { chatId: 'aguardando_resposta' | 'menu_enviado' | 'finalizado' }

client.on('qr', (qr) => {
    console.log('✅ Escaneie o QR code com o WhatsApp Business:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🤖 Bot conectado com sucesso!');
});

async function handleMessage(message) {
    const chatId = message.from;

    // 🚫 Ignorar grupos
    if (chatId.endsWith('@g.us')) {
        console.log(`📛 Mensagem de grupo ignorada (${chatId})`);
        return;
    }

    const texto = message.body.trim().toLowerCase();

    const mensagemBoasVindas = `Olá! 🙌
Muito obrigado pelo seu contato. ✨
No momento, posso estar em atendimento ou registrando alguma história especial. Assim que possível, retorno sua mensagem com todo carinho e atenção.

Aguarde só um pouquinho… já volto pra gente conversar! 💛

Enquanto isso, você pode me seguir no Instagram: @dej_imagens
📍Atendo Figueirópolis e região

Para adiantarmos o atendimento, digite a opção desejada:
1️⃣ Orçamento
2️⃣ Informações gerais
3️⃣ Falar com um atendente`;

    const respostasMenu = {
        '1': 'Você escolheu *Orçamento*. Por favor, envie os detalhes do serviço que deseja, local e data.',
        '2': `Você escolheu *Informações gerais*.\n\nA D&J Imagens é uma empresa especializada em fotos e vídeos que transformam momentos em memórias inesquecíveis.\n\nCom um olhar criativo e sensível, registramos eventos, paisagens, projetos e histórias com qualidade, paixão e autenticidade.\n\nNosour compromisso é capturar não apenas imagens, mas emoções, sempre com profissionalismo, dedicação e foco na satisfação de nossos clientes. 📸🎬\n\nO que deseja saber?`,
        '3': 'Perfeito! 🧑‍💼 Um atendente irá responder sua mensagem em breve. Por favor, aguarde. 🙌'
    };

    const status = contatosStatus[chatId] || 'aguardando_resposta';

    if (status === 'aguardando_resposta') {
        await message.reply(mensagemBoasVindas);
        contatosStatus[chatId] = 'menu_enviado';
        console.log(`🤖 Boas-vindas enviada para ${chatId}`);
        return;
    }

    if (status === 'menu_enviado') {
        if (respostasMenu[texto]) {
            await message.reply(respostasMenu[texto]);
            contatosStatus[chatId] = 'finalizado';
            console.log(`🚫 Atendimento automático finalizado para ${chatId}`);
        } else {
            await message.reply(`Desculpe, não entendi sua opção. Digite:\n1️⃣ Orçamento\n2️⃣ Informações gerais\n3️⃣ Falar com um atendente`);
            console.log(`❌ Opção inválida recebida de ${chatId}`);
        }
        return;
    }

    if (status === 'finalizado') {
        console.log(`💬 Mensagem recebida de ${chatId} (atendimento manual ativo).`);
        return;
    }
}

// 🔥 Escuta mensagens recebidas (clientes)
client.on('message', handleMessage);

// 🔥 Escuta mensagens enviadas por você (comandos manuais)
client.on('message_create', async (msg) => {
    if (msg.fromMe) {
        const chatId = msg.to;
        const texto = msg.body.trim().toLowerCase();

        if (texto === 'reativar') {
            contatosStatus[chatId] = undefined;
            await msg.reply('✅ Atendimento automático reativado para este contato.');
            console.log(`🔄 Atendimento automático reativado manualmente para ${chatId}`);
        }

        if (texto === 'reativartodos') {
            for (const contato in contatosStatus) {
                contatosStatus[contato] = undefined;
            }
            await msg.reply('✅ Todos os atendimentos automáticos foram reativados.');
            console.log('🔄 Todos os atendimentos foram resetados manualmente.');
        }
    }
});

client.on('disconnected', (reason) => {
    console.warn('⚠️ Bot desconectado:', reason);
    console.log('Tentando reconectar...');
    client.initialize();
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação, escaneie o QR novamente:', msg);
});

client.on('error', (error) => {
    console.error('❌ Erro no cliente WhatsApp:', error);
});

client.initialize();

// Servidor para keep-alive
app.get('/ping', (req, res) => res.send('Bot ativo!'));
app.listen(process.env.PORT || 3000, () => console.log('Servidor rodando na porta 3000'));