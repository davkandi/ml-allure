import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Mock payment verification
 * In production: Call actual provider API
 */
async function verifyPayment(reference: string) {
  // Mock: Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Mock: Random payment status for testing
  // In production: Call actual provider API to verify
  const statuses = ['SUCCESS', 'PENDING', 'FAILED'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    success: true,
    reference,
    status: randomStatus,
    timestamp: Date.now(),
    transactionId: `TXN-${reference}`,
    message: getStatusMessage(randomStatus)
  };
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'SUCCESS': 'Paiement confirmé avec succès',
    'PENDING': 'Paiement en cours de traitement',
    'FAILED': 'Échec du paiement'
  };
  return messages[status] || 'Statut inconnu';
}

/**
 * POST /api/payments/verify
 * Verify a mobile money payment (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, reference } = body;

    if (!reference) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment reference is required',
          code: 'MISSING_REFERENCE'
        },
        { status: 400 }
      );
    }

    // Find transaction by reference
    const transaction = transactionId
      ? await db
          .select()
          .from(transactions)
          .where(eq(transactions.id, parseInt(transactionId)))
          .limit(1)
      : await db
          .select()
          .from(transactions)
          .where(eq(transactions.reference, reference))
          .limit(1);

    if (transaction.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
          code: 'TRANSACTION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const txn = transaction[0];

    // Verify payment via mobile money service
    const verificationResult = await verifyPayment(reference);

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification failed',
          code: 'VERIFICATION_FAILED'
        },
        { status: 400 }
      );
    }

    // Map verification status to payment status
    const paymentStatus = 
      verificationResult.status === 'SUCCESS' ? 'PAID' :
      verificationResult.status === 'FAILED' ? 'FAILED' : 'PENDING';

    const transactionStatus =
      verificationResult.status === 'SUCCESS' ? 'COMPLETED' :
      verificationResult.status === 'FAILED' ? 'FAILED' : 'PENDING';

    const now = Date.now();

    // Update transaction
    await db
      .update(transactions)
      .set({
        status: transactionStatus,
        verifiedAt: verificationResult.status === 'SUCCESS' ? now : null,
        // verifiedBy: req.user?.id, // TODO: Get from session
        updatedAt: now
      })
      .where(eq(transactions.id, txn.id));

    // Update order payment status
    await db
      .update(orders)
      .set({
        paymentStatus,
        paymentReference: reference,
        updatedAt: now
      })
      .where(eq(orders.id, txn.orderId));

    return NextResponse.json({
      success: true,
      message: 'Payment verification completed',
      data: {
        reference: verificationResult.reference,
        status: verificationResult.status,
        amount: txn.amount,
        transactionId: verificationResult.transactionId,
        timestamp: verificationResult.timestamp,
        message: verificationResult.message,
        paymentStatus
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
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
