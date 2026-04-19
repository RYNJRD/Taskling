import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useStore } from "@/store/useStore";

let authResolved = false;
let authReadyPromise: Promise<void> | null = null;

function waitForAuthInitialization(): Promise<void> {
  if (authResolved) return Promise.resolve();
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      authResolved = true;
      unsubscribe();
      resolve();
    });
  });

  return authReadyPromise;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  await waitForAuthInitialization();

  const headers = new Headers(init.headers || {});
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      headers.set("Authorization", `Bearer ${token}`);
    } catch (err) {
      console.warn("[apiFetch] Failed to get ID token:", err);
    }
  } else {
    const { currentUser } = useStore.getState();
    if (currentUser?.id && !currentUser.firebaseUid) {
      headers.set("X-Demo-User-Id", String(currentUser.id));
    }
  }

  const resolvedUrl = typeof input === "string" && input.startsWith("/") 
    ? `${window.location.origin}${input}` 
    : String(input);

  console.log(`[apiFetch] Origin: ${window.location.origin}`);
  console.log(`[apiFetch] Calling: ${resolvedUrl}`);
  
  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  }).catch(err => {
    console.error(`[apiFetch] Network error for ${resolvedUrl}:`, err);
    throw err;
  });
}
