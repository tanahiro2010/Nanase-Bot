import assert from "node:assert/strict";
import path from "node:path";
// TODO: Vitestへ移行し、node:testのAPIとpackage.jsonの実行コマンドを置き換える。
import { afterEach, describe, mock, test } from "node:test";
import {
  ApplicationCommandType,
  type ChatInputCommandInteraction,
  CommandInteraction,
  type Interaction,
  type InteractionDeferReplyOptions,
  InteractionType,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import { loadActions, loadCommands } from "../src/infrastructure/discord/loader";
import createInteractionRouter from "../src/presentation/interactions/router";
import type { Command } from "../src/types/command";

describe("コマンドとアクションの読み込み", () => {
  test("チケットのコマンドとボタンアクションを読み込める", () => {
    const presentation = path.resolve(__dirname, "../src/presentation");
    const commands = loadCommands(path.join(presentation, "commands"), ".ts");
    const actions = loadActions(path.join(presentation, "interactions"), ".ts");

    assert.ok(commands.ticket);
    assert.ok(actions.button["ticket-open"]);

    const permissions = new PermissionsBitField(commands.ticket.data.defaultMemberPermissions ?? []);
    assert.equal(permissions.bitfield, PermissionFlagsBits.ManageChannels);
  });
});

function interaction(commandType: ApplicationCommandType): Extract<Interaction, CommandInteraction> {
  const target: Extract<Interaction, CommandInteraction> = Object.create(CommandInteraction.prototype);
  return Object.assign(target, {
    type: InteractionType.ApplicationCommand,
    commandType,
    commandName: "test",
    replied: false,
    deferred: false,
  });
}

describe("インタラクションのルーティング", () => {
  afterEach(() => mock.restoreAll());

  test("スラッシュコマンドだけを専用ハンドラーに渡す", async () => {
    const execute = mock.fn(async (_interaction: ChatInputCommandInteraction) => {});
    const command: Command = {
      data: { name: "test", description: "ルーティングの検証", flags: MessageFlags.Ephemeral },
      execute,
    };
    const route = createInteractionRouter({ test: command }, { button: {}, modal: {} });
    const slash = interaction(ApplicationCommandType.ChatInput);
    const deferReply = mock.method(slash, "deferReply", async (_options?: InteractionDeferReplyOptions) => {});
    await route(slash);

    assert.equal(execute.mock.calls.length, 1);
    assert.equal(execute.mock.calls[0].arguments[0], slash);
    assert.equal(deferReply.mock.calls.length, 1);
    assert.deepEqual(deferReply.mock.calls[0].arguments[0], { flags: MessageFlags.Ephemeral });

    for (const type of [ApplicationCommandType.User, ApplicationCommandType.Message]) {
      const contextMenu = interaction(type);
      const deferReply = mock.method(contextMenu, "deferReply", async () => {});
      const reply = mock.method(contextMenu, "reply", async () => {});
      const followUp = mock.method(contextMenu, "followUp", async () => {});
      assert.equal(contextMenu.isCommand(), true);
      await route(contextMenu);

      assert.equal(deferReply.mock.calls.length, 0);
      assert.equal(reply.mock.calls.length, 0);
      assert.equal(followUp.mock.calls.length, 0);
    }

    assert.equal(execute.mock.calls.length, 1);
  });

  test("処理失敗時は応答済みかどうかで返信方法を切り替える", async () => {
    const command: Command = {
      data: { name: "test", description: "エラー応答の検証", flags: MessageFlags.Ephemeral, defer: false },
      execute: async () => {
        throw new Error("処理に失敗しました");
      },
    };
    const route = createInteractionRouter({ test: command }, { button: {}, modal: {} });
    for (const replied of [false, true]) {
      const target = interaction(ApplicationCommandType.ChatInput);
      target.replied = replied;
      const reply = mock.method(target, "reply", async (_payload: unknown) => {});
      const followUp = mock.method(target, "followUp", async (_payload: unknown) => {});
      await route(target);

      const response = replied ? followUp : reply;
      const unusedResponse = replied ? reply : followUp;
      assert.equal(response.mock.calls.length, 1);
      assert.equal(unusedResponse.mock.calls.length, 0);
      assert.deepEqual(response.mock.calls[0].arguments[0], {
        content: "There was an error while executing this interaction!",
        ephemeral: true,
      });
    }
  });
});
