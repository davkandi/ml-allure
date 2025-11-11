"use client";

// CACHE BUST: Force complete rebuild - v2
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Download,
  Search,
  History,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import Link from "next/link";
// CRITICAL: Using sonner toast system
import { toast } from "sonner";

// Dynamic import for modal component
const StockAdjustmentModal = dynamic(
  () => import("@/components/admin/StockAdjustmentModal").then((mod) => ({ default: mod.StockAdjustmentModal })),
  {
    loading: () => null,
    ssr: false,
  }
);

interface InventoryItem {
  id: number;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  stockQuantity: number;
  additionalPrice: number;
  isActive: boolean;
  updatedAt: number;
  productId: number;
  productName: string;
  productSlug: string;
  basePrice: number;
  categoryId: number | null;
  categoryName: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function InventairePage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchCategories();
    fetchInventory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inventory, searchQuery, categoryFilter, lowStockOnly, outOfStockOnly]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (lowStockOnly) params.append("lowStockOnly", "true");
      if (outOfStockOnly) params.append("outOfStockOnly", "true");
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/inventory?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch inventory");

      const data = await response.json();
      setInventory(data.variants || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Impossible de charger l'inventaire");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...inventory];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.size?.toLowerCase().includes(query) ||
          item.color?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.categoryName === categoryFilter);
    }

    // Stock filters
    if (lowStockOnly) {
      filtered = filtered.filter(
        (item) => item.stockQuantity > 0 && item.stockQuantity <= 5
      );
    }

    if (outOfStockOnly) {
      filtered = filtered.filter((item) => item.stockQuantity === 0);
    }

    setFilteredInventory(filtered);
    setCurrentPage(1);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return {
        label: "Épuisé",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: XCircle,
      };
    } else if (quantity <= 5) {
      return {
        label: "Stock faible",
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        icon: AlertTriangle,
      };
    } else {
      return {
        label: "En stock",
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: CheckCircle,
      };
    }
  };

  const handleAdjustStock = (variant: InventoryItem) => {
    setSelectedVariant(variant);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      "Produit",
      "Taille",
      "Couleur",
      "SKU",
      "Stock Actuel",
      "Statut",
      "Catégorie",
    ];

    const rows = filteredInventory.map((item) => [
      item.productName,
      item.size || "-",
      item.color || "-",
      item.sku,
      item.stockQuantity.toString(),
      getStockStatus(item.stockQuantity).label,
      item.categoryName || "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventaire-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredInventory.slice(startIndex, endIndex);

  // Stats
  const totalItems = inventory.length;
  const outOfStock = inventory.filter((i) => i.stockQuantity === 0).length;
  const lowStock = inventory.filter(
    (i) => i.stockQuantity > 0 && i.stockQuantity <= 5
  ).length;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Gestion de l&apos;Inventaire</h1>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-600">
                Stock Faible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStock}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">
                Épuisé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStock}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par produit, SKU, taille, couleur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stock Filters */}
              <div className="flex gap-2">
                <Button
                  variant={lowStockOnly ? "default" : "outline"}
                  onClick={() => {
                    setLowStockOnly(!lowStockOnly);
                    if (outOfStockOnly) setOutOfStockOnly(false);
                  }}
                  className="flex-1 lg:flex-initial"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Stock faible
                </Button>
                <Button
                  variant={outOfStockOnly ? "default" : "outline"}
                  onClick={() => {
                    setOutOfStockOnly(!outOfStockOnly);
                    if (lowStockOnly) setLowStockOnly(false);
                  }}
                  className="flex-1 lg:flex-initial"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Épuisé
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Stock Actuel</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière MAJ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((item) => {
                    const status = getStockStatus(item.stockQuantity);
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {item.size && (
                              <span className="text-sm">Taille: {item.size}</span>
                            )}
                            {item.color && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Couleur: {item.color}</span>
                                {item.colorHex && (
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: item.colorHex }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {item.sku}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg font-bold">
                            {item.stockQuantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color} variant="secondary">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.updatedAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdjustStock(item)}
                            >
                              <Package className="mr-1 h-4 w-4" />
                              Ajuster
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link
                                href={`/admin/inventaire/${item.id}/historique`}
                              >
                                <History className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Affichage {startIndex + 1} à{" "}
                {Math.min(endIndex, filteredInventory.length)} sur{" "}
                {filteredInventory.length} produits
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Modal */}
      {selectedVariant && isModalOpen && (
        <StockAdjustmentModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          variant={selectedVariant}
          onSuccess={fetchInventory}
        />
      )}
    </div>
  );
}