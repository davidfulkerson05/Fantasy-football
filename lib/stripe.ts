import Stripe from "stripe";

// Lazy singleton: constructing Stripe() validates the API key immediately,
// which breaks the build when the key isn't set yet (Next.js imports route
// modules at build time to analyze them, before any env vars are needed).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }
  return _stripe;
}
