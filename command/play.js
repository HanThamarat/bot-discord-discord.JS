const { SlashCommandBuilder } = require('@discordjs/builders');
const { msgEmbed } = require('discord.js');
const { QueryTypes } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("loads songs from youtoube")
        .addSubcommand((subcommand) => 
        subcommand.setName("song")
        .setDescription("Loads a song from a url").addStringOption((options) => options.setName("url").setDescription("the song url").setRequired(true))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("playlist")
                .setDescription("Load playlist song from a url")
                .addStringOption((options) => options.setName("url").setDescription("the playlist url").setRequired(true))
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("search").setDescription("Search song based on provided keywords")
                .addStringOption((options) => options.setName("Searchterms").setDescription("the search keywords").setRequired(true))
        ),
        run: async ({ client, interaction }) => {
            if (!interaction.member.voice.channel) {
                return interaction.editReply("You need to be in a VC to use this command");
            }
            
            const queue = await client.player.createQueue(interaction.guild);
            if(!queue.connection) {
                await queue.connection(interaction.member.voice.channel)
            }

            let embed = new msgEmbed()

            if(interaction.options.getSubcommand() === "song") {
                let url = interaction.options.getString("url");
                const result = await client.player.search(url, {
                    requestedBy: interaction.user,
                    SearchEngine: QueryTypes.YOUTUBE_VIDEO
                });

                if (result.tracks.length === 0) {
                    return interaction.editReply("No results");
                }

                const song = result.tracks[0]
                await queue.addTrack(song)
                embed
                    .setDescription('**[', song.title ,'] -', song.url ,'- ** has beenadded to the queue')
                    .setThumbnail(song.thumbnail)
                    .setFooter({ text: `Duration: ${song.duration}`})
            } else if (interaction.options.getSubcommand() === "playlist") {
                let url = interaction.options.getString("url");
                const result = await client.player.search(url, {
                    requestedBy: interaction.user,
                    SearchEngine: QueryTypes.YOUTUBE_PLAYLIST
                });

                if (result.tracks.length === 0) {
                    return interaction.editReply("No results");
                }

                const playlist = result.playlist
                await queue.addTracks(result.tracks)
                embed
                    .setDescription('**', result.tracks.length ,' song from [', playlist.title ,'] -', playlist.url ,'- ** has beenadded to the queue')
                    .setThumbnail(song.thumbnail)
                    .setFooter({ text: `Duration: ${song.duration}`})
            } else if(interaction.options.getSubcommand() === "search") {
                let url = interaction.options.getString("Searchterms");
                const result = await client.player.search(url, {
                    requestedBy: interaction.user,
                    SearchEngine: QueryTypes.AUTO
                });

                if (result.tracks.length === 0) {
                    return interaction.editReply("No results");
                }

                const song = result.tracks[0]
                await queue.addTracks(song)
                embed
                    .setDescription('**[', song.title ,'] -', song.url ,'- ** has beenadded to the queue')
                    .setThumbnail(song.thumbnail)
                    .setFooter({ text: `Duration: ${song.duration}`})
            }
            if (!queue.playing) await queue.play()
            await interaction.editReply({
                embeds: [embed]
            })
        },
}