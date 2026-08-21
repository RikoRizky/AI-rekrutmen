import { NextRequest, NextResponse } from 'next/server';
import { checkMidtransTransactionStatus } from '@/lib/midtrans';
import { createInvitationToken } from '@/lib/token';
import { sendCompanyInvitationEmail } from '@/lib/resend';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID wajib disertakan' }, { status: 400 });
    }

    // 1. Query Midtrans API directly
    const result = await checkMidtransTransactionStatus(orderId);

    const transactionStatus = result.transactionStatus || 'unknown';
    const fraudStatus = result.fraudStatus;

    const isSuccess =
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && fraudStatus === 'accept');

    const isPending = transactionStatus === 'pending';

    // 2. If settled/paid, ensure token & email are generated if not yet created
    if (isSuccess) {
      // Find existing transaction in DB
      let transaction = await prisma.transaction.findUnique({
        where: { orderId }
      });

      if (transaction && transaction.status !== 'settlement') {
        transaction = await prisma.transaction.update({
          where: { orderId },
          data: {
            status: 'settlement',
            paidAt: new Date()
          }
        });
      }

      const email = transaction?.companyEmail || 'admin@perusahaan.com';
      const contactName = transaction?.companyName || 'HR Representative';
      const packageName = transaction?.packageName || 'Enterprise Corporation';

      // Check if token already exists for this email
      let tokenRecord = await prisma.companyInvitationToken.findFirst({
        where: { email, isUsed: false }
      });

      if (!tokenRecord) {
        const tokenObj = createInvitationToken(email, packageName);
        tokenRecord = await prisma.companyInvitationToken.create({
          data: {
            id: `token-${Date.now()}`,
            token: tokenObj.token,
            email,
            packageType: packageName,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });

        // Send email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const registrationUrl = `${appUrl}/auth/company-register?token=${tokenRecord.token}&email=${encodeURIComponent(email)}`;
        await sendCompanyInvitationEmail({
          toEmail: email,
          contactName,
          packageName,
          registrationUrl
        }).catch(console.warn);
      }

      return NextResponse.json({
        success: true,
        isPaid: true,
        status: 'settlement',
        token: tokenRecord.token,
        registrationUrl: `/auth/company-register?token=${tokenRecord.token}&email=${encodeURIComponent(email)}`,
        message: 'Pembayaran telah sukses terkonfirmasi!'
      });
    }

    if (isPending) {
      return NextResponse.json({
        success: true,
        isPaid: false,
        status: 'pending',
        paymentType: result.paymentType,
        vaNumbers: result.vaNumbers,
        billKey: result.billKey,
        billerCode: result.billerCode,
        message: 'Menunggu transfer pembayaran dari pengguna.'
      });
    }

    return NextResponse.json({
      success: true,
      isPaid: false,
      status: transactionStatus,
      message: `Status transaksi saat ini: ${transactionStatus}`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memeriksa status pembayaran';
    console.error('Payment status route error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
