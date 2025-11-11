"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Package,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import OrderStatusChanger from "@/components/admin/OrderStatusChanger";

interface Customer {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

interface OrderItem {
  id: number;
  productName: string;
  variantDetails: any;
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference: string | null;
  deliveryMethod: string;
  deliveryAddress: any;
  deliveryZone: string | null;
  deliveryFee: number;
  subtotal: number;
  total: number;
  source: string;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
  READY_FOR_PICKUP: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SHIPPED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PROCESSING: "En préparation",
  READY_FOR_PICKUP: "Prête au retrait",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  REFUNDED: "bg-gray-100 text-gray-800 border-gray-200",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payé",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
};

export default function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentReference, setPaymentReference] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [params.orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderRes = await fetch(`/api/orders?id=${params.orderId}`);
      if (!orderRes.ok) throw new Error("Failed to fetch order");
      const orderData = await orderRes.json();
      setOrder(orderData);
      setPaymentReference(orderData.paymentReference || "");

      const [customerRes, itemsRes] = await Promise.all([
        fetch(`/api/customers?id=${orderData.customerId}`),
        fetch(`/api/order-items?orderId=${params.orderId}&limit=100`),
      ]);

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        setCustomer(customerData);
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Erreur lors du chargement de la commande");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string, note?: string) => {
    try {
      const response = await fetch(`/api/orders/${params.orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus, note }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      toast.success("Statut mis à jour avec succès");
      fetchOrderDetails();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour du statut");
    }
  };

  const handlePaymentUpdate = async (paymentStatus: "PAID" | "FAILED") => {
    try {
      setUpdatingPayment(true);
      const response = await fetch(`/api/orders/${params.orderId}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus,
          reference: paymentReference || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update payment");
      }

      toast.success("Paiement mis à jour avec succès");
      fetchOrderDetails();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour du paiement");
    } finally {
      setUpdatingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Commande non trouvée</p>
          <Button asChild>
            <Link href="/admin/commandes">Retour aux commandes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const deliveryAddress =
    typeof order.deliveryAddress === "string"
      ? JSON.parse(order.deliveryAddress)
      : order.deliveryAddress;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/commandes")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={STATUS_COLORS[order.status]}>
            {STATUS_LABELS[order.status]}
          </Badge>
          <Badge variant="outline" className="border-gray-300">
            {order.source === "ONLINE" ? "En ligne" : "En magasin"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">Nom:</span>{" "}
                {`${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
                  "N/A"}
              </div>
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {customer?.email || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Téléphone:</span>{" "}
                {customer?.phone || "N/A"}
              </div>
              {deliveryAddress && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-semibold">Adresse de livraison:</span>
                  </div>
                  <div className="ml-6 text-sm text-muted-foreground">
                    <p>{deliveryAddress.street || deliveryAddress.address}</p>
                    <p>
                      {deliveryAddress.city}, {deliveryAddress.state || ""}
                    </p>
                    <p>{deliveryAddress.country}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Articles de la commande ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead className="text-right">Sous-total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const variantDetails =
                      typeof item.variantDetails === "string"
                        ? JSON.parse(item.variantDetails)
                        : item.variantDetails;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>
                          {variantDetails?.size && `Taille: ${variantDetails.size}`}
                          {variantDetails?.color &&
                            ` | Couleur: ${variantDetails.color}`}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.priceAtPurchase.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${(item.quantity * item.priceAtPurchase).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payment Management - Mobile Money */}
          {order.paymentMethod === "MOBILE_MONEY" &&
            order.paymentStatus !== "PAID" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Gestion du Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference">Référence de transaction</Label>
                    <Input
                      id="reference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Ex: MPesa-ABC123456"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePaymentUpdate("PAID")}
                      disabled={updatingPayment}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marquer comme payé
                    </Button>
                    <Button
                      onClick={() => handlePaymentUpdate("FAILED")}
                      disabled={updatingPayment}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Marquer comme échoué
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frais de livraison</span>
                <span>${order.deliveryFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Méthode de paiement:
                  </span>
                  <span className="font-medium">
                    {order.paymentMethod === "MOBILE_MONEY"
                      ? "Mobile Money"
                      : "Paiement à la livraison"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Statut du paiement:
                  </span>
                  <Badge
                    variant="outline"
                    className={PAYMENT_STATUS_COLORS[order.paymentStatus]}
                  >
                    {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </Badge>
                </div>
                {order.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Référence:</span>
                    <span className="font-mono text-xs">
                      {order.paymentReference}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Gestion du Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusChanger
                currentStatus={order.status}
                onStatusChange={handleStatusChange}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
