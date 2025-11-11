"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Package, TrendingUp, RefreshCw } from "lucide-react";

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: {
    id: number;
    sku: string;
    size?: string | null;
    color?: string | null;
    stockQuantity: number;
    productName: string;
  };
  onSuccess?: () => void;
}

export function StockAdjustmentModal({
  open,
  onOpenChange,
  variant,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<string>("RESTOCK");
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getQuantityChange = () => {
    switch (adjustmentType) {
      case "RESTOCK":
      case "RETURN":
        return Math.abs(quantity);
      case "ADJUSTMENT":
        return quantity;
      default:
        return 0;
    }
  };

  const getNewStockLevel = () => {
    const change = getQuantityChange();
    return variant.stockQuantity + change;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantity || quantity === 0) {
      toast.error("Veuillez entrer une quantité valide");
      return;
    }

    if (!reason.trim()) {
      toast.error("Veuillez fournir une raison pour cet ajustement");
      return;
    }

    const newStock = getNewStockLevel();
    if (newStock < 0) {
      toast.error("Le stock ne peut pas être négatif");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inventory/adjust", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantId: variant.id,
          quantityChange: getQuantityChange(),
          reason: reason.trim(),
          changeType: adjustmentType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to adjust stock");
      }

      toast.success("Le stock a été ajusté avec succès");

      // Reset form
      setQuantity(0);
      setReason("");
      setAdjustmentType("RESTOCK");
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error(error instanceof Error ? error.message : "Impossible d'ajuster le stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajuster le Stock</DialogTitle>
          <DialogDescription>
            {variant.productName} - {variant.size && `Taille: ${variant.size}`}{" "}
            {variant.color && `Couleur: ${variant.color}`}
            <br />
            SKU: {variant.sku}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Current Stock */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Stock actuel</p>
              <p className="text-2xl font-bold">{variant.stockQuantity}</p>
            </div>

            {/* Adjustment Type */}
            <div className="space-y-3">
              <Label>Type d&apos;ajustement</Label>
              <RadioGroup
                value={adjustmentType}
                onValueChange={setAdjustmentType}
              >
                <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="RESTOCK" id="restock" />
                  <Label
                    htmlFor="restock"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Réapprovisionnement (+)</p>
                      <p className="text-xs text-muted-foreground">
                        Ajouter du nouveau stock
                      </p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="ADJUSTMENT" id="adjustment" />
                  <Label
                    htmlFor="adjustment"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">Ajustement manuel (+/-)</p>
                      <p className="text-xs text-muted-foreground">
                        Corriger le stock (positif ou négatif)
                      </p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="RETURN" id="return" />
                  <Label
                    htmlFor="return"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Package className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="font-medium">Retour (+)</p>
                      <p className="text-xs text-muted-foreground">
                        Retour client ou fournisseur
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantité{" "}
                {adjustmentType === "ADJUSTMENT" && (
                  <span className="text-xs text-muted-foreground">
                    (utilisez - pour réduire)
                  </span>
                )}
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity || ""}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder={
                  adjustmentType === "ADJUSTMENT" ? "Ex: +10 ou -5" : "Ex: 10"
                }
                required
              />
            </div>

            {/* Preview New Stock */}
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">
                Nouveau niveau de stock
              </p>
              <p className="text-2xl font-bold text-primary">
                {variant.stockQuantity} → {getNewStockLevel()}
                <span className="text-base ml-2">
                  ({getQuantityChange() >= 0 ? "+" : ""}
                  {getQuantityChange()})
                </span>
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Raison *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez la raison de cet ajustement..."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}