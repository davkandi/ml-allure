"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Download,
  FileText,
  Mail,
  Loader2,
  Calendar,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface DailyReport {
  date: string;
  summary: {
    totalSales: number;
    totalTransactions: number;
    avgTransaction: number;
  };
  salesByHour: Array<{
    hour: number;
    sales: number;
    transactions: number;
  }>;
  paymentMethods: Array<{
    method: string;
    label: string;
    amount: number;
    count: number;
    percentage: string;
  }>;
  topProducts: Array<{
    productId: number;
    productName: string;
    quantity: number;
    revenue: number;
    image: string | null;
  }>;
  staffSales: Array<{
    staffId: number;
    staffName: string;
    sales: number;
    transactions: number;
  }>;
}

const COLORS = ["#e9436f", "#f0b251", "#e85565", "#d6a472", "#c97d8a"];

export default function POSRapportsPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportType, setReportType] = useState("daily");

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
      });

      const response = await fetch(`/api/pos/reports/daily?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReport(data);
      } else {
        toast.error("Erreur lors du chargement du rapport");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Erreur lors du chargement du rapport");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedDate, reportType]);

  const handleExportPDF = () => {
    toast.info("Export PDF - Fonctionnalité à venir");
  };

  const handleExportCSV = () => {
    if (!report) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    // Export top products
    const headers = ["Produit", "Quantité Vendue", "Revenu ($)"];
    const rows = report.topProducts.map((product) => [
      product.productName,
      product.quantity.toString(),
      product.revenue.toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `rapport_${selectedDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Export CSV réussi");
  };

  const handleEmailReport = () => {
    toast.info("Envoi par email - Fonctionnalité à venir");
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">
          Aucune donnée disponible
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rapports de Vente</h1>
            <p className="text-muted-foreground mt-1">
              Analyses et statistiques détaillées
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportPDF} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleEmailReport} variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Envoyer par Email
            </Button>
          </div>
        </div>

        {/* Date Selection */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Type de rapport:</span>
              </div>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Rapport journalier</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[200px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventes Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${report.summary.totalSales.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pour le {new Date(selectedDate).toLocaleDateString("fr-FR")}
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
                {report.summary.totalTransactions}
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
                ${report.summary.avgTransaction.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Par transaction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Sales by Hour Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Ventes par Heure</CardTitle>
            </CardHeader>
            <CardContent>
              {report.salesByHour.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.salesByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={formatHour}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      labelFormatter={formatHour}
                    />
                    <Bar dataKey="sales" fill="#e9436f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Aucune vente aujourd'hui</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Mode de Paiement</CardTitle>
            </CardHeader>
            <CardContent>
              {report.paymentMethods.length > 0 &&
              report.paymentMethods.some((pm) => pm.amount > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={report.paymentMethods.filter((pm) => pm.amount > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ label, percentage }) =>
                        `${label}: ${percentage}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                      nameKey="label"
                    >
                      {report.paymentMethods.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produits les Plus Vendus</CardTitle>
          </CardHeader>
          <CardContent>
            {report.topProducts.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rang</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Revenu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.topProducts.map((product, index) => (
                      <TableRow key={product.productId}>
                        <TableCell className="font-bold">
                          #{index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.productName}
                                  width={48}
                                  height={48}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium">
                              {product.productName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {product.quantity}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ${product.revenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  Aucune vente de produit aujourd'hui
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales by Staff */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par Vendeur</CardTitle>
          </CardHeader>
          <CardContent>
            {report.staffSales.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendeur</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Ventes Totales</TableHead>
                      <TableHead className="text-right">
                        Valeur Moyenne
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.staffSales.map((staff) => (
                      <TableRow key={staff.staffId}>
                        <TableCell className="font-medium">
                          {staff.staffName}
                        </TableCell>
                        <TableCell className="text-right">
                          {staff.transactions}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ${staff.sales.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          $
                          {staff.transactions > 0
                            ? (staff.sales / staff.transactions).toFixed(2)
                            : "0.00"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-muted-foreground">
                  Aucune donnée de performance aujourd'hui
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
