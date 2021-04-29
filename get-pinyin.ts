import * as commandLineArgs from "command-line-args";
import * as puppeteer from "puppeteer-core";
import * as readline from "readline";

const DEFAULT_CHROMIUM_PATH =
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const optionDefinitions = [
  { name: "prompt", alias: "p", defaultValue: "中文> ", type: String },
  {
    name: "chromium",
    alias: "c",
    defaultValue: DEFAULT_CHROMIUM_PATH,
    type: String,
  },
];

const options = commandLineArgs(optionDefinitions);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: options.prompt,
});

(async () => {
  const browser = await puppeteer.launch({
    executablePath: options.chromium,
    headless: false,
    defaultViewport: { height: 600, width: 1000 },
  });
  const page = await browser.newPage();
  await page.goto("https://translate.google.com/?sl=zh-CN&tl=ja&op=translate");

  rl.prompt();
  rl.on("line", async (line) => {
    const result = await getPinyin(line, page);
    if (result.ok) {
      console.log(result.body);
    } else {
      console.error(result.body);
    }
    rl.prompt();
  }).on("close", async () => {
    console.log("Bye!");
    await browser.close();
  });
})();

type Result = { ok: boolean; body: string };

const getPinyin = async (
  line: string,
  page: puppeteer.Page
): Promise<Result> => {
  const input = line.trim();
  if (!input) {
    return { ok: false, body: "Empty input" };
  }

  const pinyinElementClass = "kO6q6e";

  // Clear the input once to avooid getting a stale result unexpectedly.
  try {
    await page.click("[aria-label='原文を消去']");
  } catch (e) {
    if (e.message !== "Node is either not visible or not an HTMLElement") {
      throw e;
    }
  }
  await page.waitForFunction(
    (selector: string) => {
      const nodes = document.getElementsByClassName(selector);
      const content = nodes[0]?.firstChild?.nodeValue;
      return !content;
    },
    { polling: "mutation" },
    pinyinElementClass
  );

  const textarea = await page.$("[aria-label='原文']");
  await textarea.type(line);

  try {
    const resultHandle = await page.waitForFunction(
      (selector: string) => {
        const nodes = document.getElementsByClassName(selector);
        return nodes[0]?.firstChild?.nodeValue;
      },
      { polling: "mutation" },
      pinyinElementClass
    );
    const result = (await resultHandle.jsonValue()) as string;
    return { ok: true, body: result };
  } catch (e) {
    if (e instanceof puppeteer.errors.TimeoutError) {
      const body = "Failed to get pinyin! Is this really a Chinese word?";
      return { ok: false, body };
    }
    throw e;
  }
};
