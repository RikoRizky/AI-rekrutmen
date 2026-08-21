import nodemailer from 'nodemailer';

/**
 * Email Service Helper (Nodemailer Gmail SMTP & Resend Support)
 */

export interface SendCompanyInvitationEmailParams {
  toEmail: string;
  contactName: string;
  packageName: string;
  registrationUrl: string;
}

export interface SendApplicantStatusNotificationParams {
  toEmail: string;
  applicantName: string;
  jobTitle: string;
  companyName: string;
  status: 'screening' | 'interview' | 'accepted' | 'rejected';
  customNotes?: string;
}

function getGmailTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass && !gmailPass.includes('xxxx')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass.replace(/\s+/g, '') // Menghapus spasi jika ada di 16-digit Google App Password
      }
    });
  }
  return null;
}

export async function sendCompanyInvitationEmail({
  toEmail,
  contactName,
  packageName,
  registrationUrl
}: SendCompanyInvitationEmailParams): Promise<{ success: boolean; id?: string }> {
  const gmailTransporter = getGmailTransporter();
  const resendApiKey = process.env.RESEND_API_KEY;
  const subject = `[Aktivasi Akun] Pendaftaran Perusahaan SmartRecruit AI (${packageName})`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f17; color: #f8fafc; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background-color: #131d2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .badge { display: inline-block; background-color: #064e3b; color: #34d399; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #059669; }
          h1 { font-size: 22px; color: #ffffff; margin-top: 0; font-weight: 700; }
          p { font-size: 14px; color: #94a3b8; line-height: 1.6; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4); }
          .warning { background-color: #1e293b; border-left: 3px solid #f59e0b; padding: 12px; font-size: 12px; color: #cbd5e1; border-radius: 6px; margin-top: 20px; }
          .footer { margin-top: 24px; font-size: 11px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="badge">Pembayaran Berhasil Diterima</span>
          <h1>Selamat Datang di SmartRecruit AI!</h1>
          <p>Halo <strong>${contactName}</strong>,</p>
          <p>Terima kasih telah berlangganan paket <strong>${packageName}</strong>. Akun perusahaan Anda siap didaftarkan untuk mulai membuka lowongan kerja dan menggunakan analisis berkas kecerdasan buatan Gemini AI.</p>
          
          <div class="btn-container">
            <a href="${registrationUrl}" class="btn" target="_blank">Aktivasi & Buat Akun Perusahaan</a>
          </div>

          <div class="warning">
            <strong>PENTING:</strong> Link di atas bersifat <strong>rahasia & hanya dapat digunakan 1 kali</strong> dalam kurun waktu 24 jam. Jangan bagikan link ini kepada pihak lain.
          </div>

          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di browser Anda:<br>
            <span style="color: #10b981; word-break: break-all;">${registrationUrl}</span>
          </p>

          <div class="footer">
            &copy; ${new Date().getFullYear()} SmartRecruit AI Inc. Hak Cipta Dilindungi.
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Prioritas 1: Gunakan Nodemailer + Gmail SMTP jika kredensial diisi di .env
  if (gmailTransporter) {
    try {
      const info = await gmailTransporter.sendMail({
        from: `"SmartRecruit AI" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject,
        html: htmlContent
      });
      console.log(`[Gmail SMTP Success] Email aktivasi berhasil dikirim ke ${toEmail} (ID: ${info.messageId})`);
      return { success: true, id: info.messageId };
    } catch (err) {
      console.error('[Gmail SMTP Error] Gagal mengirim email via Gmail:', err);
    }
  }

  // 2. Prioritas 2: Gunakan Resend jika RESEND_API_KEY asli ada
  if (resendApiKey && !resendApiKey.startsWith('re_demo')) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'SmartRecruit AI <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject,
          html: htmlContent
        })
      });

      const data = await res.json();
      return { success: res.ok, id: data.id };
    } catch (err) {
      console.error('[Resend Error] Gagal mengirim email via Resend:', err);
    }
  }

  // 3. Fallback: Simulasi di konsol
  console.log(`[Email Simulation Mode] Link aktivasi untuk ${toEmail}: ${registrationUrl}`);
  return { success: true, id: `sim-${Date.now()}` };
}

export async function sendApplicantStatusNotification({
  toEmail,
  applicantName,
  jobTitle,
  companyName,
  status,
  customNotes
}: SendApplicantStatusNotificationParams): Promise<{ success: boolean }> {
  const gmailTransporter = getGmailTransporter();
  const resendApiKey = process.env.RESEND_API_KEY;

  const statusTitles: Record<string, string> = {
    screening: 'Lamaran Anda Sedang Ditinjau',
    interview: 'Undangan Tahap Wawancara',
    accepted: 'Selamat! Lamaran Anda Diterima',
    rejected: 'Pembaruan Status Lamaran'
  };

  const subject = `[${companyName}] ${statusTitles[status] || 'Update Status Lamaran'} - ${jobTitle}`;
  const htmlContent = `
    <div style="font-family: sans-serif; background-color: #0b0f17; color: #f8fafc; padding: 24px; border-radius: 12px;">
      <h2 style="color: #10b981;">Pembaruan Status Lamaran</h2>
      <p>Halo <strong>${applicantName}</strong>,</p>
      <p>Status lamaran Anda untuk posisi <strong>${jobTitle}</strong> di <strong>${companyName}</strong> saat ini telah diperbarui menjadi:</p>
      <div style="display: inline-block; padding: 8px 16px; background-color: #064e3b; color: #34d399; font-weight: bold; border-radius: 8px; margin: 12px 0;">
        ${status.toUpperCase()}
      </div>
      ${customNotes ? `<div style="background-color: #1e293b; padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 13px;"><strong style="color: #94a3b8;">Catatan HR:</strong> ${customNotes}</div>` : ''}
      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Silakan login ke portal SmartRecruit AI untuk melihat detail lebih lanjut.</p>
    </div>
  `;

  if (gmailTransporter) {
    try {
      await gmailTransporter.sendMail({
        from: `"SmartRecruit AI" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject,
        html: htmlContent
      });
      return { success: true };
    } catch (err) {
      console.error('[Gmail SMTP Error] Gagal kirim email status pelamar:', err);
    }
  }

  if (resendApiKey && !resendApiKey.startsWith('re_demo')) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'SmartRecruit AI <notifications@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject,
          html: htmlContent
        })
      });
      return { success: res.ok };
    } catch (err) {
      console.error('Error sending applicant email:', err);
    }
  }

  console.log(`[Email Simulation] Status update email to ${toEmail}: ${status}`);
  return { success: true };
}
