#!/usr/bin/env node

const { default: axios } = require("axios");
const chalk = require("chalk");
const { createInterface } = require("readline");
const minimist = require("minimist");
const fs = require("fs");
const { prompt } = require("enquirer");
const path = require("path");
const { execSync } = require("child_process");
const { URLSearchParams } = require("url");

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (query) =>
  new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });

(async () => {
  const args = minimist(process.argv.slice(2));
  const text = args._.join(" ");
  process.stdin.setRawMode(true);
  const homedir = require("os").homedir();
  const configFile = path.join(homedir, ".deepl-config.json");
  if (!fs.existsSync(configFile)) {
    console.log(
      `${chalk.red("✘")} ${chalk.bold(".deepl-config.json")} not found`
    );
    const { apiKey, pro } = await prompt([
      {
        type: "input",
        name: "apiKey",
        message: "Enter your API key",
      },
      {
        type: "confirm",
        name: "pro",
        message: "Are you a Pro user?",
      },
    ]);
    fs.writeFileSync(configFile, JSON.stringify({ apiKey, pro }));
    console.log(
      `${chalk.green("✔")} ${chalk.bold("~/.deepl-config.json")} created`
    );
  }
  const { apiKey, pro } = JSON.parse(fs.readFileSync(configFile, "utf8"));
  const url = pro
    ? "https://api.deepl.com/v2/translate"
    : "https://api-free.deepl.com/v2/translate";
  try {
    const params = new URLSearchParams({
      auth_key: apiKey,
      text,
      target_lang: args.l || args.lang || "en",
    });
    const { data } = await axios.post(
      url,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log(data.translations[0].text);
    if (!args.nc && !args.nocopy) {
      execSync(`echo ${data.translations[0].text} | clip`);
      console.log(`${chalk.green("✔")} Copied to clipboard`);
    }
    process.exit(0);
  } catch (e) {
    console.log(`${chalk.red("✘")} Error: ${e}`);
    process.exit(1);
  }
})();
