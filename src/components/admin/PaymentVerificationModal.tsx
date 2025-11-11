"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Package,
  CreditCard,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  provider: string | null;
  reference: string | null;
  status: string;
  verifiedBy: number | null;
  verifiedAt: number | null;
  createdAt: number;
  updatedAt: number;
  order?: {
    id: number;
    orderNumber: string;
    customerId: number;
    total: number;
    status: string;
  };
  customer?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface PaymentVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  onVerificationComplete: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  COMPLETED: "Complétée",
  FAILED: "Échouée",
};

export const PaymentVerificationModal = ({
  open,
  onOpenChange,
  transaction,
  onVerificationComplete,
}: PaymentVerificationModalProps) => {
  const [reference, setReference] = useState(transaction.reference || "");
  const [notes, setNotes] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setReference(transaction.reference || "");
      setNotes("");
      // In a real app, fetch verification history from API
      setVerificationHistory([]);
    }
  }, [open, transaction]);

  const handleAutoVerify = async () => {
    if (!reference.trim()) {
      toast.error("Veuillez saisir une référence de paiement");
      return;
    }

    setVerifying(true);
    try {
      // Call payment verification API
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id,
          reference: reference.trim(),
        }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.error || "Échec de la vérification");
      }

      const verifyResult = await verifyResponse.json();

      if (verifyResult.verified) {
        toast.success("Paiement vérifié avec succès");
        onVerificationComplete();
      } else {
        toast.error(
          verifyResult.message || "La vérification automatique a échoué"
        );
      }
    } catch (error) {
      console.error("Auto verify error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la vérification automatique"
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!reference.trim()) {
      toast.error("Veuillez saisir une référence de paiement");
      return;
    }

    setUpdating(true);
    try {
      // Update transaction to COMPLETED
      const updateTransactionRes = await fetch(
        `/api/transactions?id=${transaction.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "COMPLETED",
            reference: reference.trim(),
            verifiedBy: 1, // TODO: Get actual admin user ID from auth
            verifiedAt: Date.now(),
          }),
        }
      );

      if (!updateTransactionRes.ok) {
        throw new Error("Échec de la mise à jour de la transaction");
      }

      // Update order payment status
      if (transaction.order) {
        const updateOrderRes = await fetch(
          `/api/orders?id=${transaction.order.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentStatus: "PAID",
              paymentReference: reference.trim(),
            }),
          }
        );

        if (!updateOrderRes.ok) {
          console.error("Failed to update order payment status");
        }
      }

      toast.success("Transaction marquée comme payée");
      onVerificationComplete();
    } catch (error) {
      console.error("Mark as paid error:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsFailed = async () => {
    setUpdating(true);
    try {
      // Update transaction to FAILED
      const updateTransactionRes = await fetch(
        `/api/transactions?id=${transaction.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "FAILED",
            verifiedBy: 1, // TODO: Get actual admin user ID from auth
            verifiedAt: Date.now(),
          }),
        }
      );

      if (!updateTransactionRes.ok) {
        throw new Error("Échec de la mise à jour de la transaction");
      }

      // Update order payment status
      if (transaction.order) {
        const updateOrderRes = await fetch(
          `/api/orders?id=${transaction.order.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentStatus: "FAILED",
            }),
          }
        );

        if (!updateOrderRes.ok) {
          console.error("Failed to update order payment status");
        }
      }

      toast.success("Transaction marquée comme échouée");
      onVerificationComplete();
    } catch (error) {
      console.error("Mark as failed error:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  const isPending = transaction.status === "PENDING";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vérification de paiement</DialogTitle>
          <DialogDescription>
            Vérifiez et validez les informations de paiement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Détails de la transaction</h3>
              <Badge
                variant="outline"
                className={STATUS_COLORS[transaction.status]}
              >
                {STATUS_LABELS[transaction.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Montant</p>
                <p className="font-semibold text-lg">
                  ${transaction.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Méthode</p>
                <p className="font-medium">{transaction.method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fournisseur</p>
                <p className="font-medium">{transaction.provider || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(transaction.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Details */}
          {transaction.order && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Détails de la commande</h3>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      N° Commande
                    </span>
                    <span className="font-medium">
                      {transaction.order.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total commande
                    </span>
                    <span className="font-medium">
                      ${transaction.order.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Statut commande
                    </span>
                    <span className="font-medium">
                      {transaction.order.status}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Customer Info */}
          {transaction.customer && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Informations client</h3>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nom</span>
                    <span className="font-medium">
                      {transaction.customer.firstName}{" "}
                      {transaction.customer.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium">
                      {transaction.customer.email || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Téléphone
                    </span>
                    <span className="font-medium">
                      {transaction.customer.phone || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Reference Number */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Référence de paiement</h3>
            </div>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Saisir la référence de paiement"
              disabled={!isPending || updating}
            />
            {isPending && (
              <Button
                onClick={handleAutoVerify}
                disabled={!reference.trim() || verifying || updating}
                className="w-full"
                variant="outline"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vérification en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Vérifier automatiquement
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Manual Verification */}
          {isPending && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Vérification manuelle</h3>
                <p className="text-sm text-muted-foreground">
                  Si la vérification automatique échoue, vous pouvez marquer
                  manuellement le paiement.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleMarkAsPaid}
                    disabled={!reference.trim() || updating || verifying}
                    className="flex-1"
                    variant="default"
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Marquer comme payé
                  </Button>
                  <Button
                    onClick={handleMarkAsFailed}
                    disabled={updating || verifying}
                    className="flex-1"
                    variant="destructive"
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Marquer comme échoué
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <h3 className="font-semibold">Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter des notes sur cette transaction..."
              rows={3}
              disabled={updating || verifying}
            />
          </div>

          {/* Verification History */}
          {verificationHistory.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Historique de vérification</h3>
                </div>
                <div className="space-y-2">
                  {verificationHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="p-3 bg-muted/50 rounded-lg text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(entry.timestamp).toLocaleString("fr-FR")}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-muted-foreground mt-1">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Warning for verified transactions */}
          {!isPending && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">
                  Transaction déjà {STATUS_LABELS[transaction.status].toLowerCase()}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Cette transaction a été vérifiée le{" "}
                  {transaction.verifiedAt
                    ? new Date(transaction.verifiedAt).toLocaleString("fr-FR")
                    : "date inconnue"}
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updating || verifying}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
