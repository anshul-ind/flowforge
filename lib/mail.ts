import nodemailer from 'nodemailer'

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      user && pass
        ? {
            user,
            pass,
          }
        : undefined,
  })
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT)
}

export async function sendInviteEmail(
  to: string,
  inviteUrl: string,
  workspaceName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const transporter = getTransporter()
  if (!transporter) {
    return {
      ok: false,
      error: 'SMTP is not configured (SMTP_HOST / SMTP_PORT)',
    }
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@localhost'

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `You're invited to join ${workspaceName}`,
      text: `You have been invited to join ${workspaceName}.\n\nOpen this link to accept:\n${inviteUrl}`,
      html: `
        <p>You have been invited to join <strong>${escapeHtml(workspaceName)}</strong>.</p>
        <p><a href="${escapeHtml(inviteUrl)}">Accept invitation</a></p>
      `,
    })
    return { ok: true }
  } catch (e) {
    console.error('[sendInviteEmail]', e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to send email',
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
