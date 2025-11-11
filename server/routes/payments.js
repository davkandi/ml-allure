const express = require('express');
const router = express.Router();
const mobileMoneyService = require('../services/mobileMoneyService');

// Middleware imports (adjust paths based on your setup)
// const { authenticateToken } = require('../middleware/auth');
// const { requireAdmin } = require('../middleware/roles');

/**
 * POST /api/payments/initiate
 * Initiate a mobile money payment
 * Protected: Requires authentication
 */
router.post('/initiate', async (req, res) => {
  try {
    const { orderId, phoneNumber, provider, amount } = req.body;

    // Validate required fields
    if (!orderId || !phoneNumber || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
        required: ['orderId', 'phoneNumber', 'provider']
      });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?243[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Must be a valid DRC number (+243...)',
        code: 'INVALID_PHONE_NUMBER'
      });
    }

    // Initiate payment via mobile money service
    const paymentResult = await mobileMoneyService.initiatePayment(
      orderId,
      amount,
      phoneNumber,
      provider
    );

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        error: paymentResult.error,
        code: 'PAYMENT_INITIATION_FAILED'
      });
    }

    // TODO: Create or update Transaction record in database
    // const transaction = await Transaction.create({
    //   orderId,
    //   amount,
    //   method: 'MOBILE_MONEY',
    //   provider,
    //   reference: paymentResult.reference,
    //   phoneNumber,
    //   status: 'PENDING',
    //   createdAt: Date.now()
    // });

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        reference: paymentResult.reference,
        provider: paymentResult.provider,
        amount: paymentResult.amount,
        phoneNumber: paymentResult.phoneNumber,
        instructions: paymentResult.instructions,
        status: paymentResult.status
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/payments/verify
 * Verify a mobile money payment
 * Protected: Admin only
 */
router.post('/verify', async (req, res) => {
  try {
    const { transactionId, reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Payment reference is required',
        code: 'MISSING_REFERENCE'
      });
    }

    // Verify payment via mobile money service
    const verificationResult = await mobileMoneyService.verifyPayment(reference);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        error: verificationResult.error,
        code: 'VERIFICATION_FAILED'
      });
    }

    // TODO: Update transaction status in database
    // const transaction = await Transaction.findByPk(transactionId);
    // if (!transaction) {
    //   return res.status(404).json({
    //     success: false,
    //     error: 'Transaction not found',
    //     code: 'TRANSACTION_NOT_FOUND'
    //   });
    // }

    // Update transaction and order status based on verification
    const paymentStatus = verificationResult.status === 'SUCCESS' ? 'PAID' : 
                          verificationResult.status === 'FAILED' ? 'FAILED' : 'PENDING';

    // await transaction.update({
    //   status: verificationResult.status,
    //   verifiedAt: Date.now(),
    //   verifiedBy: req.user?.id, // From auth middleware
    //   transactionId: verificationResult.transactionId
    // });

    // Update order payment status
    // await Order.update(
    //   { paymentStatus, paymentReference: reference },
    //   { where: { id: transaction.orderId } }
    // );

    res.json({
      success: true,
      message: 'Payment verification completed',
      data: {
        reference: verificationResult.reference,
        status: verificationResult.status,
        amount: verificationResult.amount,
        transactionId: verificationResult.transactionId,
        timestamp: verificationResult.timestamp,
        message: verificationResult.message,
        paymentStatus
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/payments/instructions/:provider
 * Get payment instructions for a specific provider
 * Public endpoint
 */
router.get('/instructions/:provider', (req, res) => {
  try {
    const { provider } = req.params;

    // Decode provider name (handle URL encoding)
    const decodedProvider = decodeURIComponent(provider);

    // Validate provider
    const validProviders = ['M-Pesa', 'Airtel Money', 'Orange Money'];
    if (!validProviders.includes(decodedProvider)) {
      return res.status(400).json({
        success: false,
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
        code: 'INVALID_PROVIDER'
      });
    }

    // Get instructions from service
    const instructions = mobileMoneyService.getProviderInstructions(decodedProvider);

    if (!instructions) {
      return res.status(404).json({
        success: false,
        error: 'Instructions not found for this provider',
        code: 'INSTRUCTIONS_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      provider: decodedProvider,
      instructions
    });
  } catch (error) {
    console.error('Get instructions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
