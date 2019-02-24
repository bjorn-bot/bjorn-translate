const Discord = require('eris');
const translate = require('@k3rn31p4nic/google-translate-api');

const config = require('./config');
const lang = require('./langs.js');
const langs = require('./langmap.js');

const bjornTools = require('./bjorn-tools');

let bjornTranslateBot = new Discord(config.token, { maxShards: "auto", getAllUsers: true });

bjornTranslateBot.on('ready', (evt) => {
   console.log(`Logged in as: ${bjornTranslateBot.user.username} (${bjornTranslateBot.user.id})`);
});

bjornTranslateBot.on('messageCreate', async (msg) => {
  if(msg.author.bot) return;

  if (msg.content.startsWith('!bjorn')) return bjornTools(msg, bjornTranslateBot);

  const tsChannelsEnabled = config.tsChannelsEnabled;
  const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toString().toLowerCase();

  if (tsChannelsEnabled) tsChannels();

  if (msg.content.toLowerCase().indexOf(config.prefix) !== 0) return;

  if (msg.content.toLowerCase().indexOf(config.prefix + ' ') == 0) { 
    let LangMap = new Map()
    let thingToTranslate = args.join(' ');

    if (command === 'lang') return languageDetection(thingToTranslate);

    for (let l in langs) {
      for (let a in langs[l].alias) {
        LangMap.set(langs[l].alias[a], (args) => {
          return translateFunction(l, args.join(' '), `:flag_${langs[l].flag}:`)
        })
      }
    }

    let toT = LangMap.get(command)

    if (toT) {
      return toT(args)
    }

    function translateFunction(lang, string, flag) {
      if (string == '' || string == null || string == undefined) return msg.channel.createMessage('Nothing to translate!');

      translate(string, { to: lang }).then((res) => {
        if (res.text.length > 200) {
          return msg.channel.createMessage(`${flag}\n${res.text}`);
        }

        msg.channel.createMessage({ embed: {
          color: 0xFFFFFF, description: `${flag} ${res.text}`
        }});
      }).catch(err => { console.error(err) });
    }

    function languageDetection(string) {
      if (string == '' || string == null || string == undefined) return msg.channel.createMessage('Nothing to analyze!');

      translate(string).then((res)=>{
        return msg.channel.createMessage({embed: {color:0xFFFFFF, fields: [{ name: 'Detected Language', value: lang[res.from.language.iso] }] } })
      }).catch(err => { console.error(err) });
    }
  }

  async function tsChannels() {
    if (!msg.channel.topic) return;
    if (!msg.channel.topic.toLowerCase().startsWith('ts-')) return;

    let tsChannels = {};
    // split on another character in topic to get channel indentifier
    // loop through channels to find all with matching identifier
    // loop through indentifier group, find language match for each
    // channel in group, call tsChannelTranslate for each channel in
    // group
    let splitTopic = msg.channel.topic.split('#');
    let topicIdentifier = splitTopic[1];

    msg.channel.guild.channels.map((channel) => {
      if (channel.topic) {
        if (channel.topic.toLowerCase().startsWith('ts-')) {
          let channelInfo = channel.topic.replace('ts-', '').split('#');
          let channelLanguage = channelInfo[0];
          let channelTopic = channelInfo[1];

          if (!tsChannels[channelTopic]) tsChannels[channelTopic] = {};

          tsChannels[channelTopic][channelLanguage] = channel.id;
        }
      }
    });

    console.log(tsChannels);

    // for (i = 0; i < tsChannels.length; i++) {
    //   let channelLangReg = /(?<=ts\-)\S+/i;
    //   let channelLang = channelLangReg.exec(tsChannels[i].topic.toLowerCase());
    //   channelLang = channelLang[channelLang.length - 1];

    //   for (let l in langs) {
    //     for (let a in langs[l].alias) {
    //       if (langs[l].alias[a] === channelLang) {
    //         tsChannelTranslate(l, msg.content, `:flag_${langs[l].flag}:`, msg.channel.id, tsChannels[i].id);
    //       }
    //     }
    //   }
    // }

    function tsChannelTranslate(lang, string, flag, sourceChannel, targetChannel) {
      if (string == '' || string == null || string == undefined) return;
      
      if(targetChannel !== sourceChannel) {
        
        translate(string, { to: lang }).then(res => {
          // can strip out this length limit?
          if (res.text.length > 200) {
            bjornTranslateBot.createMessage(targetChannel, `**${msg.author.username}#${msg.author.discriminator}**: ${res.text}`);
          } else {
            let color = msg.member.guild.roles.get(msg.member.roles[0]).color;

            bjornTranslateBot.createMessage(targetChannel, { embed: {
              color: color, description: `${flag} ${res.text}`, author: {name: `${msg.author.username}#${msg.author.discriminator}`, icon_url: msg.author.avatarURL ? msg.author.avatarURL : msg.author.defaultAvatarURL}
            }});
          }
        }).catch(err => console.error(err) );
      }
    }
  }
});

bjornTranslateBot.connect();
