import type { ButtonInteraction, InteractionDeferReplyOptions, ModalSubmitInteraction } from "discord.js";

export interface Action<ActionType extends ButtonInteraction | ModalSubmitInteraction> {
  data: {
    action: string;
    defer?: boolean;
    flags?: InteractionDeferReplyOptions["flags"];
  };

  execute: (interaction: ActionType) => Promise<void>;
}

export interface Actions {
  button: Record<string, Action<ButtonInteraction>>;
  modal: Record<string, Action<ModalSubmitInteraction>>;
}
