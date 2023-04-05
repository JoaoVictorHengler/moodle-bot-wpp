const puppeteer = require('puppeteer');

class MoodleController {
    constructor(ra, senha) {
        this.licoes = [];
        this.ra = ra;
        this.senha = senha;
    }

    async getLogin() {
        if (this.ra != "" || this.senha != "") {
            /*
                console.log("Informações de login:");
                console.log(`RA: ${this.ra}`);
                console.log(`Senha: ${this.senha}`);
            */
            
            await this.connect();
            console.log("Login carregado com sucesso!");
            return;
            
        }

        console.log("Informações de login não encontradas. Favor verificar.");
    }

    async connect() {
        // Conectar no moodle
        const browser = await puppeteer.launch(
            {
                headless: false, //false - Visivel | true - Invisivel
            }
        );
        const home = await browser.newPage();
        await home.goto("https://moodle.sptech.school/login/index.php");

        await home.type("#username", this.ra);
        await home.type("#password", this.senha);
        await home.click("#loginbtn");
        
        await home.close();

        const painel = await browser.newPage();
        await painel.goto("https://moodle.sptech.school/my/");
        await painel.click(".btnFechar");
        const licoes = await painel.$$eval(".card-text content calendarwrapper", (elLicoes) => {
            let licoes = elLicoes.map((elLicao) => {
                return {
                    titulo: elLicao.querySelector("a").innerHTML,
                    data: elLicao.querySelector(".date > a").innerHTML,
                    hora: elLicao.querySelector(".date").innerText.split(">")[1].trim()
                }
            });

            elLicoes.forEach(async (elLicao, i) => {
                elLicao.querySelector(".date > a").click();
                await painel.waitFor(1000);

                licoes[i].materia = await painel.$$eval(".summary-modal-container", (elHandles) => {
                    return elHandles[0].querySelector(".row mt-1:nth-child(4) > .col-11 > a").innerHTML;
                });

                await painel.click(".btnFechar");
            });

            return licoes;
        });
        console.log(licoes);

        await browser.close();
    }

    getLicoes() {
        /* 
            {
                titulo: "Design de Interação - Desk Research";
                data: "05/04/2022"
            }
        */
    }

    mapHtmlToJson() {
        // Mapear as lições do html para o json
    }
}

var moodleController = new MoodleController("", "");
moodleController.getLogin();
