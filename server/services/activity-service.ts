import { activityEvents } from "../../shared/schema";
import type { ActivityEventType } from "../../shared/constants";
import { db } from "../db";
import { publishFamilyEvent } from "../realtime";

type RecordActivityArgs = {
  familyId: number;
  userId?: number | null;
  type: ActivityEventType;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  metadata?: Record<string, unknown>;
};

export async function recordActivity(args: RecordActivityArgs) {
  const [event] = await db
    .insert(activityEvents)
    .values({
      familyId: args.familyId,
      userId: args.userId ?? null,
      type: args.type,
      title: args.title,
      body: args.body,
      relatedEntityType: args.relatedEntityType,
      relatedEntityId: args.relatedEntityId,
      metadata: args.metadata ?? {},
    })
    .returning();

  publishFamilyEvent(args.familyId, "family:activity", event);
  return event;
}
