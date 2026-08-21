import { NextRequest, NextResponse } from 'next/server';
import { createInvitationToken } from '@/lib/token';
import { sendCompanyInvitationEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();
    const { order_id, transaction_status, fraud_status, payment_type, gross_amount, customer_details } = notification;

    console.log(`[Midtrans Webhook] Received for Order: ${order_id}, Status: ${transaction_status}`);

    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (isSuccess) {
      const email = customer_details?.email || 'admin@perusahaan.com';
      const contactName = customer_details?.first_name || 'HR Representative';
      const packageName = 'Professional HR ATS'; // Default / extracted from custom field

      // Generate single-use secure token
      const tokenObj = createInvitationToken(email, packageName);
      
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const registrationUrl = `${appUrl}/auth/company-register?token=${tokenObj.token}&email=${encodeURIComponent(email)}`;

      // Send email via Resend
      await sendCompanyInvitationEmail({
        toEmail: email,
        contactName,
        packageName,
        registrationUrl
      });

      return NextResponse.json({
        success: true,
        message: 'Pembayaran sukses, email aktivasi telah dikirim via Resend.',
        token: tokenObj.token,
        registrationUrl
      });
    }

    return NextResponse.json({
      success: true,
      message: `Status transaksi dicatat: ${transaction_status}`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook error';
    console.error('[Midtrans Webhook Error]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
