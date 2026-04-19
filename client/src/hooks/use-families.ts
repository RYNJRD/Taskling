import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "../../../shared/routes";
import { apiFetch } from "../lib/apiFetch";

export function useFamily(id: number | undefined) {
  return useQuery({
    queryKey: [api.families.get.path, id],
    queryFn: async () => {
      if (!id) throw new Error("No id provided");
      const url = buildUrl(api.families.get.path, { id });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch family");
      return api.families.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useFamilyUsers(id: number | undefined) {
  return useQuery({
    queryKey: [api.families.getUsers.path, id],
    queryFn: async () => {
      if (!id) throw new Error("No id provided");
      const url = buildUrl(api.families.getUsers.path, { id });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch family users");
      return api.families.getUsers.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useFamilyChores(id: number | undefined) {
  return useQuery({
    queryKey: [api.families.getChores.path, id],
    queryFn: async () => {
      if (!id) throw new Error("No id provided");
      const url = buildUrl(api.families.getChores.path, { id });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch family chores");
      return api.families.getChores.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useFamilyLeaderboard(id: number | undefined) {
  return useQuery({
    queryKey: [api.families.getLeaderboard.path, id],
    queryFn: async () => {
      if (!id) throw new Error("No id provided");
      const url = buildUrl(api.families.getLeaderboard.path, { id });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return api.families.getLeaderboard.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useDemoSetup() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch(api.demo.setup.path, {
        method: api.demo.setup.method,
      });
      if (!res.ok) throw new Error("Failed to setup demo");
      return api.demo.setup.responses[201].parse(await res.json());
    },
  });
}

export function useFamilyActivity(id: number | undefined) {
  return useQuery({
    queryKey: [api.families.getActivity.path, id],
    queryFn: async () => {
      if (!id) throw new Error("No id provided");
      const url = buildUrl(api.families.getActivity.path, { id });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch activity");
      return api.families.getActivity.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useFamilyAchievements(id: number | undefined) {
  return useQuery({
    queryKey: [api.families.getAchievements.path, id],
    queryFn: async () => {
      if (!id) throw new Error("No id provided");
      const url = buildUrl(api.families.getAchievements.path, { id });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return api.families.getAchievements.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useFamilyMonthlyWinners(id: number | undefined) {
  return useQuery({
    queryKey: [api.families.getMonthlyWinners.path, id],
    queryFn: async () => {
      if (!id) throw new Error("No id provided");
      const url = buildUrl(api.families.getMonthlyWinners.path, { id });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch monthly winners");
      return api.families.getMonthlyWinners.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useFamilyOnboarding(id: number | undefined) {
  return useQuery({
    queryKey: [api.families.getOnboarding.path, id],
    queryFn: async () => {
      if (!id) throw new Error("No id provided");
      const url = buildUrl(api.families.getOnboarding.path, { id });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch onboarding");
      return api.families.getOnboarding.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
