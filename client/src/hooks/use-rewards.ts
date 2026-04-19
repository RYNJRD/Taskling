import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "../../../shared/routes";
import type { InsertReward } from "../../../shared/schema";
import { apiFetch } from "../lib/apiFetch";

export function useRewards(familyId: number | undefined) {
  return useQuery({
    queryKey: [api.rewards.list.path, familyId],
    queryFn: async () => {
      if (!familyId) throw new Error("No family id provided");
      const url = buildUrl(api.rewards.list.path, { id: familyId });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch rewards");
      return api.rewards.list.responses[200].parse(await res.json());
    },
    enabled: !!familyId,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertReward) => {
      const res = await apiFetch(api.rewards.create.path, {
        method: api.rewards.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.rewards.create.input.parse(data)),
      });
      if (!res.ok) throw new Error("Failed to create reward");
      return api.rewards.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.rewards.list.path, variables.familyId] });
    },
  });
}
