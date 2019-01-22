const Discord = require('discord.io');
const translate = require('@k3rn31p4nic/google-translate-api');

const config = require('./config');
const lang = require('./langs.js');
const langs = require('./langmap.js');

let bjornTranslateBot = new Discord.Client({
  token: config.token,
  autorun: true
});

bjornTranslateBot.on('ready', (evt) => {
  console.log(`Logged in as: ${bjornTranslateBot.username} (${bjornTranslateBot.id})`);
});