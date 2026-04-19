import { messages } from "../../shared/schema";
import { db } from "../db";
import { publishFamilyEvent } from "../realtime";
import { recordActivity } from "./activity-service";

type CreateMessageArgs = {
  familyId: number;
  userId: number;
  senderName: string;
  content: string;
  isSystem?: boolean;
};

export async function createMessage(args: CreateMessageArgs) {
  const [message] = await db.insert(messages).values(args).returning();
  publishFamilyEvent(args.familyId, "family:message", message);
  if (!args.isSystem) {
    await recordActivity({
      familyId: args.familyId,
      userId: args.userId,
      type: "chat_message",
      title: `${args.senderName} sent a message`,
      body: args.content,
      relatedEntityType: "message",
      relatedEntityId: message.id,
    });
  }
  return message;
}

export async function createSystemMessage(familyId: number, userId: number, content: string) {
  return createMessage({
    familyId,
    userId,
    senderName: "Taskling",
    content,
    isSystem: true,
  });
}
