const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const MoodleController = require('./src/moodleController');

var config;

function verifyConfig() {
    if (!fs.existsSync('config.json')) {

        fs.writeFileSync('config.json', JSON.stringify(
            {
                ra: "RA",
                password: "Senha",
                chatName: "Nome do Grupo"
            }));

        console.log("Arquivo de config não encontrado. Criando...");
        return false;
    }

    config = JSON.parse(fs.readFileSync('config.json'));

    return true;
}

function runClient() {
    const client = new Client({
        puppeteer: {
            headless: false, // false - Visible | true - Invisible
            args: ['--no-sandbox']
        },
        authStrategy: new LocalAuth()
    });

    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', async () => {
        console.log('Cliente Iniciado');

        const moodleController = new MoodleController(config.ra, config.password);

        console.log("Iniciando Moodle...")
        let lessons = await moodleController.main();

        let msg = createMsg(lessons);

        // Check if chat exists
        let chats = await client.getChats();
        chats = chats.filter(chat => { return chat.name == config.chatName && chat.isGroup; });
        if (chats.length == 1) {
            await client.sendMessage(chats[0].id._serialized, msg);
            console.log("Mensagem enviada!");
        } else {
            console.log("Chat não encontrado!");
        }

        console.log("Finalizando cliente em 5 segundos...");
        setTimeout(() => client.destroy(), 5000);

    });

    client.initialize();
    console.log("Iniciando cliente...");
}

function createMsg(lessons) {
    let msg = "Boa Noite.";

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

            msg += `${jumpMsg}      • ${lesson.title}: *${lesson.date}*`;;

        });
    }

    return msg;
}

async function runWithoutWpp() {
    const moodleController = new MoodleController(config.ra, config.password);
    let licoes = await moodleController.main();
    console.log(licoes);
}

function main() {
    if (!verifyConfig()) return;

    runClient();
    //runWithoutWpp();
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
