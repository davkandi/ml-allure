import { NextRequest, NextResponse } from "next/server";

function getProviderInstructions(provider: string) {
  const instructions: Record<string, any> = {
    'M-Pesa': {
      provider: 'M-Pesa',
      phoneNumber: '+243 812 345 678',
      steps: [
        'Composez *555# sur votre téléphone',
        'Sélectionnez "Envoyer de l\'argent"',
        'Entrez le numéro: +243 812 345 678',
        'Entrez le montant à payer',
        'Ajoutez votre référence de commande',
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
        'Entrez le montant à payer',
        'Ajoutez votre référence de commande',
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
        'Entrez le montant à payer',
        'Indiquez la référence de commande',
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
 * GET /api/payments/instructions/[provider]
 * Get payment instructions for a specific provider
 * Public endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;

    // Decode provider name (handle URL encoding)
    const decodedProvider = decodeURIComponent(provider);

    // Validate provider
    const validProviders = ['M-Pesa', 'Airtel Money', 'Orange Money'];
    if (!validProviders.includes(decodedProvider)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
          code: 'INVALID_PROVIDER'
        },
        { status: 400 }
      );
    }

    // Get instructions from service
    const instructions = getProviderInstructions(decodedProvider);

    if (!instructions) {
      return NextResponse.json(
        {
          success: false,
          error: 'Instructions not found for this provider',
          code: 'INSTRUCTIONS_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: decodedProvider,
      instructions
    });
  } catch (error) {
    console.error('Get instructions error:', error);
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
