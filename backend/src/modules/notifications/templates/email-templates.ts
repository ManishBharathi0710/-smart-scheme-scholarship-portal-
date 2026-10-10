import { NotificationDto } from '../notifications.types.js';

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export function renderEmailNotification(
  notification: NotificationDto,
  recipientEmail: string,
  frontendUrl: string,
): RenderedEmail {
  const preferencesUrl = `${frontendUrl}/settings/notifications`;
  const actionUrl = notification.actionUrl
    ? notification.actionUrl.startsWith('http')
      ? notification.actionUrl
      : `${frontendUrl}${notification.actionUrl}`
    : `${frontendUrl}/notifications`;

  const subject = `[Smart Scheme Portal] ${notification.title}`;

  const text = `
Dear Citizen,

${notification.title}

${notification.message}

View details: ${actionUrl}

---
Manage your notification preferences or unsubscribe: ${preferencesUrl}
This is an automated notification from the Smart Scheme & Scholarship Recommendation Portal.
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background-color: #0f172a; padding: 20px 24px; color: #f8fafc; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px; }
    .badge-info { background-color: #3b82f6; color: #ffffff; }
    .badge-important { background-color: #f59e0b; color: #000000; }
    .badge-warning { background-color: #ef4444; color: #ffffff; }
    .content { padding: 24px; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
    .message { font-size: 15px; color: #334155; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #1e3a8a; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; }
    .footer { border-top: 1px solid #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; background-color: #f8fafc; }
    .footer a { color: #1e3a8a; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div style="font-size: 13px; font-weight: 600; color: #fbbf24;">SMART SCHEME &amp; SCHOLARSHIP PORTAL</div>
      <div style="font-size: 12px; color: #94a3b8;">Official Citizen Decision Support System</div>
    </div>
    <div class="content">
      <span class="badge badge-${notification.severity.toLowerCase()}">${notification.severity}</span>
      <h2 class="title">${notification.title}</h2>
      <p class="message">${notification.message}</p>
      <div>
        <a href="${actionUrl}" class="btn" target="_blank" rel="noopener noreferrer">View in Portal</a>
      </div>
    </div>
    <div class="footer">
      <p>You received this email for ${recipientEmail} according to your portal settings.</p>
      <p><a href="${preferencesUrl}">Manage notification preferences</a> &bull; Official Govt welfare information</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}
