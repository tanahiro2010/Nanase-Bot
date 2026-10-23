import type {
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  InteractionDeferReplyOptions,
} from "discord.js";

export interface Command {
  data: ChatInputApplicationCommandData & {
    flags: InteractionDeferReplyOptions["flags"]; // レスポンスのフラグ。荒らし防止のためEphemeral推奨
    defer?: boolean; // コマンド実行時にdeferを行うかどうか。処理に時間がかかる場合はtrue推奨
  };

  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface ButtonCommand {
  action: string;

  value?: Record<string, unknown>;
}

export interface ModalCommand {
  action: string;

  value?: Record<string, unknown>;
}
