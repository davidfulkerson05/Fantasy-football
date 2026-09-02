import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getLeaguePaidRecord } from "@/lib/db";
import { checkoutRatelimit, clientIp } from "@/lib/ratelimit";
import { FOUNDING_PRICE_CENTS, CURRENCY } from "@/lib/pricing";

// POST { leagueId, leagueName, email? } -> { url } to redirect to Stripe Checkout.
export async function POST(req: NextRequest) {
  const { success } = await checkoutRatelimit.limit(clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests, try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const leagueId = body?.leagueId as string | undefined;
  const leagueName = body?.leagueName as string | undefined;
  const email = body?.email as string | undefined;

  if (!leagueId || !leagueName) {
    return NextResponse.json({ error: "leagueId and leagueName are required" }, { status: 400 });
  }

  const existing = await getLeaguePaidRecord(leagueId);
  if (existing) {
    return NextResponse.json(
      {
        error:
          "This league already has a season pass. Check your email for the access link, or contact us to resend it.",
      },
      { status: 409 }
    );
  }

  const origin = new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: CURRENCY,
          unit_amount: FOUNDING_PRICE_CENTS,
          product_data: {
            name: `The Guillotine — Season Pass (${leagueName})`,
            description: "Unlimited weekly recap messages for this league, for the season.",
          },
        },
        quantity: 1,
      },
    ],
    metadata: { leagueId, leagueName },
    customer_email: email || undefined,
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
  });

  return NextResponse.json({ url: session.url });
}
