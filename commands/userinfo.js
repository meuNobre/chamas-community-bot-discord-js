import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Exibe informações sobre um usuário.')
    .addUserOption(option => 
        option.setName('user')
            .setDescription('O usuário para obter informações')
            .setRequired(true));

export async function execute(interaction) {
    const user = interaction.options.getUser('user');
    const member = interaction.guild.members.cache.get(user.id);

    // Embed de informações sobre o usuário
    const userInfoEmbed = new EmbedBuilder()
        .setTitle(`Informações sobre o Usuário`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: ':id: ID do Discord', value: `${user.id}`, inline: true },
            { name: ':label: Tag do Discord', value: `${user.tag}`, inline: true },
            { name: ':calendar: Data de Criação da Conta', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: false }
        )
        .setColor(0x5865F2);

    // Embed de informações sobre o membro
    const memberInfoEmbed = new EmbedBuilder()
        .setTitle(`Informações sobre o Membro`)
        .addFields(
            { name: ':calendar: Data de Entrada no Servidor', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
            { name: '🌟 Maior cargo', value: `${member.roles.highest.name}`, inline: true }
        )
        .setColor(0x5865F2);

    // Botões com ID do usuário como parte do customId
    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`show_avatar_${user.id}`) // Adicionando o ID do usuário ao customId
                .setLabel('Ver o avatar global do usuário')
                .setStyle(ButtonStyle.Primary)
        );

    // Resposta com as embeds e os botões
    await interaction.reply({ embeds: [userInfoEmbed, memberInfoEmbed], components: [buttons], ephemeral: true });
}
