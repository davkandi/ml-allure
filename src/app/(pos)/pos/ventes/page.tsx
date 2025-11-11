"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Download,
  Loader2,
  Receipt,
  Printer,
  Calendar,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

interface Sale {
  id: number;
  orderNumber: string;
  createdAt: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  customer: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    isGuest: boolean;
  } | null;
  items: any[];
  itemCount: number;
  transaction: {
    id: number;
    reference: string | null;
    provider: string | null;
  } | null;
}

interface Summary {
  totalSales: number;
  transactionCount: number;
  avgTransaction: number;
  cashSales: number;
  cashCount: number;
  mobileMoneySales: number;
  mobileMoneyCount: number;
}

export default function POSVentesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getDateRange = (filter: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (filter) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          return {
            startDate: customStartDate,
            endDate: customEndDate,
          };
        }
        return null;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const dateRange = getDateRange(dateFilter);
      if (!dateRange) {
        toast.error("Veuillez sélectionner une plage de dates valide");
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page: currentPage.toString(),
        limit: "20",
      });

      const response = await fetch(`/api/pos/sales?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSales(data.sales || []);
        setSummary(data.summary);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error("Erreur lors du chargement des ventes");
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Erreur lors du chargement des ventes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [dateFilter, currentPage, customStartDate, customEndDate]);

  const handleExportCSV = () => {
    if (sales.length === 0) {
      toast.error("Aucune vente à exporter");
      return;
    }

    const headers = [
      "N° Commande",
      "Date",
      "Heure",
      "Client",
      "Articles",
      "Total ($)",
      "Paiement",
      "Statut",
    ];

    const rows = sales.map((sale) => [
      sale.orderNumber,
      new Date(sale.createdAt).toLocaleDateString("fr-FR"),
      new Date(sale.createdAt).toLocaleTimeString("fr-FR"),
      sale.customer
        ? `${sale.customer.firstName || ""} ${sale.customer.lastName || ""}`.trim() ||
          sale.customer.phone ||
          "Client"
        : "Invité",
      sale.itemCount.toString(),
      sale.total.toFixed(2),
      sale.paymentMethod,
      sale.paymentStatus,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `ventes_${dateFilter}_${new Date().getTime()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Export CSV réussi");
  };

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(timestamp));
  };

  const getPaymentMethodLabel = (method: string) => {
    if (method === "CASH") return "Espèces";
    if (method.includes("MOBILE_MONEY") || method.includes("M-Pesa") || method.includes("Airtel") || method.includes("Orange")) {
      return "Mobile Money";
    }
    return method;
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method === "CASH") {
      return <CreditCard className="h-4 w-4" />;
    }
    return <Smartphone className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Historique des Ventes</h1>
            <p className="text-muted-foreground mt-1">
              Consultez et analysez vos ventes en magasin
            </p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" size="lg">
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Date Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Période:</span>
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="custom">Plage personnalisée</SelectItem>
                </SelectContent>
              </Select>

              {dateFilter === "custom" && (
                <>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-[180px]"
                  />
                  <span className="text-muted-foreground">à</span>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-[180px]"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total des Ventes
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${summary.totalSales.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pour la période sélectionnée
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Nombre de Transactions
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.transactionCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ventes complétées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Valeur Moyenne
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${summary.avgTransaction.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Par transaction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Répartition Paiements
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Espèces:</span>
                    <span className="font-semibold">
                      ${summary.cashSales.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mobile Money:</span>
                    <span className="font-semibold">
                      ${summary.mobileMoneySales.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  Aucune vente pour cette période
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Heure</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Articles</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead>Vendeur</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono font-medium">
                            {sale.orderNumber}
                          </TableCell>
                          <TableCell>{formatDate(sale.createdAt)}</TableCell>
                          <TableCell>{formatTime(sale.createdAt)}</TableCell>
                          <TableCell>
                            {sale.customer ? (
                              <div>
                                <div className="font-medium">
                                  {sale.customer.firstName || ""}{" "}
                                  {sale.customer.lastName || ""}
                                </div>
                                {sale.customer.phone && (
                                  <div className="text-sm text-muted-foreground">
                                    {sale.customer.phone}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Invité
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {sale.itemCount} article{sale.itemCount > 1 ? "s" : ""}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ${sale.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(sale.paymentMethod)}
                              <span className="text-sm">
                                {getPaymentMethodLabel(sale.paymentMethod)}
                              </span>
                            </div>
                            {sale.transaction?.provider && (
                              <div className="text-xs text-muted-foreground">
                                {sale.transaction.provider}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              Sarah Koné
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toast.info("Fonctionnalité à venir")
                                }
                              >
                                <Receipt className="h-4 w-4 mr-1" />
                                Voir reçu
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toast.info("Fonctionnalité à venir")
                                }
                              >
                                <Printer className="h-4 w-4 mr-1" />
                                Réimprimer
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} sur {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
