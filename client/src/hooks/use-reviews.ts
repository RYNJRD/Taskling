import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "../../../shared/routes";
import { apiFetch } from "../lib/apiFetch";

export function usePendingChoreReviews(familyId: number | undefined) {
  return useQuery({
    queryKey: [api.reviews.chorePending.path, familyId],
    queryFn: async () => {
      if (!familyId) throw new Error("No family id provided");
      const res = await apiFetch(buildUrl(api.reviews.chorePending.path, { id: familyId }));
      if (!res.ok) throw new Error("Failed to fetch pending chore reviews");
      return api.reviews.chorePending.responses[200].parse(await res.json());
    },
    enabled: !!familyId,
  });
}

export function usePendingRewardReviews(familyId: number | undefined) {
  return useQuery({
    queryKey: [api.reviews.rewardPending.path, familyId],
    queryFn: async () => {
      if (!familyId) throw new Error("No family id provided");
      const res = await apiFetch(buildUrl(api.reviews.rewardPending.path, { id: familyId }));
      if (!res.ok) throw new Error("Failed to fetch pending reward reviews");
      return api.reviews.rewardPending.responses[200].parse(await res.json());
    },
    enabled: !!familyId,
  });
}

export function useReviewChore(familyId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      note,
    }: {
      id: number;
      action: "approve" | "reject" | "undo" | "cancel";
      note?: string;
    }) => {
      const res = await apiFetch(buildUrl(api.reviews.reviewChore.path, { id }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) throw new Error("Failed to review chore");
      return api.reviews.reviewChore.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      if (!familyId) return;
      queryClient.invalidateQueries({ queryKey: [api.reviews.chorePending.path, familyId] });
      queryClient.invalidateQueries({ queryKey: [api.families.getChores.path, familyId] });
      queryClient.invalidateQueries({ queryKey: [api.families.getUsers.path, familyId] });
      queryClient.invalidateQueries({ queryKey: [api.families.getActivity.path, familyId] });
    },
  });
}

export function useReviewReward(familyId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      note,
    }: {
      id: number;
      action: "approve" | "reject" | "undo" | "cancel";
      note?: string;
    }) => {
      const res = await apiFetch(buildUrl(api.reviews.reviewReward.path, { id }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) throw new Error("Failed to review reward");
      return api.reviews.reviewReward.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      if (!familyId) return;
      queryClient.invalidateQueries({ queryKey: [api.reviews.rewardPending.path, familyId] });
      queryClient.invalidateQueries({ queryKey: [api.families.getUsers.path, familyId] });
      queryClient.invalidateQueries({ queryKey: [api.rewards.list.path, familyId] });
      queryClient.invalidateQueries({ queryKey: [api.families.getActivity.path, familyId] });
    },
  });
}
