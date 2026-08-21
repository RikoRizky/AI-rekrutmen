/**
 * Resend Email Service Helper
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

export async function sendCompanyInvitationEmail({
  toEmail,
  contactName,
  packageName,
  registrationUrl
}: SendCompanyInvitationEmailParams): Promise<{ success: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'SmartRecruit AI <onboarding@resend.dev>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f17; color: #f8fafc; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background-color: #131d2e; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; }
          .badge { display: inline-block; background-color: #064e3b; color: #34d399; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #059669; }
          h1 { font-size: 22px; color: #ffffff; margin-top: 0; font-weight: 700; }
          p { font-size: 14px; color: #94a3b8; line-height: 1.6; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
          .warning { background-color: #1e293b; border-left: 3px solid #f59e0b; padding: 12px; font-size: 12px; color: #cbd5e1; border-radius: 4px; margin-top: 20px; }
          .footer { margin-top: 24px; font-size: 11px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="badge">Pembayaran Berhasil Diterima</span>
          <h1>Selamat Datang di SmartRecruit AI!</h1>
          <p>Halo <strong>${contactName}</strong>,</p>
          <p>Terima kasih telah berlangganan paket <strong>${packageName}</strong>. Akun perusahaan Anda siap didaftarkan untuk mulai membuka lowongan kerja dan menggunakan analisis berkas AI.</p>
          
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

  if (!apiKey || apiKey.startsWith('re_demo')) {
    console.log(`[Resend Email Simulation] Sent invitation to ${toEmail} with URL: ${registrationUrl}`);
    return { success: true, id: `sim-${Date.now()}` };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `[Aktivasi Akun] Pendaftaran Perusahaan SmartRecruit AI (${packageName})`,
        html: htmlContent
      })
    });

    const data = await res.json();
    return { success: res.ok, id: data.id };
  } catch (err) {
    console.error('Error sending email via Resend:', err);
    return { success: false };
  }
}

export async function sendApplicantStatusNotification({
  toEmail,
  applicantName,
  jobTitle,
  companyName,
  status,
  customNotes
}: SendApplicantStatusNotificationParams): Promise<{ success: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'SmartRecruit AI <notifications@resend.dev>';

  const statusTitles: Record<string, string> = {
    screening: 'Lamaran Anda Sedang Ditinjau',
    interview: 'Undangan Tahap Wawancara',
    accepted: 'Selamat! Lamaran Anda Diterima',
    rejected: 'Pembaruan Status Lamaran'
  };

  const subject = `[${companyName}] ${statusTitles[status] || 'Update Status Lamaran'} - ${jobTitle}`;

  if (!apiKey || apiKey.startsWith('re_demo')) {
    console.log(`[Resend Email Simulation] Status notification sent to ${toEmail} (${status}) for job ${jobTitle}`);
    return { success: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html: `<p>Halo ${applicantName}, status lamaran Anda untuk posisi <strong>${jobTitle}</strong> di <strong>${companyName}</strong> telah diperbarui menjadi <strong>${status.toUpperCase()}</strong>.</p>${customNotes ? `<p>Catatan HR: ${customNotes}</p>` : ''}`
      })
    });
    return { success: res.ok };
  } catch (err) {
    console.error('Error sending applicant email:', err);
    return { success: false };
  }
}
