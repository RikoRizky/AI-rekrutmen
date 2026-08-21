import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/transactions
export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formatted = transactions.map((t) => ({
      id: t.id,
      orderId: t.orderId,
      companyEmail: t.companyEmail || '',
      companyName: t.companyName || '',
      packageName: t.packageName || '',
      amount: t.amount,
      paymentType: t.paymentType || 'bank_transfer',
      status: t.status,
      paidAt: t.paidAt ? t.paidAt.toISOString() : undefined,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, transactions: formatted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, companyEmail, companyName, packageName, amount, paymentType, status, paidAt } = body;

    if (!orderId || !companyEmail || !packageName || !amount) {
      return NextResponse.json({ success: false, error: 'Data transaksi tidak lengkap' }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        id: `trx-${Date.now()}`,
        orderId,
        companyEmail,
        companyName: companyName || '',
        packageName,
        amount: Number(amount),
        paymentType: paymentType || 'qris',
        status: status || 'settlement',
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil dicatat ke database!',
      transaction: {
        ...transaction,
        createdAt: transaction.createdAt.toISOString(),
        paidAt: transaction.paidAt ? transaction.paidAt.toISOString() : undefined,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan transaksi';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
