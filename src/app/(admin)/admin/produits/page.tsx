"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Eye,
  Power,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  images: string | string[];
  isActive: number | boolean;
  isFeatured: number | boolean;
  category: {
    name: string;
  } | null;
  variants: {
    stockQuantity: number;
  }[];
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 20;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products || []);
      } else {
        toast.error("Impossible de charger les produits");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Produit supprimé avec succès");
        fetchProducts();
      } else {
        const data = await response.json();
        toast.error(data.message || "Impossible de supprimer le produit");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Une erreur s'est produite");
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: number | boolean) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Produit ${!currentStatus ? "activé" : "désactivé"}`);
        fetchProducts();
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Une erreur s'est produite");
    }
  };

  const parseImages = (images: string | string[] | null): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try {
      return JSON.parse(images);
    } catch {
      return [];
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const isProductActive = typeof product.isActive === 'number' ? product.isActive === 1 : product.isActive;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isProductActive) ||
      (statusFilter === "inactive" && !isProductActive);

    return matchesSearch && matchesStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortField === "price") {
      return sortOrder === "asc"
        ? a.basePrice - b.basePrice
        : b.basePrice - a.basePrice;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTotalStock = (variants: { stockQuantity: number }[]) => {
    return variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestion des Produits
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre catalogue de produits
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/produits/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  Nom
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("price")}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  Prix
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead className="text-center">Stock Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">Aucun produit trouvé</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => {
                const productImages = parseImages(product.images);
                const isProductActive = typeof product.isActive === 'number' ? product.isActive === 1 : product.isActive;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      {productImages.length > 0 ? (
                        <Image
                          src={productImages[0]}
                          alt={product.name}
                          width={50}
                          height={50}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-[50px] h-[50px] rounded-md bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category?.name || "Sans catégorie"}</TableCell>
                    <TableCell>${product.basePrice.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          getTotalStock(product.variants) < 10
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {getTotalStock(product.variants)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isProductActive ? "default" : "secondary"}>
                        {isProductActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/produits/${product.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/produits/${product.id}/modifier`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(product.id, isProductActive)
                            }
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {isProductActive ? "Désactiver" : "Activer"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </p>
          <div className="flex gap-2">
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}