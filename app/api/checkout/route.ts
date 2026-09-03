import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getLeaguePaidRecord } from "@/lib/db";
import { checkoutRatelimit, clientIp, safeLimit } from "@/lib/ratelimit";
import { FOUNDING_PRICE_CENTS, CURRENCY } from "@/lib/pricing";
import { getLeague } from "@/lib/sleeper";

// POST { leagueId, leagueName, email? } -> { url } to redirect to Stripe Checkout.
export async function POST(req: NextRequest) {
  const success = await safeLimit(checkoutRatelimit, clientIp(req));
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

  // Determined once, up front, so every downstream surface (email, success
  // page, the generator itself) can just read a stored flag instead of
  // re-deriving the league's format from Sleeper each time.
  const league = await getLeague(leagueId);
  const isElimination = league.settings?.type === 3;
  const productName = isElimination
    ? `The Guillotine — Season Pass (${leagueName})`
    : `League Update — Season Pass (${leagueName})`;

  const origin = new URL(req.url).origin;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: CURRENCY,
          unit_amount: FOUNDING_PRICE_CENTS,
          product_data: {
            name: productName,
            description: "Unlimited weekly recap messages for this league, for the season.",
          },
        },
        quantity: 1,
      },
    ],
    metadata: { leagueId, leagueName, isElimination: String(isElimination) },
    customer_email: email || undefined,
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
  });

  return NextResponse.json({ url: session.url });
}
