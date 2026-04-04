import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "CreazaApp <noreply@creazaapp.com>";

// ─── HTML email wrapper ───
function wrap(title: string, body: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <span style="font-size:24px;font-weight:700;color:#fff">
      <span style="background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Creaza</span><span style="color:#fff">App</span>
    </span>
  </div>
  <div style="background:#141414;border:1px solid #262626;border-radius:16px;padding:32px">
    ${body}
  </div>
  <p style="text-align:center;color:#525252;font-size:12px;margin-top:24px">
    CreazaApp.com — Construiește aplicații web cu AI
  </p>
</div></body></html>`;
}

// ─── Welcome email ───
export async function sendWelcomeEmail(email: string, name?: string) {
  const greeting = name ? `Salut ${name}` : "Salut";
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Bine ai venit pe CreazaApp!",
    html: wrap("Bine ai venit", `
      <h1 style="color:#fff;font-size:20px;margin:0 0 16px">${greeting}! 🎉</h1>
      <p style="color:#a1a1a1;font-size:14px;line-height:1.6;margin:0 0 16px">
        Contul tău CreazaApp a fost creat cu succes. Ești gata să construiești aplicații web cu ajutorul AI.
      </p>
      <p style="color:#a1a1a1;font-size:14px;line-height:1.6;margin:0 0 24px">
        Ai primit <strong style="color:#fff">50 credite gratuite</strong> ca să începi. Intră în workspace și creează primul tău proiect!
      </p>
      <div style="text-align:center">
        <a href="https://creazaapp.com/workspace" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Începe acum
        </a>
      </div>
    `),
  });
}

// ─── Subscription activated ───
export async function sendSubscriptionEmail(email: string, planName: string, credits: number) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Abonament ${planName} activat!`,
    html: wrap("Abonament activat", `
      <h1 style="color:#fff;font-size:20px;margin:0 0 16px">Abonament ${planName} activat! ✨</h1>
      <p style="color:#a1a1a1;font-size:14px;line-height:1.6;margin:0 0 16px">
        Felicitări! Ai activat planul <strong style="color:#fff">${planName}</strong>.
      </p>
      <div style="background:#1a1a2e;border:1px solid #6366f1;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
        <p style="color:#a1a1a1;font-size:12px;margin:0 0 4px">Credite primite</p>
        <p style="color:#fff;font-size:28px;font-weight:700;margin:0">+${credits}</p>
        <p style="color:#a1a1a1;font-size:12px;margin:4px 0 0">credite/lună</p>
      </div>
      <div style="text-align:center">
        <a href="https://creazaapp.com/workspace" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Mergi la workspace
        </a>
      </div>
    `),
  });
}

// ─── Top-up purchased ───
export async function sendTopupEmail(email: string, credits: number, amount: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `+${credits} credite adăugate!`,
    html: wrap("Top-up credite", `
      <h1 style="color:#fff;font-size:20px;margin:0 0 16px">Credite adăugate! ⚡</h1>
      <p style="color:#a1a1a1;font-size:14px;line-height:1.6;margin:0 0 16px">
        Top-up-ul tău de <strong style="color:#fff">${amount}</strong> a fost procesat cu succes.
      </p>
      <div style="background:#1a2e1a;border:1px solid #22c55e;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
        <p style="color:#a1a1a1;font-size:12px;margin:0 0 4px">Credite adăugate</p>
        <p style="color:#fff;font-size:28px;font-weight:700;margin:0">+${credits}</p>
      </div>
      <div style="text-align:center">
        <a href="https://creazaapp.com/workspace" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Continuă să creezi
        </a>
      </div>
    `),
  });
}

// ─── Subscription cancelled ───
export async function sendCancelEmail(email: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Abonament anulat",
    html: wrap("Abonament anulat", `
      <h1 style="color:#fff;font-size:20px;margin:0 0 16px">Abonament anulat</h1>
      <p style="color:#a1a1a1;font-size:14px;line-height:1.6;margin:0 0 16px">
        Abonamentul tău a fost anulat. Ai trecut pe planul Gratuit cu 50 credite/lună.
      </p>
      <p style="color:#a1a1a1;font-size:14px;line-height:1.6;margin:0 0 24px">
        Creditele top-up rămân în cont. Poți reactiva oricând un abonament.
      </p>
      <div style="text-align:center">
        <a href="https://creazaapp.com/preturi" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Vezi planurile
        </a>
      </div>
    `),
  });
}

// ─── Payment failed ───
export async function sendPaymentFailedEmail(email: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Plata a eșuat — acțiune necesară",
    html: wrap("Plata a eșuat", `
      <h1 style="color:#fff;font-size:20px;margin:0 0 16px">Plata a eșuat ⚠️</h1>
      <p style="color:#a1a1a1;font-size:14px;line-height:1.6;margin:0 0 16px">
        Nu am putut procesa ultima plată. Verifică metoda de plată și încearcă din nou.
      </p>
      <p style="color:#a1a1a1;font-size:14px;line-height:1.6;margin:0 0 24px">
        Dacă plata nu este realizată în 3 zile, abonamentul va fi suspendat automat.
      </p>
      <div style="text-align:center">
        <a href="https://creazaapp.com/cont" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Actualizează plata
        </a>
      </div>
    `),
  });
}
