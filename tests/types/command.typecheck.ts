import {
  ApplicationCommandOptionType,
  type Client,
  type MessageContextMenuCommandInteraction,
  MessageFlags,
  type ModalSubmitInteraction,
} from "discord.js";
import type { Action, Actions } from "../../src/types/action";
import type { Command } from "../../src/types/command";

const data: Command["data"] = {
  name: "test",
  description: "型検査用のコマンド",
  flags: MessageFlags.Ephemeral,
  options: [
    {
      name: "choice",
      description: "選択肢",
      type: ApplicationCommandOptionType.String,
      choices: [{ name: "有効な選択肢", value: "有効" }],
    },
  ],
};
declare const client: Client;
client.application?.commands.set([data]);

// @ts-expect-error 文字列の選択肢に数値は指定できない。
export const badOption: NonNullable<Command["data"]["options"]>[number] = {
  name: "choice",
  description: "選択肢",
  type: ApplicationCommandOptionType.String,
  choices: [{ name: "不正な選択肢", value: 1 }],
};

declare const command: Command;
declare const contextMenu: MessageContextMenuCommandInteraction;
// @ts-expect-error スラッシュコマンドの処理に右クリックメニューの操作は渡せない。
command.execute(contextMenu);

declare const actions: Actions;
declare const modal: Action<ModalSubmitInteraction>;
// @ts-expect-error モーダルの処理はボタンの処理として登録できない。
actions.button.wrong = modal;

// @ts-expect-error Actionにはボタンかモーダルの操作の型を指定する。
export type InvalidAction = Action<number>;
