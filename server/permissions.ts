import type { User } from "@shared/schema";

export function isAdmin(user: Pick<User, "role"> | null | undefined): boolean {
  return user?.role === "admin";
}

export function canManageFamily(user: Pick<User, "role"> | null | undefined): boolean {
  return isAdmin(user);
}

export function canApprove(user: Pick<User, "role"> | null | undefined): boolean {
  return isAdmin(user);
}

export function ensureSameFamily(
  currentFamilyId: number | null | undefined,
  targetFamilyId: number | null | undefined,
): boolean {
  return !!currentFamilyId && !!targetFamilyId && currentFamilyId === targetFamilyId;
}
