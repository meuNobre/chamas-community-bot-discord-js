import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('punir')
    .setDescription('Pune um usuário especificado.')
    .addUserOption(option =>
        option.setName('usuario')
            .setDescription('Selecione o usuário a ser punido.')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('motivo')
            .setDescription('Digite o motivo da punição.')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);


export async function execute(interaction) {
    try {
        const usuario = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');

        // Obtenha o membro do usuário a partir da guilda
        const member = await interaction.guild.members.fetch(usuario.id);
        if (!member) {
            await interaction.reply({ content: 'Não foi possível encontrar o usuário.', ephemeral: true });
            return;
        }

        // Enviar uma mensagem direta ao usuário com o motivo
        try {
            await usuario.send(`Você foi banido do servidor ${interaction.guild.name}.\nMotivo: ${motivo}`);
        } catch (error) {
            console.error(`Não foi possível enviar a mensagem direta ao usuário ${usuario.tag}.`);
        }

        // Banir o membro
        await member.ban({ reason: motivo });

        // Log de punição
        const logChannelId = '1273769399970562061'; // ID do canal de log
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        if (logChannel) {
            // Envia a log para o canal especificado
            await logChannel.send({
                embeds: [
                    {
                        title: 'Usuário Punido',
                        description: `**Usuário:** <@${usuario.id}>\n**Motivo:** ${motivo}`,
                        color: 0xff0000,
                        timestamp: new Date(),
                    }
                ]
            });
        }

        // Responde ao usuário que executou o comando
        await interaction.reply({ content: `O usuário <@${usuario.id}> foi banido com sucesso.\nMotivo: ${motivo}`, ephemeral: true });
    } catch (error) {
        console.error('Erro ao executar o comando /punir:', error);

        // Envia o log de erro para o canal especificado
        const logChannelId = '1273769399970562061'; // ID do canal de log
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        if (logChannel) {
            await logChannel.send({
                embeds: [
                    {
                        title: 'Erro ao Punir Usuário',
                        description: `**Erro:** ${error.message}`,
                        color: 0xff0000,
                        timestamp: new Date(),
                    }
                ]
            });
        }

        await interaction.reply({ content: 'Houve um erro ao tentar punir o usuário.', ephemeral: true });
    }
}
