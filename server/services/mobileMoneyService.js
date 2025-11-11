/**
 * Mobile Money Service - Mock Implementation
 * In production: integrate with actual APIs (M-Pesa, Airtel Money, Orange Money)
 */

const crypto = require('crypto');

/**
 * Generate a unique payment reference
 * @returns {string} Payment reference (e.g., "MM-1729789234567-ABC123")
 */
function generatePaymentReference() {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MM-${timestamp}-${randomStr}`;
}

/**
 * Initiate a mobile money payment
 * @param {number} orderId - Order ID
 * @param {number} amount - Payment amount in USD
 * @param {string} phoneNumber - Customer phone number
 * @param {string} provider - Payment provider (M-Pesa, Airtel, Orange)
 * @returns {Promise<object>} Payment initiation result
 */
async function initiatePayment(orderId, amount, phoneNumber, provider) {
  try {
    // Validate inputs
    if (!orderId || !amount || !phoneNumber || !provider) {
      throw new Error('Missing required parameters');
    }

    // Validate provider
    const validProviders = ['M-Pesa', 'Airtel Money', 'Orange Money'];
    if (!validProviders.includes(provider)) {
      throw new Error(`Invalid provider. Must be one of: ${validProviders.join(', ')}`);
    }

    // Generate payment reference
    const reference = generatePaymentReference();

    // Mock: Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get provider-specific instructions
    const instructions = getProviderInstructions(provider, amount, reference);

    // In production: Call actual provider API
    // const apiResponse = await callProviderAPI(provider, {
    //   amount,
    //   phoneNumber,
    //   reference,
    //   orderId
    // });

    return {
      success: true,
      reference,
      provider,
      amount,
      phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3'),
      instructions,
      status: 'PENDING',
      createdAt: Date.now()
    };
  } catch (error) {
    console.error('Mobile Money initiation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify payment status
 * @param {string} reference - Payment reference
 * @returns {Promise<object>} Payment verification result
 */
async function verifyPayment(reference) {
  try {
    if (!reference) {
      throw new Error('Payment reference is required');
    }

    // Mock: Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock: Random payment status for testing
    // In production: Call actual provider API to verify
    const statuses = ['SUCCESS', 'PENDING', 'FAILED'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    // Extract amount from reference (in real scenario, query from database)
    const mockAmount = 50.00; // This should come from database in production

    return {
      success: true,
      reference,
      status: randomStatus,
      amount: mockAmount,
      timestamp: Date.now(),
      transactionId: `TXN-${reference}`,
      message: getStatusMessage(randomStatus)
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get provider-specific payment instructions
 * @param {string} provider - Payment provider
 * @param {number} amount - Payment amount (optional)
 * @param {string} reference - Payment reference (optional)
 * @returns {object} Payment instructions in French
 */
function getProviderInstructions(provider, amount = null, reference = null) {
  const instructions = {
    'M-Pesa': {
      provider: 'M-Pesa',
      phoneNumber: '+243 812 345 678',
      steps: [
        'Composez *555# sur votre téléphone',
        'Sélectionnez "Envoyer de l\'argent"',
        'Entrez le numéro: +243 812 345 678',
        amount ? `Entrez le montant: $${amount.toFixed(2)} USD` : 'Entrez le montant à payer',
        reference ? `Ajoutez la référence: ${reference}` : 'Ajoutez votre référence de commande',
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
        amount ? `Entrez le montant: $${amount.toFixed(2)} USD` : 'Entrez le montant à payer',
        reference ? `Référence: ${reference}` : 'Ajoutez votre référence de commande',
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
        amount ? `Montant: $${amount.toFixed(2)} USD` : 'Entrez le montant à payer',
        reference ? `Référence: ${reference}` : 'Indiquez la référence de commande',
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
 * Get status message in French
 * @param {string} status - Payment status
 * @returns {string} Status message
 */
function getStatusMessage(status) {
  const messages = {
    'SUCCESS': 'Paiement confirmé avec succès',
    'PENDING': 'Paiement en cours de traitement',
    'FAILED': 'Échec du paiement'
  };
  return messages[status] || 'Statut inconnu';
}

module.exports = {
  initiatePayment,
  verifyPayment,
  getProviderInstructions
};
