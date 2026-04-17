import { describe, expect, it, vi, beforeEach } from "vitest";
import { handlePostAuthNavigation } from "@/lib/postAuth";

const apiFetchMock = vi.fn();

vi.mock("@/lib/apiFetch", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

describe("handlePostAuthNavigation", () => {
  const setFirebaseUid = vi.fn();
  const setFamily = vi.fn();
  const setCurrentUser = vi.fn();
  const setLocation = vi.fn();

  beforeEach(() => {
    apiFetchMock.mockReset();
    setFirebaseUid.mockReset();
    setFamily.mockReset();
    setCurrentUser.mockReset();
    setLocation.mockReset();
  });

  it("routes an existing user with a family to the dashboard", async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 7, familyId: 3, firebaseUid: "uid-1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 3, name: "The Test Family" }),
      });

    await handlePostAuthNavigation({
      uid: "uid-1",
      onboardingIntent: null,
      setFirebaseUid,
      setFamily,
      setCurrentUser,
      setLocation,
    });

    expect(setFirebaseUid).toHaveBeenCalledWith("uid-1");
    expect(setCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
    expect(setFamily).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }));
    expect(setLocation).toHaveBeenCalledWith("/family/3/dashboard");
  });

  it("falls back to family creation when no profile exists and intent is create", async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    await handlePostAuthNavigation({
      uid: "uid-2",
      onboardingIntent: "create",
      setFirebaseUid,
      setFamily,
      setCurrentUser,
      setLocation,
    });

    expect(setLocation).toHaveBeenCalledWith("/setup-family");
  });
});
