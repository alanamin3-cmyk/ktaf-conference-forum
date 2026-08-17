const DEFAULT_SITE_URL = "https://ktaf.krd";

export const registrationEmailDefaults = Object.freeze({
  subject: "Registration confirmed — KTAF",
  from: "KTAF Registration <registration@ktaf.krd>",
  replyTo: "registration@ktaf.krd",
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function requireText(value, fieldName) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    throw new TypeError(`${fieldName} is required.`);
  }
  return normalized;
}

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

function detailRow(label, value, isLast = false) {
  const border = isLast ? "" : "border-bottom:1px solid #E6E9EF;";
  return `
    <tr>
      <td class="detail-label" style="${border}padding:14px 0 14px 0;color:#5F7182;font-family:Montserrat,Arial,sans-serif;font-size:12px;font-weight:700;line-height:18px;letter-spacing:1.1px;text-transform:uppercase;vertical-align:top;width:38%;">${escapeHtml(label)}</td>
      <td class="detail-value" style="${border}padding:14px 0 14px 16px;color:#0D2B45;font-family:Montserrat,Arial,sans-serif;font-size:14px;font-weight:600;line-height:21px;vertical-align:top;word-break:break-word;">${escapeHtml(value)}</td>
    </tr>`;
}

export function renderRegistrationConfirmationEmail(input = {}) {
  const fullName = requireText(input.fullName, "fullName");
  const position = requireText(input.position, "position");
  const city = requireText(input.city, "city");
  const email = requireText(input.email, "email");
  const registrationId = String(input.registrationId ?? "").trim();
  const siteUrl = normalizeBaseUrl(input.siteUrl);
  const assetBaseUrl = normalizeBaseUrl(input.assetBaseUrl || siteUrl);
  const bannerUrl = `${assetBaseUrl}/brand/email/ktaf_registration-confirmation_banner_en_1200x400_v01.png`;
  const year = Number.isInteger(input.year) ? input.year : new Date().getFullYear();

  const details = [
    ["Full name", fullName],
    ["Position", position],
    ["City", city],
    ["Email address", email],
  ];
  if (registrationId) details.push(["Registration reference", registrationId]);

  const detailRows = details
    .map(([label, value], index) => detailRow(label, value, index === details.length - 1))
    .join("");

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${registrationEmailDefaults.subject}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>table,td,p,a,h1,h2{font-family:Arial,sans-serif !important;}</style>
  <![endif]-->
  <style>
    body { margin:0 !important; padding:0 !important; width:100% !important; background:#F3F6FA; }
    table { border-collapse:collapse; border-spacing:0; }
    img { border:0; display:block; height:auto; line-height:100%; outline:none; text-decoration:none; }
    a { color:#1E63B6; }
    .preheader { display:none !important; max-height:0; max-width:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all; }
    @media only screen and (max-width:660px) {
      .email-shell { width:100% !important; }
      .mobile-pad { padding-left:24px !important; padding-right:24px !important; }
      .hero-title { font-size:28px !important; line-height:34px !important; }
      .body-copy { font-size:15px !important; line-height:25px !important; }
      .detail-label { display:block !important; width:100% !important; padding-bottom:2px !important; border-bottom:0 !important; }
      .detail-value { display:block !important; width:100% !important; padding:0 0 13px 0 !important; }
      .button-link { display:block !important; }
    }
  </style>
</head>
<body>
  <div class="preheader">Your place at the Kurdistan Thrombosis &amp; Anticoagulation Forum — KTAF has been reserved.</div>
  <table role="presentation" width="100%" style="width:100%;background:#F3F6FA;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" class="email-shell" width="640" style="width:640px;max-width:640px;background:#FFFFFF;border:1px solid #E6E9EF;border-radius:18px;box-shadow:0 12px 36px rgba(13,43,69,0.08);overflow:hidden;">
          <tr>
            <td style="padding:0;background:#FFFFFF;">
              <img src="${escapeHtml(bannerUrl)}" width="640" alt="Kurdistan Thrombosis &amp; Anticoagulation Forum — KTAF. Registration confirmation." style="width:100%;max-width:640px;height:auto;">
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" style="padding:42px 48px 18px 48px;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="padding:0 0 16px 0;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:8px;background:#E63946;vertical-align:middle;"></span>
                    <span style="display:inline-block;margin-left:8px;color:#1E63B6;font-family:Montserrat,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.8px;line-height:18px;text-transform:uppercase;vertical-align:middle;">Registration confirmed</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h1 class="hero-title" style="margin:0 0 18px 0;color:#0D2B45;font-family:Montserrat,Arial,sans-serif;font-size:34px;font-weight:700;letter-spacing:-0.7px;line-height:41px;">Your place has been reserved.</h1>
                    <p class="body-copy" style="margin:0 0 14px 0;color:#0D2B45;font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:600;line-height:27px;">Dear ${escapeHtml(fullName)},</p>
                    <p class="body-copy" style="margin:0;color:#5F7182;font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:400;line-height:27px;">Thank you for registering for the <strong style="color:#0D2B45;font-weight:700;">Kurdistan Thrombosis &amp; Anticoagulation Forum — KTAF</strong>. We have received your registration and reserved your place.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" style="padding:20px 48px 14px 48px;">
              <table role="presentation" width="100%" style="width:100%;background:#F8FAFC;border:1px solid #E6E9EF;border-radius:14px;">
                <tr>
                  <td style="padding:22px 24px 8px 24px;">
                    <p style="margin:0;color:#0D2B45;font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;line-height:20px;text-transform:uppercase;">Registration details</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 12px 24px;">
                    <table role="presentation" width="100%">${detailRows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" style="padding:22px 48px 40px 48px;">
              <p class="body-copy" style="margin:0 0 22px 0;color:#5F7182;font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:400;line-height:25px;">Conference updates, including confirmed programme, date, and venue information, will be published on the official KTAF website.</p>
              <table role="presentation" width="100%">
                <tr>
                  <td align="left" bgcolor="#0D2B45" style="border-radius:999px;">
                    <a class="button-link" href="${escapeHtml(siteUrl)}/" style="display:inline-block;padding:14px 25px;color:#FFFFFF;font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.5px;line-height:20px;text-align:center;text-decoration:none;">Visit the KTAF website&nbsp;&nbsp;→</a>
                  </td>
                  <td width="40%"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" style="padding:28px 48px;background:#0D2B45;border-top:4px solid #E63946;">
              <p style="margin:0 0 8px 0;color:#FFFFFF;font-family:Montserrat,Arial,sans-serif;font-size:14px;font-weight:700;line-height:22px;">Advancing Science. Improving Outcomes.</p>
              <p style="margin:0 0 18px 0;color:#C9D9E7;font-family:Montserrat,Arial,sans-serif;font-size:12px;font-weight:400;line-height:20px;">Questions? Reply to this email or contact <a href="mailto:registration@ktaf.krd" style="color:#FFFFFF;font-weight:700;text-decoration:underline;">registration@ktaf.krd</a>.</p>
              <table role="presentation" width="100%">
                <tr>
                  <td style="color:#9FB6C9;font-family:Montserrat,Arial,sans-serif;font-size:10px;font-weight:500;letter-spacing:0.7px;line-height:17px;text-transform:uppercase;">Kurdistan Thrombosis &amp; Anticoagulation Forum — KTAF</td>
                </tr>
                <tr>
                  <td style="padding-top:8px;color:#9FB6C9;font-family:Montserrat,Arial,sans-serif;font-size:10px;font-weight:400;line-height:17px;">Denk Pharma — Exclusive sponsor&nbsp;&nbsp;•&nbsp;&nbsp;© ${year} KTAF</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderRegistrationConfirmationText(input = {}) {
  const fullName = requireText(input.fullName, "fullName");
  const position = requireText(input.position, "position");
  const city = requireText(input.city, "city");
  const email = requireText(input.email, "email");
  const registrationId = String(input.registrationId ?? "").trim();
  const siteUrl = normalizeBaseUrl(input.siteUrl);
  const referenceLine = registrationId
    ? `\nRegistration reference: ${registrationId}`
    : "";

  return `REGISTRATION CONFIRMED — KTAF

Dear ${fullName},

Thank you for registering for the Kurdistan Thrombosis & Anticoagulation Forum — KTAF. We have received your registration and reserved your place.

REGISTRATION DETAILS
Full name: ${fullName}
Position: ${position}
City: ${city}
Email address: ${email}${referenceLine}

Conference updates, including confirmed programme, date, and venue information, will be published at:
${siteUrl}/

Questions? Reply to this email or contact registration@ktaf.krd.

Advancing Science. Improving Outcomes.
Kurdistan Thrombosis & Anticoagulation Forum — KTAF
Denk Pharma — Exclusive sponsor`;
}
