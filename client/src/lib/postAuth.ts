import type { Family, User } from "@shared/schema";
import { apiFetch } from "@/lib/apiFetch";

type PostAuthArgs = {
  uid: string;
  onboardingIntent: "create" | "join" | null;
  setFirebaseUid: (uid: string | null) => void;
  setFamily: (family: Family) => void;
  setCurrentUser: (user: User) => void;
  setLocation: (path: string) => void;
};

export async function handlePostAuthNavigation({
  uid,
  onboardingIntent,
  setFirebaseUid,
  setFamily,
  setCurrentUser,
  setLocation,
}: PostAuthArgs) {
  setFirebaseUid(uid);

  try {
    const res = await apiFetch(`/api/users/firebase/${uid}`);
    if (res.ok) {
      try {
        const user = await res.json();
        setCurrentUser(user);
        if (user.familyId) {
          const famRes = await apiFetch(`/api/families/${user.familyId}`);
          if (famRes.ok) {
            try {
              const family = await famRes.json();
              setFamily(family);
              setLocation(`/family/${family.id}/dashboard`);
              return;
            } catch {
              console.warn("[PostAuth] Failed to parse family JSON");
            }
          }
        }
      } catch {
        console.warn("[PostAuth] Failed to parse user JSON");
      }
    }
  } catch {}

  if (onboardingIntent === "create") setLocation("/setup-family");
  else if (onboardingIntent === "join") setLocation("/join-family");
  else setLocation("/get-started");
}

