import {
  type Client,
  EmbedBuilder,
  type MessageCreateOptions,
  type SendableChannels,
  type ThreadChannel,
} from "discord.js";
import { botConfig } from "../../config/botConfig";
import { LoggerType, log } from "../../infrastructure/logger";

async function sendSafely(
  target: Pick<SendableChannels, "send">,
  payload: MessageCreateOptions,
  label: string,
): Promise<boolean> {
  try {
    await target.send(payload);
    return true;
  } catch (error) {
    log(LoggerType.ERROR, `[noticeNewRecruit] Failed to send ${label}:`, error);
    return false;
  }
}

export default async function noticeNewRecruit(client: Client, thread: ThreadChannel): Promise<void> {
  const channel = await client.channels.fetch(botConfig.channel.recruitNoticeId);
  if (!channel?.isSendable()) return;

  try {
    const starterMessage = await thread.fetchStarterMessage();
    const owner = await thread.fetchOwner();

    const embed = new EmbedBuilder()
      .setTitle(`${thread.name}　が募集開始したよ！`)
      .setDescription(starterMessage?.content ?? "")
      .addFields(
        { name: "募集開始日時", value: `${thread.createdAt?.toLocaleString()}` },
        { name: "部長候補者", value: owner?.user?.displayName ?? "不明" },
        { name: "参加リンク", value: thread.url },
      )
      .setTimestamp()
      .setColor("#52f525");

    // sendSafelyが成功したときのみ成功ログを表示する
    const result = await sendSafely(channel, { embeds: [embed] }, "recruit notice");
    if (result) {
      log(LoggerType.INFO, "[noticeNewRecruit] Successfly sent");
    }
  } catch (error) {
    const embed = new EmbedBuilder().setTitle("エラーが発生しました").setTimestamp().setColor("#ff0000");

    await sendSafely(thread, { embeds: [embed] }, "thread error notice");
    log(LoggerType.ERROR, error);
    await sendSafely(channel, { embeds: [embed] }, "channel error notice");
  }
}
