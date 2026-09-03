import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { saveAccessGrant } from "@/lib/db";
import { sendAccessEmail } from "@/lib/email";
import { nanoid } from "nanoid";

// Stripe sends the raw body here — must NOT be parsed as JSON before
// verifying the signature, or verification fails.
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const leagueId = session.metadata?.leagueId;
    const leagueName = session.metadata?.leagueName;
    const isElimination = session.metadata?.isElimination === "true";
    const email = session.customer_details?.email || session.customer_email;

    if (leagueId && leagueName && email) {
      const token = nanoid(24);
      await saveAccessGrant({ leagueId, leagueName, email, token, isElimination });

      const origin = new URL(req.url).origin;
      const link = `${origin}/app?token=${token}`;
      try {
        await sendAccessEmail(email, leagueName, link, isElimination);
      } catch (err) {
        // Don't fail the webhook over a flaky email send — the success
        // page still grants access via /api/verify-session either way.
        console.error("Failed to send access email", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
