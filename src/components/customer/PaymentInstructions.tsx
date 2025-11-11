"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Phone, Copy, Check, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface PaymentInstructionsProps {
  provider: string;
  amount: number;
  reference: string;
  orderId?: string;
  onPaymentConfirmed?: () => void;
}

interface ProviderInstructions {
  provider: string;
  phoneNumber: string;
  steps: string[];
  notes: string[];
  helpline: string;
}

export function PaymentInstructions({
  provider,
  amount,
  reference,
  orderId,
  onPaymentConfirmed
}: PaymentInstructionsProps) {
  const [instructions, setInstructions] = useState<ProviderInstructions | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadInstructions();
  }, [provider]);

  const loadInstructions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/instructions/${encodeURIComponent(provider)}`);
      const data = await response.json();

      if (data.success) {
        setInstructions(data.instructions);
      } else {
        toast.error("Impossible de charger les instructions");
      }
    } catch (error) {
      console.error("Error loading instructions:", error);
      toast.error("Erreur lors du chargement des instructions");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'phone' | 'reference') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'phone') {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
      }
      toast.success("Copié dans le presse-papiers");
    } catch (error) {
      toast.error("Impossible de copier");
    }
  };

  const handlePaymentConfirmation = async () => {
    setConfirming(true);
    try {
      // Simulate confirmation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Confirmation enregistrée. Nous vérifions votre paiement.");
      
      if (onPaymentConfirmed) {
        onPaymentConfirmed();
      }
    } catch (error) {
      toast.error("Erreur lors de la confirmation");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!instructions) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Instructions de paiement non disponibles pour ce fournisseur.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Instructions de Paiement</CardTitle>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {provider}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount */}
          <div className="bg-primary/5 rounded-lg p-4 border-2 border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Montant à payer</p>
            <p className="text-3xl font-bold text-primary">${amount.toFixed(2)} USD</p>
          </div>

          {/* Reference */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Référence de paiement</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-4 py-3 rounded-lg font-mono text-sm">
                {reference}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(reference, 'reference')}
              >
                {copiedRef ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Numéro à créditer</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted px-4 py-3 rounded-lg flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{instructions.phoneNumber}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(instructions.phoneNumber, 'phone')}
              >
                {copiedPhone ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Étapes à suivre</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="flex-1 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold mb-2">Notes importantes :</p>
            <ul className="space-y-1 ml-4">
              {instructions.notes.map((note, index) => (
                <li key={index} className="text-sm">• {note}</li>
              ))}
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          className="w-full"
          size="lg"
          onClick={handlePaymentConfirmation}
          disabled={confirming}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          {confirming ? "Enregistrement..." : "J'ai effectué le paiement"}
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
          <span>Besoin d&apos;aide ?</span>
          <a
            href={`tel:${instructions.helpline}`}
            className="text-primary hover:underline font-semibold"
          >
            {instructions.helpline}
          </a>
        </div>
      </div>

      {/* Info Footer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Vérification du paiement</p>
              <p className="text-muted-foreground">
                Une fois le paiement effectué, notre équipe vérifiera la transaction 
                dans les 5-10 minutes. Vous recevrez une confirmation par email et SMS.
              </p>
              {orderId && (
                <p className="text-muted-foreground">
                  Numéro de commande : <span className="font-mono font-semibold">{orderId}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
