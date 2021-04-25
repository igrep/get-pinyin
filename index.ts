import * as puppeteer from 'puppeteer-core';
import * as readline from 'readline';

// The default value is decided by my experiment on my machine.
const defaultWait = 685;
let waitFor =
    process.argv[2] === '--wait' ? parseInt(process.argv[3], 10) : defaultWait;
if (!waitFor || isNaN(waitFor)) {
  console.error('[ERROR] Invalid number for --wait option.');
  process.exit(1);
}
console.log(`Configured the --wait option as ${waitFor} milliseconds.`);

const rl = readline.createInterface(
    {input : process.stdin, output : process.stdout, prompt : '中文> '});

(async () => {
  const browser = await puppeteer.launch({
    executablePath :
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless : false,
    defaultViewport : {height : 600, width : 1000},
  });
  const page = await browser.newPage();
  await page.goto('https://translate.google.com/?sl=zh-CN&tl=ja&op=translate');

  rl.prompt();
  rl.on('line', async line => {
      await go(line, page);
      rl.prompt();
    }).on('close', async () => {
    console.log('Bye!');
    await browser.close();
  });
})();

const go = async (line: string, page: puppeteer.Page) => {
  line = line.trim();
  const md = line.match(/^--wait\s+(.*)$/);
  if (md) {
    waitFor = parseInt(md[1], 10);
    if (!waitFor || isNaN(waitFor)) {
      console.error('[ERROR] Invalid number for waitForwait option.');
      return;
    }
    console.log(`Configured the --wait option as ${waitFor} milliseconds.`);
    return;
  }
  if (!line) {
    return;
  }
  const textarea = await page.$("[aria-label='原文']");
  await textarea.evaluate(node => node.value = '');
  await textarea.type(line, {delay : 20});

  const pinyinElement = await page.$('.kO6q6e');
  await pinyinElement!.focus();
  await new Promise(resolve => setTimeout(resolve, waitFor));
  const result =
      await pinyinElement.evaluate(node => node?.firstChild?.nodeValue);
  if (!result) {
    console.error('Pinyin element not found!');
    return;
  }
  console.log(result);
}
