import type { ActionCodeSettings } from "firebase/auth";

export function getEmailVerificationActionSettings(): ActionCodeSettings {
  return {
    url: `${window.location.origin}/email-action`,
  };
}

