"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Users,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sample data - Replace with actual API calls
const salesData = [
  { date: "Lun", sales: 4200 },
  { date: "Mar", sales: 3800 },
  { date: "Mer", sales: 5100 },
  { date: "Jeu", sales: 4600 },
  { date: "Ven", sales: 6200 },
  { date: "Sam", sales: 7800 },
  { date: "Dim", sales: 6500 },
];

const orderStatusData = [
  { name: "En attente", value: 12, color: "hsl(var(--chart-2))" },
  { name: "Confirmée", value: 23, color: "hsl(var(--chart-1))" },
  { name: "En préparation", value: 15, color: "hsl(var(--chart-3))" },
  { name: "Livrée", value: 45, color: "hsl(var(--chart-4))" },
  { name: "Annulée", value: 5, color: "hsl(var(--chart-5))" },
];

const topProductsData = [
  { name: "Robe Élégante", sales: 245 },
  { name: "Chemise Homme", sales: 189 },
  { name: "Sac à Main", sales: 167 },
  { name: "Chaussures", sales: 145 },
  { name: "Bijoux", sales: 123 },
];

const recentOrders = [
  {
    id: "MLA-20250123-0001",
    customer: "Marie Tshimanga",
    date: "2025-01-23",
    total: "$150.00",
    status: "CONFIRMED",
  },
  {
    id: "MLA-20250123-0002",
    customer: "Jean Kabongo",
    date: "2025-01-23",
    total: "$320.50",
    status: "PROCESSING",
  },
  {
    id: "MLA-20250123-0003",
    customer: "Grace Mukendi",
    date: "2025-01-23",
    total: "$89.99",
    status: "PENDING",
  },
  {
    id: "MLA-20250123-0004",
    customer: "David Mbuyi",
    date: "2025-01-22",
    total: "$275.00",
    status: "SHIPPED",
  },
  {
    id: "MLA-20250123-0005",
    customer: "Sarah Nzuzi",
    date: "2025-01-22",
    total: "$420.00",
    status: "DELIVERED",
  },
];

const lowStockItems = [
  {
    product: "Robe Cocktail",
    variant: "Taille M, Rouge",
    stock: 3,
    id: "prod-1",
  },
  {
    product: "Chemise Lin",
    variant: "Taille L, Blanc",
    stock: 2,
    id: "prod-2",
  },
  {
    product: "Sac Cuir",
    variant: "Marron",
    stock: 4,
    id: "prod-3",
  },
  {
    product: "Chaussures Derby",
    variant: "Pointure 42, Noir",
    stock: 1,
    id: "prod-4",
  },
];

const getStatusBadge = (status: string) => {
  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    PENDING: { label: "En attente", variant: "secondary" },
    CONFIRMED: { label: "Confirmée", variant: "default" },
    PROCESSING: { label: "En préparation", variant: "outline" },
    SHIPPED: { label: "Expédiée", variant: "default" },
    DELIVERED: { label: "Livrée", variant: "default" },
    CANCELLED: { label: "Annulée", variant: "destructive" },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de votre plateforme ML Allure
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ventes Aujourd'hui"
          value="$4,250"
          change={{ value: 12.5, label: "vs hier" }}
          icon={DollarSign}
        />
        <MetricCard
          title="Nouvelles Commandes"
          value="23"
          change={{ value: 8.2, label: "vs hier" }}
          icon={ShoppingBag}
        />
        <MetricCard
          title="Stock Faible"
          value="12"
          change={{ value: -4.1, label: "cette semaine" }}
          icon={AlertTriangle}
          iconClassName="bg-destructive/10"
        />
        <MetricCard
          title="Total Clients"
          value="1,234"
          change={{ value: 5.3, label: "ce mois" }}
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ventes (7 derniers jours)</CardTitle>
            <CardDescription>Évolution des ventes quotidiennes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Ventes ($)"
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes par statut</CardTitle>
            <CardDescription>Distribution actuelle</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Produits les plus vendus</CardTitle>
          <CardDescription>Top 5 des meilleures ventes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar
                dataKey="sales"
                fill="hsl(var(--primary))"
                name="Ventes"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
          <CardDescription>Les 10 dernières commandes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.total}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Maj Statut
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Alertes Stock Faible</CardTitle>
          </div>
          <CardDescription>Produits nécessitant un réapprovisionnement</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Variante</TableHead>
                <TableHead>Stock Actuel</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell>{item.variant}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{item.stock} unités</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="default" size="sm">
                      Réapprovisionner
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}