"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ProductSearchBar } from "@/components/pos/ProductSearchBar";
import { POSProductCard } from "@/components/pos/POSProductCard";
import { usePOSStore } from "@/lib/store/usePOSStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  LogOut,
  Package,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// Dynamic imports for heavy components
const VariantSelectorModal = dynamic(
  () => import("@/components/pos/VariantSelectorModal").then((mod) => ({ default: mod.VariantSelectorModal })),
  {
    loading: () => null,
    ssr: false,
  }
);

const POSCheckout = dynamic(
  () => import("@/components/pos/POSCheckout").then((mod) => ({ default: mod.POSCheckout })),
  {
    loading: () => null,
    ssr: false,
  }
);

interface Product {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  images: string[] | null;
  categoryId: number | null;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  variants: Array<{
    id: number;
    sku: string;
    size: string;
    color: string;
    colorHex: string;
    stockQuantity: number;
    additionalPrice: number;
  }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function POSPage() {
  const router = useRouter();
  const {
    cart,
    currentUser,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    setCurrentUser,
    clearCurrentUser,
  } = usePOSStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock current user (in production, get from session/auth)
  useEffect(() => {
    if (!currentUser) {
      setCurrentUser({
        id: 1,
        name: "Sarah Koné",
        role: "SALES_STAFF",
      });
    }
  }, [currentUser, setCurrentUser]);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories?isActive=true");
        const data = await response.json();
        setCategories(data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Erreur lors du chargement des catégories");
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          isActive: "true",
          limit: "100",
        });

        if (selectedCategory !== "all") {
          const category = categories.find((c) => c.slug === selectedCategory);
          if (category) {
            params.append("categoryId", category.id.toString());
          }
        }

        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Erreur lors du chargement des produits");
      } finally {
        setIsLoading(false);
      }
    };

    if (categories.length > 0 || selectedCategory === "all") {
      fetchProducts();
    }
  }, [selectedCategory, categories]);

  const handleProductSelect = (product: Product) => {
    if (product.variants.length === 1) {
      const variant = product.variants[0];
      if (variant.stockQuantity > 0) {
        handleAddToCart(product, variant);
      } else {
        toast.error("Ce produit est en rupture de stock");
      }
    } else {
      setSelectedProduct(product);
      setVariantModalOpen(true);
    }
  };

  const handleAddToCart = (product: Product, variant: Product["variants"][0]) => {
    const price = product.basePrice + (variant.additionalPrice || 0);
    const firstImage = product.images && product.images.length > 0 ? product.images[0] : undefined;

    addToCart({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantDetails: {
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
      },
      price,
      image: firstImage,
    });

    toast.success("Produit ajouté au panier", {
      description: `${product.name} - ${variant.size} ${variant.color}`,
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Le panier est vide");
      return;
    }
    setCheckoutModalOpen(true);
  };

  const handleCheckoutSuccess = () => {
    clearCart();
    setCheckoutModalOpen(false);
    toast.success("Prêt pour une nouvelle vente!");
  };

  const handleLogout = () => {
    clearCurrentUser();
    clearCart();
    router.push("/");
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/mlallure_logo-1761303427391.jpg"
              alt="ML Allure Logo"
              width={160}
              height={60}
              priority
              className="h-12 w-auto object-contain"
            />
            <Separator orientation="vertical" className="h-8" />
            <Badge variant="secondary" className="text-base px-3 py-1">
              Point de Vente
            </Badge>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {formatDate(currentTime)}
              </div>
              <div className="text-lg font-semibold">{formatTime(currentTime)}</div>
            </div>

            <Separator orientation="vertical" className="h-10" />

            <div className="text-right">
              <div className="text-sm text-muted-foreground">Vendeur</div>
              <div className="font-semibold">{currentUser?.name || "Non connecté"}</div>
            </div>

            <Button variant="outline" size="lg" onClick={handleLogout}>
              <LogOut className="h-5 w-5 mr-2" />
              Fermer la caisse
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section: Product Selection (60%) */}
        <div className="flex-[3] flex flex-col border-r">
          {/* Search Bar */}
          <div className="p-6 border-b bg-card">
            <ProductSearchBar onSelectProduct={handleProductSelect} />
          </div>

          {/* Category Tabs */}
          <div className="px-6 py-4 border-b bg-card">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all" className="text-base px-6">
                  Toutes
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.slug}
                    className="text-base px-6"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Product Grid */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">
                    Aucun produit disponible
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <POSProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onShowVariants={(p) => {
                        setSelectedProduct(p);
                        setVariantModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Section: Cart & Checkout (40%) */}
        <div className="flex-[2] flex flex-col bg-muted/30">
          {/* Cart Header */}
          <div className="p-6 bg-card border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6" />
                <h2 className="text-2xl font-bold">Panier</h2>
                <Badge variant="secondary" className="text-base">
                  {getCartItemCount()} article{getCartItemCount() > 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">
                    Le panier est vide
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Recherchez ou sélectionnez des produits
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <Card key={item.variantId} className="p-4">
                      <div className="flex gap-3">
                        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.productName}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {item.productName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.variantDetails.size} - {item.variantDetails.color}
                          </p>
                          <p className="text-lg font-bold text-primary mt-1">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.variantId)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantity(item.variantId, item.quantity - 1)
                              }
                              className="h-8 w-8"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantity(item.variantId, item.quantity + 1)
                              }
                              className="h-8 w-8"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Sous-total
                        </span>
                        <span className="text-xl font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Cart Footer */}
          <div className="p-6 bg-card border-t space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-semibold">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>Total</span>
                <span className="text-primary">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="flex-1"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Vider
              </Button>
              <Button
                size="lg"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="flex-[2]"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Passer la commande
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Selector Modal */}
      {selectedProduct && variantModalOpen && (
        <VariantSelectorModal
          open={variantModalOpen}
          onOpenChange={setVariantModalOpen}
          product={selectedProduct}
          onSelectVariant={handleAddToCart}
        />
      )}

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <POSCheckout
          open={checkoutModalOpen}
          onOpenChange={setCheckoutModalOpen}
          cart={cart}
          total={getCartTotal()}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}