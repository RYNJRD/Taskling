import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateChoreRequest, type UpdateChoreRequest } from "../../../shared/routes";
import { apiFetch } from "../lib/apiFetch";

export function useCreateChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateChoreRequest) => {
      const res = await apiFetch(api.chores.create.path, {
        method: api.chores.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.chores.create.input.parse(data)),
      });
      if (!res.ok) throw new Error("Failed to create chore");
      return api.chores.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.families.getChores.path, variables.familyId] });
    },
  });
}

export function useUpdateChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, familyId, ...data }: { id: number; familyId: number } & UpdateChoreRequest) => {
      const url = buildUrl(api.chores.update.path, { id });
      const res = await apiFetch(url, {
        method: api.chores.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.chores.update.input.parse(data)),
      });
      if (!res.ok) throw new Error("Failed to update chore");
      return api.chores.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.families.getChores.path, variables.familyId] });
    },
  });
}

export function useCompleteChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId, familyId }: { id: number; userId: number; familyId: number }) => {
      const url = buildUrl(api.chores.complete.path, { id });
      const res = await apiFetch(url, {
        method: api.chores.complete.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to complete chore");
      return api.chores.complete.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate both chores and users (for points update)
      queryClient.invalidateQueries({ queryKey: [api.families.getChores.path, variables.familyId] });
      queryClient.invalidateQueries({ queryKey: [api.families.getUsers.path, variables.familyId] });
      queryClient.invalidateQueries({ queryKey: [api.families.getLeaderboard.path, variables.familyId] });
    },
  });
}
