import type { ActionCodeSettings } from "firebase/auth";

export function getEmailVerificationActionSettings(email?: string): ActionCodeSettings {
  const url = new URL("/email-action", window.location.origin);
  if (email) {
    url.searchParams.set("email", email);
    url.searchParams.set("mode", "signin");
  }

  return {
    url: url.toString(),
    handleCodeInApp: true,
  };
}
