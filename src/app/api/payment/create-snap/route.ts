import { NextRequest, NextResponse } from 'next/server';
import { createMidtransSnapTransaction } from '@/lib/midtrans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packageId, packageName, price, companyName, contactName, contactEmail, phone } = body;

    if (!packageName || !price || !contactEmail) {
      return NextResponse.json(
        { error: 'Field paket, harga, dan email wajib diisi.' },
        { status: 400 }
      );
    }

    const orderId = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const snapResult = await createMidtransSnapTransaction({
      orderId,
      grossAmount: price,
      customerDetails: {
        firstName: contactName || companyName || 'Perusahaan Mitra',
        email: contactEmail,
        phone: phone || '08123456789'
      },
      itemDetails: [
        {
          id: packageId || 'pkg-sub',
          name: `Langganan ${packageName}`,
          price,
          quantity: 1
        }
      ]
    });

    return NextResponse.json({
      success: true,
      orderId,
      snapToken: snapResult.token,
      redirectUrl: snapResult.redirect_url
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat transaksi Midtrans';
    console.error('Create Snap Transaction Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
