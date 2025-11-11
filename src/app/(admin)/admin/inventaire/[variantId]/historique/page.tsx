"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  RefreshCw,
  ShoppingCart,
  User,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface InventoryLog {
  id: number;
  changeType: string;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  createdAt: number;
  orderId: number | null;
  orderNumber: string | null;
  performedBy: number | null;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
}

interface Variant {
  id: number;
  sku: string;
  size: string | null;
  color: string | null;
  stockQuantity: number;
  productId: number;
  productName: string;
}

export default function HistoriquePage({
  params,
}: {
  params: Promise<{ variantId: string }>;
}) {
  const resolvedParams = use(params);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [resolvedParams.variantId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/inventory/${resolvedParams.variantId}/history`
      );
      if (!response.ok) throw new Error("Failed to fetch history");

      const data = await response.json();
      setVariant(data.variant);
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Impossible de charger l'historique");
    } finally {
      setIsLoading(false);
    }
  };

  const getChangeTypeInfo = (type: string) => {
    switch (type) {
      case "SALE":
        return {
          label: "Vente",
          icon: ShoppingCart,
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        };
      case "RESTOCK":
        return {
          label: "Réapprovisionnement",
          icon: TrendingUp,
          color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        };
      case "ADJUSTMENT":
        return {
          label: "Ajustement",
          icon: RefreshCw,
          color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        };
      case "RETURN":
        return {
          label: "Retour",
          icon: Package,
          color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        };
      default:
        return {
          label: type,
          icon: Package,
          color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        };
    }
  };

  const handleExportPDF = () => {
    // For now, just export as text/CSV
    if (!variant) return;

    const content = [
      `Historique du Stock - ${variant.productName}`,
      `SKU: ${variant.sku}`,
      variant.size ? `Taille: ${variant.size}` : "",
      variant.color ? `Couleur: ${variant.color}` : "",
      `Stock actuel: ${variant.stockQuantity}`,
      "",
      "HISTORIQUE:",
      "----------------------------------------",
      ...logs.map(
        (log) =>
          `${new Date(log.createdAt).toLocaleString("fr-FR")} | ${
            getChangeTypeInfo(log.changeType).label
          } | ${log.quantityChange >= 0 ? "+" : ""}${log.quantityChange} | ${
            log.previousQuantity
          } → ${log.newQuantity} | ${log.userFirstName || "Système"} ${
            log.userLastName || ""
          } | ${log.reason || ""}`
      ),
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historique-${variant.sku}-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("L'historique a été exporté avec succès");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!variant) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Variante non trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/inventaire">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Historique du Stock</h1>
            <p className="text-muted-foreground mt-1">
              Suivi complet des mouvements de stock
            </p>
          </div>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>

        {/* Product Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Produit</p>
                <p className="font-semibold">{variant.productName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Variante</p>
                <p className="font-semibold">
                  {variant.size && `Taille: ${variant.size}`}
                  {variant.size && variant.color && " • "}
                  {variant.color && `Couleur: ${variant.color}`}
                  {!variant.size && !variant.color && "Standard"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">SKU</p>
                <code className="text-sm bg-muted px-2 py-1 rounded font-semibold">
                  {variant.sku}
                </code>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Stock Actuel</p>
                <p className="text-2xl font-bold text-primary">
                  {variant.stockQuantity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Mouvements</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Aucun historique disponible pour cette variante</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => {
                const typeInfo = getChangeTypeInfo(log.changeType);
                const TypeIcon = typeInfo.icon;
                const isIncrease = log.quantityChange >= 0;

                return (
                  <div
                    key={log.id}
                    className="relative pl-8 pb-8 border-l-2 border-border last:border-l-0 last:pb-0"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background" />

                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={typeInfo.color} variant="secondary">
                          <TypeIcon className="mr-1 h-3 w-3" />
                          {typeInfo.label}
                        </Badge>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(log.createdAt).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        {log.userFirstName && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            {log.userFirstName} {log.userLastName}
                          </div>
                        )}
                      </div>

                      {/* Quantity Change */}
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold">
                          {log.previousQuantity}
                        </div>
                        <div className="flex items-center gap-2">
                          {isIncrease ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                          <span
                            className={`font-bold ${
                              isIncrease ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isIncrease ? "+" : ""}
                            {log.quantityChange}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {log.newQuantity}
                        </div>
                      </div>

                      {/* Reason */}
                      {log.reason && (
                        <div className="bg-background rounded p-3">
                          <p className="text-sm">
                            <span className="font-semibold">Raison: </span>
                            {log.reason}
                          </p>
                        </div>
                      )}

                      {/* Related Order */}
                      {log.orderNumber && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold">Commande: </span>
                          <Link
                            href={`/admin/commandes/${log.orderNumber}`}
                            className="text-primary hover:underline"
                          >
                            #{log.orderNumber}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}