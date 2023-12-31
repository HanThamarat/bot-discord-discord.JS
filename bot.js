const { Collection, Events ,Client , GatewayIntentBits } = require("discord.js")
const dotenv = require("dotenv")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const fs = require("fs")
const { Player } = require("discord-player")


dotenv.config();
const TOKEN = process.env.CLIENT_TOKEN;

const LOAD_SLASH = process.argv[2] == 'load';

const APPLICATION_ID = "1165194078800052315"
const GUILD_ID = "1165268184379699292"

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,   
        GatewayIntentBits.GuildMessages,
    ]});

    
client.slashcommand = new Collection();
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1<<25
    }
});

let commands = []

const slashFiles = fs.readdirSync('./command').filter(file => file.endsWith('.js'))
for (const file of slashFiles){
    const slashcmd = require(`./command/${file}`)
    client.slashcommand.set(slashcmd.data.name, slashcmd)
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON())
}

if(LOAD_SLASH) {
    const rest = new REST({ version: "9" }).setToken(TOKEN)
    console.log("Deploy slash command");
    rest.put(Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID), {body: commands})
    .then(() => {
        console.log('Success loading');
        process.exit(0);
    })
    .catch((err) => {
        if(err) {
            console.log(err);
            process.exit(1);
        }
    })
} else {
    client.on("ready", () => {
        console.log('Logged in as', client.user.tag);
    });
    client.on("interactionCreate", (interaction) => {
        async function handleCmd() {
            if (!interaction.isCommand()) return

            const slashcmd = client.slashcommand.get(interaction.commandName);
            if (!slashcmd) interaction.reply("Not a valid slash command")

            await interaction.deferReply()
            await slashcmd.run({ client, interaction })
        }
        handleCmd()
    });
    client.login(TOKEN)
}