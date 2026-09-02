import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY as string);

// Uses Resend's shared onboarding sender so this works with just an API
// key — no domain verification needed to launch. Swap the `from` address
// once a custom domain is verified in the Resend dashboard.
const FROM = "The Guillotine <onboarding@resend.dev>";

export async function sendAccessEmail(email: string, leagueName: string, link: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your Guillotine access link — ${leagueName}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin-bottom: 4px;">The Guillotine has claimed your payment.</h2>
        <p style="color: #555;">Your season pass for <strong>${leagueName}</strong> is active. Use this link every week to generate that week's recap:</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background:#8a1c1c; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none; display:inline-block;">Open The Guillotine</a>
        </p>
        <p style="color: #888; font-size: 13px;">Bookmark this link or keep this email — it's the only way back in.</p>
        <p style="color: #888; font-size: 12px; word-break: break-all;">${link}</p>
      </div>
    `,
  });
}
