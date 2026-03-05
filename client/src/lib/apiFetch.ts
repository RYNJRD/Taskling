import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

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
    const token = await user.getIdToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}

