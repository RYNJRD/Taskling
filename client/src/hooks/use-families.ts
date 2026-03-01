import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateFamilyRequest } from "@shared/routes";

export function useFamily(id: number | undefined) {
  return useQuery({
    queryKey: [api.families.get.path, id],
    queryFn: async () => {
      if (!id) throw new Error("No id provided");
      const url = buildUrl(api.families.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
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
      const res = await fetch(url, { credentials: "include" });
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
      const res = await fetch(url, { credentials: "include" });
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
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return api.families.getLeaderboard.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useDemoSetup() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.demo.setup.path, {
        method: api.demo.setup.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to setup demo");
      return api.demo.setup.responses[201].parse(await res.json());
    },
  });
}
