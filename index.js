const pup = require('puppeteer');
const fs = require('fs');
const url = "https://www.mercadolivre.com.br/";
const searchFor = "pc ryzen 4600g";
const list = [];
let c = 0;

(async () => {
    const navegador = await pup.launch({ headless: true });
    const pagina = await navegador.newPage();
    
    await pagina.goto(url);
    
    await pagina.waitForSelector('#cb1-edit');
    await pagina.type('#cb1-edit', searchFor);
    await Promise.all([
        pagina.waitForNavigation(),
        pagina.click('.nav-search-btn'),
    ]);

    await pagina.waitForSelector('.poly-box > a'); 
    const links = await pagina.$$eval('.poly-box > a', elements => elements.map(link => link.href));

    for (const link of links) {
        if (c >= 20) break;
        console.log('Produto '+ (c+1) + ":");
        await pagina.goto(link);
        try {
            await pagina.waitForSelector('.ui-pdp-header__title-container > .ui-pdp-title');
            await pagina.waitForSelector('.andes-money-amount__fraction');

            const titulo = await pagina.$eval('.ui-pdp-header__title-container > .ui-pdp-title', el => el.innerText.trim());
            const preço = await pagina.$eval('.andes-money-amount__fraction', el => el.innerText.trim());

            const vendedor = await pagina.evaluate(() => {
                const el = document.querySelector('.ui-pdp-seller__header__title');
                return el ? el.innerText.trim() : null;
            });

            list.push({
                title: titulo,
                price: preço,
                seller: vendedor || 'Não especificado',
                link: link,
            });
        } catch (err) {
            console.error(`Erro ao processar o link ${link}`);
        }
        c++;
    }
    console.log('\n\nJogando tudo para o arquivo PCmercadolivre.txt...');
    fs.appendFile('PCmercadolivre.txt', JSON.stringify(list, null, 2), (err) => {
        if (err) {
            console.error('Erro ao adicionar conteúdo:', err);
        } else {
            console.log('\nConteúdo adicionado com sucesso!');
        }
    });    
    await navegador.close();
})();
