"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  MoreVertical,
  Eye,
  Printer,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Customer {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
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
  deliveryMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  source: string;
  createdAt: number;
  customer?: Customer;
  items?: OrderItem[];
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  CASH_ON_DELIVERY: "Paiement à la livraison",
};

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  HOME_DELIVERY: "Livraison à domicile",
  STORE_PICKUP: "Retrait en magasin",
};

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState("ALL");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, search, statusFilter, paymentMethodFilter, deliveryMethodFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders?limit=100");
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();

      const ordersWithDetails = await Promise.all(
        data.map(async (order: Order) => {
          const [customerRes, itemsRes] = await Promise.all([
            fetch(`/api/customers?id=${order.customerId}`),
            fetch(`/api/order-items?orderId=${order.id}&limit=100`),
          ]);

          const customer = customerRes.ok ? await customerRes.json() : null;
          const items = itemsRes.ok ? await itemsRes.json() : [];

          return { ...order, customer, items };
        })
      );

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`
            .toLowerCase()
            .includes(searchLower)
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (paymentMethodFilter !== "ALL") {
      filtered = filtered.filter(
        (order) => order.paymentMethod === paymentMethodFilter
      );
    }

    if (deliveryMethodFilter !== "ALL") {
      filtered = filtered.filter(
        (order) => order.deliveryMethod === deliveryMethodFilter
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusCount = (status: string) => {
    if (status === "ALL") return orders.length;
    return orders.filter((order) => order.status === status).length;
  };

  const toggleRowExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  const exportToCSV = () => {
    const headers = [
      "N° Commande",
      "Client",
      "Date",
      "Total",
      "Paiement",
      "Livraison",
      "Statut",
    ];

    const rows = filteredOrders.map((order) => [
      order.orderNumber,
      `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() ||
        "N/A",
      new Date(order.createdAt).toLocaleDateString("fr-FR"),
      `${order.total.toFixed(2)} USD`,
      PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod,
      DELIVERY_METHOD_LABELS[order.deliveryMethod] || order.deliveryMethod,
      STATUS_LABELS[order.status] || order.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `commandes-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="ALL">
            Toutes ({getStatusCount("ALL")})
          </TabsTrigger>
          <TabsTrigger value="PENDING">
            En attente ({getStatusCount("PENDING")})
          </TabsTrigger>
          <TabsTrigger value="CONFIRMED">
            Confirmées ({getStatusCount("CONFIRMED")})
          </TabsTrigger>
          <TabsTrigger value="PROCESSING">
            En préparation ({getStatusCount("PROCESSING")})
          </TabsTrigger>
          <TabsTrigger value="SHIPPED">
            Expédiées ({getStatusCount("SHIPPED")})
          </TabsTrigger>
          <TabsTrigger value="DELIVERED">
            Livrées ({getStatusCount("DELIVERED")})
          </TabsTrigger>
          <TabsTrigger value="CANCELLED">
            Annulées ({getStatusCount("CANCELLED")})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par N° ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={paymentMethodFilter}
              onValueChange={setPaymentMethodFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Méthode de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les méthodes</SelectItem>
                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                <SelectItem value="CASH_ON_DELIVERY">
                  Paiement à la livraison
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={deliveryMethodFilter}
              onValueChange={setDeliveryMethodFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Méthode de livraison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les méthodes</SelectItem>
                <SelectItem value="HOME_DELIVERY">
                  Livraison à domicile
                </SelectItem>
                <SelectItem value="STORE_PICKUP">Retrait en magasin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>N° Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Livraison</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Aucune commande trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <>
                    <TableRow key={order.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(order.id)}
                        >
                          {expandedRows.has(order.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        {`${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${order.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                      </TableCell>
                      <TableCell>
                        {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[order.status]}
                        >
                          {STATUS_LABELS[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/commandes/${order.id}`}
                                className="flex items-center"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info("Fonction d'impression à venir")
                              }
                            >
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info(
                                  "Fonction d'annulation disponible dans les détails"
                                )
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Annuler
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row - Order Items */}
                    {expandedRows.has(order.id) && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/30">
                          <div className="p-4">
                            <h4 className="font-semibold mb-3">
                              Articles de la commande
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Produit</TableHead>
                                  <TableHead>Variante</TableHead>
                                  <TableHead className="text-center">
                                    Quantité
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Prix unitaire
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Sous-total
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items?.map((item) => {
                                  const variantDetails =
                                    typeof item.variantDetails === "string"
                                      ? JSON.parse(item.variantDetails)
                                      : item.variantDetails;
                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell>{item.productName}</TableCell>
                                      <TableCell>
                                        {variantDetails?.size &&
                                          `Taille: ${variantDetails.size}`}
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
                                        $
                                        {(
                                          item.quantity * item.priceAtPurchase
                                        ).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
