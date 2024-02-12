const puppeteer = require('puppeteer');

class MoodleController {
    constructor(ra, passwd) {
        this.browser = null;
        this.lessons = [];
        this.ra = ra;
        this.password = passwd;
        this.connected = false;
        this.gotLessons = false;
    }

    async main() {
        await this.connect();
        await this.getLessons();

        return this.lessons;
    }


    async connect() {
        // Connect to Moodle
        try {
            this.browser = await puppeteer.launch(
                {
                    headless: true, //false - Visible | true - Invisible
                }
            );
            const page = await this.browser.newPage();
            await page.goto("https://moodle.sptech.school/login/index.php");

            await page.type("#username", this.ra);
            await page.type("#password", this.password);
            await page.click("#loginbtn");


            let element = await page.waitForSelector(".user-firstname");
            if (element == null) {
                console.log("Erro ao conectar ao Moodle.");
                return;
            }

            await page.close();

            this.connected = true;
            console.log("Conectado com sucesso!");
        } catch (e) {
            console.log("Erro ao conectar ao Moodle.");
            return;
        }
    }

    async getLessons() {
        if (!this.connected) return;
        try {
            console.log("Iniciando página de lições do moodle...");
            const page = await this.browser.newPage();
            await page.goto("https://moodle.sptech.school/calendar/view.php?view=upcoming");

            console.log("Buscando próximas lições...");
            this.lessons = await page.$$eval(".eventlist.my-1 > div", async (elLessons) => {
                function transformTxt(title) {
                    let restrictions = [
                        "Atividade - ",
                        " está marcado(a) para esta data",
                        "´"
                    ];

                    restrictions.forEach((restriction) => {
                        title = title.replace(restriction, "");
                    });

                    if (title.includes("Término de OpenLab - Produtividade - ")) {
                        title = title.replace("Término de OpenLab - Produtividade - ", "OpenLab - ");
                    }

                    let txtSeparado = title.split('-');
                    let novoTextoSeparado = []
                    if (txtSeparado.length > 1) {
                        txtSeparado.forEach((txt, i) => {
                            let txt2 = txt.toLowerCase()
                            if (!(txt2.includes("open lab") |
                                txt2.includes("entrega") |
                                txt2.includes("entrega") |
                                txt2.includes("prova") |
                                txt2.includes("aula"))) {
                                    novoTextoSeparado.push(txt)
                            }
                        })
                    } else {
                        novoTextoSeparado.push(txtSeparado[0])
                    }

                    title = novoTextoSeparado.join(' - ').replaceAll("  ", " ");

                    if (title === title.toUpperCase()) {
                        title = title.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                    }

                    return title.trim();
                }

                function transformDate(date, hour) {
                    let restrictions = [
                        "Monday, ",
                        "Tuesday, ",
                        "Wednesday, ",
                        "Thursday, ",
                        "Friday, ",
                        "Saturday, ",
                        "Sunday, ",
                    ];

                    let monthsEnglish = [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December"
                    ];

                    let monthsPortuguese = [
                        "Janeiro",
                        "Fevereiro",
                        "Março",
                        "Abril",
                        "Maio",
                        "Junho",
                        "Julho",
                        "Agosto",
                        "Setembro",
                        "Outubro",
                        "Novembro",
                        "Dezembro"
                    ];

                    if (date.includes("Hoje")) {
                        let realDate = new Date();
                        realDate.setHours(hour.split(":")[0], hour.split(":")[1], 0, 0);
                        let now = new Date()
                        let difference = differenceBetweenTimes(now, realDate)
                        
                        if (difference.includes("-")) return `Era para ser entregue há ${difference.replace("-", "")}`;
                        else return `Daqui ${difference}`;

                    } else if (date.includes("Amanhã")) return "Amanhã às " + hour;
                    else {
                        restrictions.forEach((restriction) => {
                            date = date.replace(restriction, "").trim();
                        });

                        monthsEnglish.forEach((month, i) => {
                            date = date.replace(month, `de ${monthsPortuguese[i]}`).trim();
                        });
                        return date + " às " + hour;
                    }
                }

                function differenceBetweenTimes(date1, date2) {
                    var msec = date2.getTime() - date1.getTime();
                    var hh = Math.floor(msec / 1000 / 60 / 60);
                    msec -= hh * 1000 * 60 * 60;
                    var mm = Math.floor(msec / 1000 / 60);
                    msec -= mm * 1000 * 60;
                    var ss = Math.floor(msec / 1000);
                    msec -= ss * 1000;


                    if (hh < 10) hh = "0" + hh;
                    if (mm < 10) mm = "0" + mm;
                    if (ss < 10) ss = "0" + ss;

                    return `${hh}:${mm}:${ss}`;
                }

                return elLessons.map((elLesson) => {

                    let title = transformTxt(elLesson.querySelector("div > div > div:nth-child(3) > h3").innerHTML)
                    if (!title.includes("Feriado")) {
                        const description = elLesson.querySelector(".description.card-body");
                        let dateTimeElement = description.querySelector(".row:nth-child(1)");
                        let date = dateTimeElement.querySelector(".col-11 a").innerHTML;
                        let hour = dateTimeElement.querySelector(".col-11").innerHTML.split(">,")[1].replace("</span>", "").trim().replace("PM", "").replace("AM", "").trim();
                        let rows = description.querySelectorAll(".mt-1");

                        return {
                            title: title,
                            date: transformDate(date, hour),
                            course: rows[rows.length - 1].querySelector(".col-11 a").innerHTML.replace("3CCOA - ", "").replace("2024/1", "").replace("2024", "").trim()
                        };
                    }
                });
            });
            console.log("Lições carregadas com sucesso!");
            this.gotLessons = true;
            await page.close();
        } catch (e) {
            return;
        }
        
        await this.browser.close();
    }
}

module.exports = MoodleController;