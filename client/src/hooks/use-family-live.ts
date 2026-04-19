import { useEffect } from "react";
import { auth } from "../lib/firebase";
import { queryClient } from "../lib/queryClient";
import { api, buildUrl } from "../../../shared/routes";
import type { ActivityEvent, Message } from "../../../shared/schema";
import { useStore } from "../store/useStore";

function upsertById<T extends { id: number }>(list: T[] | undefined, incoming: T): T[] {
  const existing = list ?? [];
  const match = existing.findIndex((item) => item.id === incoming.id);
  if (match === -1) return [...existing, incoming];
  const next = [...existing];
  next[match] = incoming;
  return next;
}

export function useFamilyLive(familyId: number | undefined) {
  useEffect(() => {
    if (!familyId) return;

    let source: EventSource | null = null;
    let cancelled = false;

    const connect = async () => {
      const token = await auth.currentUser?.getIdToken();
      const demoUserId = useStore.getState().currentUser?.firebaseUid ? undefined : useStore.getState().currentUser?.id;
      if ((!token && !demoUserId) || cancelled) return;

      const params = new URLSearchParams({ familyId: String(familyId) });
      if (token) params.set("token", token);
      if (demoUserId) params.set("demoUserId", String(demoUserId));
      const url = `${api.events.stream.path}?${params.toString()}`;
      source = new EventSource(url);

      source.addEventListener("family:message", (event) => {
        const message = JSON.parse((event as MessageEvent).data) as Message;
        queryClient.setQueryData<Message[]>(
          [buildUrl(api.messages.list.path, { id: familyId })],
          (old) => upsertById(old, message).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
        );
      });

      source.addEventListener("family:activity", (event) => {
        const activity = JSON.parse((event as MessageEvent).data) as ActivityEvent;
        queryClient.setQueryData<ActivityEvent[]>(
          [api.families.getActivity.path, familyId],
          (old) => [activity, ...(old ?? []).filter((item) => item.id !== activity.id)].slice(0, 40),
        );
      });

      const invalidateFamilyData = () => {
        queryClient.invalidateQueries({ queryKey: [api.families.getChores.path, familyId] });
        queryClient.invalidateQueries({ queryKey: [api.families.getUsers.path, familyId] });
        queryClient.invalidateQueries({ queryKey: [api.families.getLeaderboard.path, familyId] });
        queryClient.invalidateQueries({ queryKey: [api.rewards.list.path, familyId] });
      };

      source.addEventListener("family:user", (event) => {
        const user = JSON.parse((event as MessageEvent).data);
        const { currentUser, setCurrentUser } = useStore.getState();
        if (user.id === currentUser?.id) {
          setCurrentUser(user);
        }
        queryClient.invalidateQueries({ queryKey: [api.families.getUsers.path, familyId] });
        queryClient.invalidateQueries({ queryKey: [api.families.getLeaderboard.path, familyId] });
      });

      source.addEventListener("family:leaderboard", invalidateFamilyData);
      source.addEventListener("family:chore", invalidateFamilyData);
      source.addEventListener("family:reward", invalidateFamilyData);
      source.addEventListener("family:review", invalidateFamilyData);
      source.onerror = () => {
        source?.close();
        source = null;
        if (!cancelled) {
          window.setTimeout(connect, 3000);
        }
      };
    };

    void connect();

    return () => {
      cancelled = true;
      source?.close();
    };
  }, [familyId]);
}
