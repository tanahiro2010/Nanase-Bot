import { ButtonBuilder, ButtonStyle } from "discord.js"

type Props = {
    label: string;
    customId: Record<string, any> | string;
    style?: ButtonStyle;
}

const createButton = (props: Props) => {
    return new ButtonBuilder()
        .setLabel(props.label)
        .setCustomId(JSON.stringify(props.customId))
        .setStyle(props.style ?? ButtonStyle.Primary);
}

export { createButton };