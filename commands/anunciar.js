import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

const userAnnouncements = new Map();

export const data = new SlashCommandBuilder()
    .setName('anunciar')
    .setDescription('Crie um anúncio interativo.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('Personalize seu anúncio')
        .setDescription('Use o menu abaixo para escolher um elemento para personalizar.')
        .setThumbnail('https://exemplo.com/imagem.png') // URL de uma imagem miniatura opcional
        .setColor('#00FF00');

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('announcementSelect')
        .setPlaceholder('Selecione um elemento para personalizar')
        .addOptions([
            { label: 'Título', description: 'Mudar o título do anúncio', value: 'setTitle' },
            { label: 'Descrição', description: 'Mudar a descrição do anúncio', value: 'setDescription' },
            { label: 'Cor', description: 'Mudar a cor do embed', value: 'setColor' },
            { label: 'URL', description: 'Mudar a URL do embed', value: 'setUrl' },
            { label: 'Canal', description: 'Escolher o canal do anúncio', value: 'setChannel' },
            { label: 'Imagem', description: 'Adicionar uma imagem ao anúncio', value: 'setImage' },
            { label: 'Footer', description: 'Adicionar um footer ao anúncio', value: 'setFooter' }
        ]);

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('submitAnnouncement').setLabel('Enviar Anúncio').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('resetAnnouncement').setLabel('Resetar').setStyle(ButtonStyle.Danger)
    );

    userAnnouncements.set(interaction.user.id, { title: '', description: '', color: '', url: '', channelId: '', image: '', footer: '' });

    await interaction.reply({ content: 'Use o menu abaixo para personalizar seu anúncio.', embeds: [embed], components: [actionRow, buttonRow], ephemeral: true });
    console.log(`${interaction.user.username} iniciou o processo de anúncio.`);
}

export async function handleInteraction(interaction) {
    if (interaction.isStringSelectMenu()) {
        const userId = interaction.user.id;
        const announcement = userAnnouncements.get(userId);

        let previewEmbed = new EmbedBuilder()
            .setTitle(announcement.title || 'SeuTítulo')
            .setDescription(announcement.description || 'SuaDescrição')
            .setColor(announcement.color || '#00FF00')
            .setURL(announcement.url || null)
            .setImage(announcement.image || null)
            .setFooter({ text: announcement.footer || 'SeuFooter' });

        switch (interaction.values[0]) {
            case 'setTitle':
                await interaction.reply({ content: 'Por favor, envie o título do anúncio.', ephemeral: true });
                const titleMessage = await interaction.channel.awaitMessages({ max: 1, time: 60000, errors: ['time'] });
                const title = titleMessage.first().content;
                await titleMessage.first().delete();
                announcement.title = title;
                previewEmbed.setTitle(title);
                break;

            case 'setDescription':
                await interaction.reply({ content: 'Por favor, envie a descrição do anúncio.', ephemeral: true });
                const descriptionMessage = await interaction.channel.awaitMessages({ max: 1, time: 60000, errors: ['time'] });
                const description = descriptionMessage.first().content;
                await descriptionMessage.first().delete();
                announcement.description = description;
                previewEmbed.setDescription(description);
                break;

            case 'setColor':
                await interaction.reply({ content: 'Por favor, envie a cor do embed em formato HEX (por exemplo, #ff0000).', ephemeral: true });
                const colorMessage = await interaction.channel.awaitMessages({ max: 1, time: 60000, errors: ['time'] });
                const color = colorMessage.first().content;
                await colorMessage.first().delete();
                announcement.color = color;
                previewEmbed.setColor(color);
                break;

            case 'setUrl':
                await interaction.reply({ content: 'Por favor, envie a URL do embed.', ephemeral: true });
                const urlMessage = await interaction.channel.awaitMessages({ max: 1, time: 60000, errors: ['time'] });
                const url = urlMessage.first().content;
                await urlMessage.first().delete();
                announcement.url = url;
                previewEmbed.setImage(url);
                break;

            case 'setChannel':
                await interaction.reply({ content: 'Por favor, envie a ID do canal onde o anúncio será enviado.', ephemeral: true });
                const channelMessage = await interaction.channel.awaitMessages({ max: 1, time: 60000, errors: ['time'] });
                const channelId = channelMessage.first().content;
                await channelMessage.first().delete();
                announcement.channelId = channelId;
                break;

            case 'setImage':
                await interaction.reply({ content: 'Por favor, envie o link da imagem que deseja adicionar.', ephemeral: true });
                const imageMessage = await interaction.channel.awaitMessages({ max: 1, time: 60000, errors: ['time'] });
                const imageUrl = imageMessage.first().content;
                await imageMessage.first().delete();
                announcement.image = imageUrl;
                previewEmbed.setImage(imageUrl);
                previewEmbed.setURL(imageUrl); // Define o URL da imagem como URL do embed
                break;

            case 'setFooter':
                await interaction.reply({ content: 'Por favor, envie o texto do footer.', ephemeral: true });
                const footerMessage = await interaction.channel.awaitMessages({ max: 1, time: 60000, errors: ['time'] });
                const footerText = footerMessage.first().content;
                await footerMessage.first().delete();
                announcement.footer = footerText;
                previewEmbed.setFooter({ text: footerText.trim().length > 0 ? footerText : 'SeuFooter' });
                break;
        }

        userAnnouncements.set(userId, announcement);

        // Envia a visualização atualizada da embed
        await interaction.followUp({ content: 'Veja como seu anúncio está ficando:', embeds: [previewEmbed], ephemeral: true });
    } else if (interaction.isButton()) {
        const userId = interaction.user.id;
        const announcement = userAnnouncements.get(userId);

        if (interaction.customId === 'submitAnnouncement') {
            const channel = interaction.guild.channels.cache.get(announcement.channelId);

            if (!channel) {
                return interaction.reply({ content: 'Canal inválido. Por favor, defina um canal válido.', ephemeral: true });
            }

            const announcementEmbed = new EmbedBuilder()
                .setTitle(announcement.title || 'SeuTítulo')
                .setDescription(announcement.description || 'SuaDescrição')
                .setColor(announcement.color || '#00FF00')
                .setImage(announcement.url || null)
                .setImage(announcement.image || null)
                .setFooter({ text: announcement.footer || 'SeuFooter' });

            await channel.send({ embeds: [announcementEmbed] });
            await interaction.reply({ content: 'Anúncio enviado com sucesso!', ephemeral: true });
            userAnnouncements.delete(userId); // Limpa o estado após o envio do anúncio
        } else if (interaction.customId === 'resetAnnouncement') {
            userAnnouncements.set(userId, { title: '', description: '', color: '', url: '', channelId: '', image: '', footer: '' });
            await interaction.reply({ content: 'Configurações resetadas. Você pode começar novamente.', ephemeral: true });
        }
    }
}
