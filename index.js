const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');

var config;

function verifyConfig() {
    if (!fs.existsSync('config.json')) {
        
        fs.writeFileSync('config.json', JSON.stringify(
            { 
                ra: "", 
                senha: "",
                chatId: ""
            }));
        
        console.log("Arquivo de config não encontrado. Criando...");
        return false;
    }

    config = JSON.parse(fs.readFileSync('config.json'));
    if (config.ra == "" || config.senha == "" || config.chatId == "") {
        console.log("Arquivo de config não está preenchido.");
        return false;
    }

    return true;
}

function runClient() {
    const client = new Client({
        authStrategy: new LocalAuth()
    });

    client.on('qr', qr => {
        qrcode.generate(qr, {small: true});
    });
    
    client.on('ready', async () => {
        console.log('Cliente Iniciado');
        /*
            Comandos para conseguir
            let chats = await client.getChats().filter(chat => {
                return chat.name == "NOME DO GRUPO (RECOMENDO SER ÚNICO)" && chat.isGroup;
            })[0];
            console.log("Chats: ")
        */
         
        await client.sendMessage(config.chatId, "Teste");
        console.log("Mensagem enviada!");
        client.destroy();
    });

    client.initialize();
}

function main() {
    if (!verifyConfig()) return;

    runClient();
}

main();





/* 
    Boa Noite.
    As Atividades dos próximos 3 dias são:
        -**• Atividade**: Design de Interação - Desk Research (**05/04 00:00**)
        -**• Atividade**: Design de Interação - Pesquisa de Usabilidade (**06/04 00:00**)
        -**• Atividade**: Design de Interação - Prototipação (**06/04 00:00**)
        -**• Atividade**: Design de Interação - Teste de Usabilidade (**06/04 00:00**)
        -**• Atividade**: Design de Interação - Entrevista (**06/04 00:00**)
    

*/
