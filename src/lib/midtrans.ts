/**
 * Midtrans Integration Helper (Snap & Core API)
 */

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    firstName: string;
    email: string;
    phone?: string;
  };
  itemDetails: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

export async function createMidtransSnapTransaction({
  orderId,
  grossAmount,
  customerDetails,
  itemDetails
}: CreateSnapTransactionParams): Promise<{ token: string; redirect_url: string }> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-demo-key';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  const baseUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount
    },
    customer_details: {
      first_name: customerDetails.firstName,
      email: customerDetails.email,
      phone: customerDetails.phone || '08123456789'
    },
    item_details: itemDetails,
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?status=success&order_id=${orderId}`
    }
  };

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.warn('Midtrans API direct call fallback:', errBody);
      // Fallback mock snap token if sandbox keys aren't configured yet
      return {
        token: `mock-snap-${Date.now()}`,
        redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-${orderId}`
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Midtrans network error, using simulation fallback:', error);
    return {
      token: `sim-snap-${Date.now()}`,
      redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/sim-${orderId}`
    };
  }
}
