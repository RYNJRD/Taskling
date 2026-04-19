import type { Response } from "express";
import type { SseEventType } from "../shared/constants";

type Client = {
  id: string;
  familyId: number;
  res: Response;
};

const clients = new Map<string, Client>();

function writeEvent(res: Response, event: SseEventType, payload: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function registerSseClient(id: string, familyId: number, res: Response) {
  clients.set(id, { id, familyId, res });
  writeEvent(res, "family:heartbeat", { ok: true, familyId, connectedAt: new Date().toISOString() });
}

export function removeSseClient(id: string) {
  clients.delete(id);
}

export function publishFamilyEvent(familyId: number, event: SseEventType, payload: unknown) {
  for (const client of clients.values()) {
    if (client.familyId !== familyId) continue;
    writeEvent(client.res, event, payload);
  }
}
