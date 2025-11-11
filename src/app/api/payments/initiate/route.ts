import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Mobile Money Service Functions (Mock Implementation)
 */
function generatePaymentReference(): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MM-${timestamp}-${randomStr}`;
}

function getProviderInstructions(provider: string, amount: number, reference: string) {
  const instructions: Record<string, any> = {
    'M-Pesa': {
      provider: 'M-Pesa',
      phoneNumber: '+243 812 345 678',
      steps: [
        'Composez *555# sur votre téléphone',
        'Sélectionnez "Envoyer de l\'argent"',
        'Entrez le numéro: +243 812 345 678',
        `Entrez le montant: $${amount.toFixed(2)} USD`,
        `Ajoutez la référence: ${reference}`,
        'Confirmez avec votre code PIN M-Pesa',
        'Vous recevrez un SMS de confirmation'
      ],
      notes: [
        'Frais de transaction: 2% du montant',
        'Le paiement sera traité sous 5 minutes',
        'Conservez votre SMS de confirmation'
      ],
      helpline: '+243 123 456 789'
    },
    'Airtel Money': {
      provider: 'Airtel Money',
      phoneNumber: '+243 897 654 321',
      steps: [
        'Composez *501# sur votre téléphone',
        'Sélectionnez "Envoyer de l\'argent"',
        'Choisissez "À un numéro Airtel"',
        'Entrez le numéro: +243 897 654 321',
        `Entrez le montant: $${amount.toFixed(2)} USD`,
        `Référence: ${reference}`,
        'Confirmez avec votre code PIN Airtel Money',
        'Vous recevrez un SMS de confirmation'
      ],
      notes: [
        'Frais de transaction: 1.5% du montant',
        'Traitement instantané',
        'Gardez votre reçu SMS'
      ],
      helpline: '+243 987 654 321'
    },
    'Orange Money': {
      provider: 'Orange Money',
      phoneNumber: '+243 823 456 789',
      steps: [
        'Composez #144# sur votre téléphone',
        'Sélectionnez "Transfert d\'argent"',
        'Choisissez "Vers Orange Money"',
        'Entrez le numéro: +243 823 456 789',
        `Montant: $${amount.toFixed(2)} USD`,
        `Référence: ${reference}`,
        'Validez avec votre code secret Orange Money',
        'Confirmation par SMS'
      ],
      notes: [
        'Frais: 1.8% du montant',
        'Validation immédiate',
        'Reçu électronique envoyé par SMS'
      ],
      helpline: '+243 800 900 100'
    }
  };

  return instructions[provider] || null;
}

/**
 * POST /api/payments/initiate
 * Initiate a mobile money payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, phoneNumber, provider } = body;

    // Validate required fields
    if (!orderId || !phoneNumber || !provider) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          code: 'MISSING_FIELDS',
          required: ['orderId', 'phoneNumber', 'provider']
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\+?243[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid phone number format. Must be a valid DRC number (+243...)',
          code: 'INVALID_PHONE_NUMBER'
        },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ['M-Pesa', 'Airtel Money', 'Orange Money'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
          code: 'INVALID_PROVIDER'
        },
        { status: 400 }
      );
    }

    // Fetch order to get amount
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const amount = order[0].total;

    // Generate payment reference
    const reference = generatePaymentReference();

    // Get provider-specific instructions
    const instructions = getProviderInstructions(provider, amount, reference);

    const now = Date.now();

    // Create transaction record
    await db.insert(transactions).values({
      orderId: parseInt(orderId),
      amount,
      method: 'MOBILE_MONEY',
      provider,
      reference,
      phoneNumber,
      status: 'PENDING',
      verifiedBy: null,
      verifiedAt: null,
      createdAt: now,
      updatedAt: now
    });

    // Update order with payment reference
    await db
      .update(orders)
      .set({
        paymentReference: reference,
        updatedAt: now
      })
      .where(eq(orders.id, parseInt(orderId)));

    return NextResponse.json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        reference,
        provider,
        amount,
        phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3'),
        instructions,
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}
