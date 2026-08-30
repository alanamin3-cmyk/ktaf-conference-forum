export type RegistrationEmailInput = {
  fullName: string;
  position: string;
  city: string;
  phoneNumber: string;
  email: string;
  registrationCode: string;
  siteUrl?: string;
  year?: number;
};

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function detailRow(label: string, value: string, isLast = false) {
  return `<tr>
    <td style="${isLast ? "" : "border-bottom:1px solid #E6E9EF;"}padding:14px 0;color:#5F7182;font-family:Montserrat,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;vertical-align:top;width:38%;">${escapeHtml(label)}</td>
    <td style="${isLast ? "" : "border-bottom:1px solid #E6E9EF;"}padding:14px 0 14px 16px;color:#0D2B45;font-family:Montserrat,Arial,sans-serif;font-size:14px;font-weight:600;line-height:21px;vertical-align:top;word-break:break-word;">${escapeHtml(value)}</td>
  </tr>`;
}

export function renderRegistrationConfirmationEmail(input: RegistrationEmailInput) {
  const siteUrl = String(input.siteUrl || "https://ktaf.krd").replace(/\/+$/, "");
  const year = input.year || new Date().getFullYear();
  const details = [
    ["Full name", input.fullName],
    ["Position", input.position],
    ["City", input.city],
    ["Phone number", input.phoneNumber],
    ["Email address", input.email],
    ["Registration reference", input.registrationCode],
  ];
  const rows = details
    .map(([label, value], index) => detailRow(label, value, index === details.length - 1))
    .join("");

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Registration confirmed — KTAF</title>
  <style>
    body{margin:0!important;padding:0!important;width:100%!important;background:#F3F6FA}table{border-collapse:collapse;border-spacing:0}img{border:0;display:block;height:auto;line-height:100%;outline:none}.preheader{display:none!important;max-height:0;max-width:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all}
    @media only screen and (max-width:660px){.email-shell{width:100%!important}.mobile-pad{padding-left:24px!important;padding-right:24px!important}.hero-title{font-size:28px!important;line-height:34px!important}.body-copy{font-size:15px!important;line-height:25px!important}.detail-label{display:block!important;width:100%!important;padding-bottom:2px!important;border-bottom:0!important}.detail-value{display:block!important;width:100%!important;padding:0 0 13px!important}}
  </style>
</head>
<body>
  <div class="preheader">Your place at the Kurdistan Thrombosis &amp; Anticoagulation Forum — KTAF has been reserved.</div>
  <table role="presentation" width="100%" style="width:100%;background:#F3F6FA"><tr><td align="center" style="padding:28px 12px">
    <table role="presentation" class="email-shell" width="640" style="width:640px;max-width:640px;background:#FFFFFF;border:1px solid #E6E9EF;border-radius:18px;overflow:hidden">
      <tr><td><img src="${siteUrl}/brand/email/ktaf_registration-confirmation_banner_en_1200x400_v01.png" width="640" alt="Kurdistan Thrombosis &amp; Anticoagulation Forum — KTAF. Registration confirmation." style="width:100%;max-width:640px;height:auto"></td></tr>
      <tr><td class="mobile-pad" style="padding:42px 48px 18px">
        <p style="margin:0 0 16px;color:#1E63B6;font-family:Montserrat,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase"><span style="color:#E63946">●</span>&nbsp;&nbsp;Registration confirmed</p>
        <h1 class="hero-title" style="margin:0 0 18px;color:#0D2B45;font-family:Montserrat,Arial,sans-serif;font-size:34px;font-weight:700;line-height:41px">Your place has been reserved.</h1>
        <p class="body-copy" style="margin:0 0 14px;color:#0D2B45;font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:600;line-height:27px">Dear ${escapeHtml(input.fullName)},</p>
        <p class="body-copy" style="margin:0;color:#5F7182;font-family:Montserrat,Arial,sans-serif;font-size:16px;line-height:27px">Thank you for registering for the <strong style="color:#0D2B45">Kurdistan Thrombosis &amp; Anticoagulation Forum — KTAF</strong>. We have received your registration and reserved your place.</p>
      </td></tr>
      <tr><td class="mobile-pad" style="padding:20px 48px 14px"><table role="presentation" width="100%" style="background:#F8FAFC;border:1px solid #E6E9EF;border-radius:14px"><tr><td style="padding:22px 24px 8px"><p style="margin:0;color:#0D2B45;font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Registration details</p></td></tr><tr><td style="padding:0 24px 12px"><table role="presentation" width="100%">${rows}</table></td></tr></table></td></tr>
      <tr><td class="mobile-pad" align="center" style="padding:18px 48px 14px"><table role="presentation" width="100%" style="background:#FFFFFF;border:2px solid #D9E5F0;border-radius:16px"><tr><td align="center" style="padding:25px 24px 10px"><p style="margin:0 0 8px;color:#1E63B6;font-family:Montserrat,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Your personal check-in pass</p><h2 style="margin:0;color:#0D2B45;font-family:Montserrat,Arial,sans-serif;font-size:21px;line-height:28px">Present this QR code at the registration desk</h2></td></tr><tr><td align="center" style="padding:8px 24px"><img src="cid:ktaf-registration-qr" width="220" height="220" alt="KTAF check-in QR code for ${escapeHtml(input.fullName)}" style="width:220px;max-width:100%;height:auto"></td></tr><tr><td align="center" style="padding:9px 24px 25px"><p style="margin:0 0 5px;color:#5F7182;font-family:Montserrat,Arial,sans-serif;font-size:12px;line-height:19px">Keep this email available on your phone. The code is unique to your registration.</p><p style="margin:0;color:#0D2B45;font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px">${escapeHtml(input.registrationCode)}</p></td></tr></table></td></tr>
      <tr><td class="mobile-pad" style="padding:22px 48px 40px"><p style="margin:0 0 22px;color:#5F7182;font-family:Montserrat,Arial,sans-serif;font-size:15px;line-height:25px">Conference updates, including confirmed programme, date, and venue information, will be published on the official KTAF website.</p><a href="${siteUrl}/" style="display:inline-block;border-radius:999px;background:#0D2B45;padding:14px 25px;color:#FFFFFF;font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none">Visit the KTAF website&nbsp;&nbsp;→</a></td></tr>
      <tr><td class="mobile-pad" style="padding:28px 48px;background:#0D2B45;border-top:4px solid #E63946"><p style="margin:0 0 8px;color:#FFFFFF;font-family:Montserrat,Arial,sans-serif;font-size:14px;font-weight:700">Advancing Science. Improving Outcomes.</p><p style="margin:0 0 18px;color:#C9D9E7;font-family:Montserrat,Arial,sans-serif;font-size:12px;line-height:20px">Questions? Reply to this email or contact <a href="mailto:registration@ktaf.krd" style="color:#FFFFFF;font-weight:700">registration@ktaf.krd</a>.</p><p style="margin:0;color:#9FB6C9;font-family:Montserrat,Arial,sans-serif;font-size:10px;line-height:17px">Kurdistan Thrombosis &amp; Anticoagulation Forum — KTAF<br>Denk Pharma — Exclusive sponsor&nbsp;&nbsp;•&nbsp;&nbsp;© ${year} KTAF</p></td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

export function renderRegistrationConfirmationText(input: RegistrationEmailInput) {
  return `REGISTRATION CONFIRMED — KTAF

Dear ${input.fullName},

Thank you for registering for the Kurdistan Thrombosis & Anticoagulation Forum — KTAF. We have received your registration and reserved your place.

REGISTRATION DETAILS
Full name: ${input.fullName}
Position: ${input.position}
City: ${input.city}
Phone number: ${input.phoneNumber}
Email address: ${input.email}
Registration reference: ${input.registrationCode}

YOUR CHECK-IN QR PASS
The QR code is attached to this email and displayed in the HTML version. Keep this email available on your phone and present the QR code at the KTAF registration desk.

Conference updates will be published at ${input.siteUrl || "https://ktaf.krd"}/

Questions? Reply to this email or contact registration@ktaf.krd.

Advancing Science. Improving Outcomes.
Denk Pharma — Exclusive sponsor`;
}
