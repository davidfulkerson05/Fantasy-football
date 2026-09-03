// Guarded wrapper around the Meta Pixel's global fbq() — no-ops if the
// Pixel script never loaded (NEXT_PUBLIC_META_PIXEL_ID unset), same "fail
// open, don't break the page over an unconfigured external service"
// pattern used elsewhere in this codebase (lib/ratelimit.ts's safeLimit).
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPurchase() {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "Purchase", { value: 9.99, currency: "USD" });
  }
}
