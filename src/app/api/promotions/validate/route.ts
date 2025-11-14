import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions, promotionUsage, customers } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth, createAuthErrorResponse } from '@/lib/auth';

interface ValidatePromotionRequest {
  code: string;
  customerId?: number;
  orderTotal: number;
}

interface PromotionValidationResult {
  valid: boolean;
  promotion?: any;
  discountAmount?: number;
  finalTotal?: number;
  error?: string;
  errorCode?: string;
}

export async function POST(request: NextRequest) {
  // SECURITY: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  try {
    const body: ValidatePromotionRequest = await request.json();

    // Validation
    if (!body.code) {
      return NextResponse.json({
        error: 'Promotion code is required',
        code: 'MISSING_CODE'
      }, { status: 400 });
    }

    if (body.orderTotal === undefined || body.orderTotal < 0) {
      return NextResponse.json({
        error: 'Valid order total is required',
        code: 'INVALID_ORDER_TOTAL'
      }, { status: 400 });
    }

    const customerId = body.customerId || user.id;

    // Fetch promotion
    const promotion = await db.select()
      .from(promotions)
      .where(eq(promotions.code, body.code.toUpperCase()))
      .limit(1);

    if (promotion.length === 0) {
      return NextResponse.json<PromotionValidationResult>({
        valid: false,
        error: 'Promotion code not found',
        errorCode: 'INVALID_CODE'
      }, { status: 404 });
    }

    const promo = promotion[0];

    // Check if promotion is active
    if (!promo.isActive) {
      return NextResponse.json<PromotionValidationResult>({
        valid: false,
        error: 'This promotion is no longer active',
        errorCode: 'INACTIVE_PROMOTION'
      }, { status: 400 });
    }

    // Check if promotion has started
    const now = Date.now();
    if (now < promo.startDate) {
      return NextResponse.json<PromotionValidationResult>({
        valid: false,
        error: 'This promotion has not started yet',
        errorCode: 'NOT_STARTED'
      }, { status: 400 });
    }

    // Check if promotion has expired
    if (now > promo.endDate) {
      return NextResponse.json<PromotionValidationResult>({
        valid: false,
        error: 'This promotion has expired',
        errorCode: 'EXPIRED'
      }, { status: 400 });
    }

    // Check minimum order value
    if (promo.minOrderValue && body.orderTotal < promo.minOrderValue) {
      return NextResponse.json<PromotionValidationResult>({
        valid: false,
        error: `Minimum order value of $${promo.minOrderValue} required`,
        errorCode: 'MIN_ORDER_NOT_MET'
      }, { status: 400 });
    }

    // Check total usage limit
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return NextResponse.json<PromotionValidationResult>({
        valid: false,
        error: 'This promotion has reached its usage limit',
        errorCode: 'USAGE_LIMIT_REACHED'
      }, { status: 400 });
    }

    // Check per-user usage limit
    if (promo.perUserLimit && customerId) {
      const userUsage = await db.select({
        count: sql<number>`count(*)`,
      })
        .from(promotionUsage)
        .where(
          and(
            eq(promotionUsage.promotionId, promo.id),
            eq(promotionUsage.customerId, customerId)
          )
        );

      const usageCount = Number(userUsage[0]?.count || 0);

      if (usageCount >= promo.perUserLimit) {
        return NextResponse.json<PromotionValidationResult>({
          valid: false,
          error: 'You have already used this promotion the maximum number of times',
          errorCode: 'USER_LIMIT_REACHED'
        }, { status: 400 });
      }
    }

    // Calculate discount
    let discountAmount = 0;

    if (promo.type === 'PERCENTAGE') {
      discountAmount = (body.orderTotal * promo.value) / 100;

      // Apply max discount cap if set
      if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
        discountAmount = promo.maxDiscount;
      }
    } else if (promo.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(promo.value, body.orderTotal);
    } else if (promo.type === 'FREE_SHIPPING') {
      // For free shipping, the discount amount would be the delivery fee
      // This should be calculated by the caller based on their delivery fee
      discountAmount = 0; // Placeholder
    }

    const finalTotal = Math.max(0, body.orderTotal - discountAmount);

    return NextResponse.json<PromotionValidationResult>({
      valid: true,
      promotion: {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        description: promo.description,
        type: promo.type,
        value: promo.value,
      },
      discountAmount,
      finalTotal,
    });
  } catch (error) {
    console.error('Validate promotion error:', error);
    return NextResponse.json({
      error: 'Failed to validate promotion: ' + (error as Error).message,
      code: 'VALIDATION_FAILED'
    }, { status: 500 });
  }
}
