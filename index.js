const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const MoodleController = require('./src/moodleController');
const CONFIG_PATH = './config.json';

var config;

function main() {
    if (!verifyConfig()) return;

    runClient();
}

function verifyConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(
            {
                ra: "RA",
                password: "Senha",
                chatName: "Nome do Grupo",
                sendMsg: true
            }));

        console.log("Arquivo de config não encontrado. Criando...");
        return false;
    }

    config = JSON.parse(fs.readFileSync(CONFIG_PATH));

    return true;
}

function runClient() {
    if (config.sendMsg) {
        try {
            const client = new Client({
                puppeteer: {
                    headless: true, // false - Visible | true - Invisible
                    args: ['--no-sandbox']
                },
                authStrategy: new LocalAuth()
            });
            
            client.on('qr', qr => {
                qrcode.generate(qr, { small: true });
            });
        
            client.on('ready', async () => {
                console.log('Cliente Whatsapp Iniciado.');
                getNextLessons(client);
        
            });
        
            client.initialize();
            console.log("Iniciando cliente...");
        } catch(error) {
            console.log("Ocorreu um erro ao tentar iniciar o cliente: " + error)
        }
    
        
    } else {
        getNextLessons(null);
    }
    
}

async function getNextLessons(client) {
    const moodleController = new MoodleController(config.ra, config.password);

    console.log("Iniciando Requisição ao Moodle...")
    let lessons = await moodleController.main();

    if (!moodleController.connected) {
        if (config.sendMsg) await client.sendMessage(config.chatName, "Ocorreu um erro ao tentar conectar ao Moodle.");
    } else {
        console.log("Requisição finalizada!");
        if (!moodleController.gotLessons) {
            console.log("Ocorreu um erro ao tentar buscar as lições.");
            if (config.sendMsg) await client.sendMessage(config.chatName, "Ocorreu um erro ao tentar buscar as lições.");
        }
        else if (lessons.length == 0) {
            console.log("Nenhuma lição encontrada!");
            if (config.sendMsg) await client.sendMessage(config.chatName, "Nenhuma lição encontrada!");
        }
        else {
            let msg = createMsg(lessons);
            console.log("Mensagem: \n" + msg + "\n");
            if (config.sendMsg) await sendMsg(client, msg);
        }
        
    }
    
    if (config.sendMsg) {
        console.log("Finalizando cliente em 5 segundos...");
        setTimeout(() => client.destroy(), 5000);
    }
    
}

function createMsg(lessons) {
    let msg = "Próximas lições:";

    let lessonsGroup = {
    };
    
    lessons.forEach((lesson) => {
        if (lessonsGroup[lesson.course] == undefined) lessonsGroup[lesson.course] = [];

        lessonsGroup[lesson.course].push(lesson);
    });

    for (const course in lessonsGroup) {
        msg += `\n\n• _*${course}*_`;
        lessonsGroup[course].forEach((lesson, i) => {
            let jumpMsg = "\n\n";
            if (i == 0) jumpMsg = "\n";

            /* let appndMsg = `${jumpMsg}      • ${lesson.title}: ${lesson.date}`;

            if (lesson.date.includes("Daqui") || lesson.date.includes("Amanhã")) {
                appndMsg = `${jumpMsg}      • ${lesson.title}: *${lesson.date}*`;
            } */

            msg += `${jumpMsg}      • ${lesson.title}: \n      *${lesson.date}*`;;

        });
    }

    return msg;
}

async function sendMsg(client, msg) {
    try {
        let chats = await client.getChats();
        chats = chats.filter(chat => { return chat.name == config.chatName && chat.isGroup; });

        if (chats.length == 0) console.log("Grupo não encontrado!");
        else if (chats.length > 1) console.log("Mais de um grupo encontrado!");
        else if (chats.length == 1) {
            console.log("Grupo encontrado!");
            await client.sendMessage(chats[0].id._serialized, msg);
            console.log("Mensagem enviada!");
        }
    } catch (e) {
        client.sendMessage(config.chatName, "Ocorreu um erro ao tentar enviar a mensagem.");
    }
}

main();
