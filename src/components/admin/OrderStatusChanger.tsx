"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface OrderStatusChangerProps {
  currentStatus: string;
  onStatusChange: (newStatus: string, note?: string) => Promise<void>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PROCESSING: "En préparation",
  READY_FOR_PICKUP: "Prête au retrait",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_FOR_PICKUP", "SHIPPED"],
  READY_FOR_PICKUP: ["DELIVERED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrderStatusChanger({
  currentStatus,
  onStatusChange,
}: OrderStatusChangerProps) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [note, setNote] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const availableStatuses = STATUS_TRANSITIONS[currentStatus] || [];

  const handleOpenDialog = () => {
    if (selectedStatus && selectedStatus !== currentStatus) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onStatusChange(selectedStatus, note || undefined);
      setShowConfirmDialog(false);
      setSelectedStatus("");
      setNote("");
    } catch (error) {
      console.error("Error changing status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setNote("");
  };

  if (availableStatuses.length === 0) {
    return (
      <div className="text-center p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Aucun changement de statut possible pour le statut actuel
        </p>
        <Badge variant="outline" className="mt-2">
          {STATUS_LABELS[currentStatus]}
        </Badge>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status">Changer le statut</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Sélectionner un nouveau statut" />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleOpenDialog}
          disabled={!selectedStatus || selectedStatus === currentStatus}
          className="w-full"
        >
          Confirmer le changement
        </Button>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le changement de statut</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de changer le statut de{" "}
              <span className="font-semibold">
                {STATUS_LABELS[currentStatus]}
              </span>{" "}
              à{" "}
              <span className="font-semibold">
                {STATUS_LABELS[selectedStatus]}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">
                Note (optionnel)
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ajouter une note sur ce changement de statut..."
                rows={3}
              />
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Une notification sera envoyée au client par SMS/Email pour
                l'informer du changement de statut.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? "Mise à jour..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
