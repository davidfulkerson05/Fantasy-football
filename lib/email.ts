import { Resend } from "resend";

// Lazy singleton — same reason as lib/stripe.ts: constructing Resend()
// validates the API key immediately, which breaks the build before the
// key is even needed.
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY as string);
  }
  return _resend;
}

// Uses Resend's shared onboarding sender so this works with just an API
// key — no domain verification needed to launch. Swap the `from` address
// once a custom domain is verified in the Resend dashboard. The sender
// identity stays the product name (League Update) regardless of which
// voice (League Update or The Guillotine) actually generated the recap.
const FROM = "League Update <onboarding@resend.dev>";

export async function sendAccessEmail(
  email: string,
  leagueName: string,
  link: string,
  isElimination: boolean
) {
  const voiceName = isElimination ? "The Guillotine" : "League Update";
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Your ${voiceName} access link — ${leagueName}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin-bottom: 4px;">${voiceName} is ready for ${leagueName}.</h2>
        <p style="color: #555;">Your season pass for <strong>${leagueName}</strong> is active. Use this link every week to generate that week's recap:</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background:#c2410c; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none; display:inline-block;">Open ${voiceName}</a>
        </p>
        <p style="color: #888; font-size: 13px;">Bookmark this link or keep this email — it's the only way back in.</p>
        <p style="color: #888; font-size: 12px; word-break: break-all;">${link}</p>
      </div>
    `,
  });
}
