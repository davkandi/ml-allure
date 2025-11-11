'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Minus, 
  Plus, 
  ShoppingCart,
  Star,
  Truck,
  CreditCard,
  Package,
  Ruler,
  Heart,
  Share2
} from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { toast } from 'sonner';
import ProductCard from '@/components/customer/ProductCard';

interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  stockQuantity: number;
  additionalPrice: number;
  isActive: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  currency: string;
  images: string[];
  createdAt: Date | string;
  categoryId?: number;
}

interface ProductDetailClientProps {
  product: Product;
  variants: ProductVariant[];
  relatedProducts: Product[];
}

export default function ProductDetailClient({ 
  product, 
  variants,
  relatedProducts 
}: ProductDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [relatedScrollPosition, setRelatedScrollPosition] = useState(0);

  const addItem = useCartStore((state) => state.addItem);

  const images = product.images || ['/placeholder-product.jpg'];

  // Get unique sizes and colors from variants
  const uniqueSizes = Array.from(new Set(variants.filter(v => v.size).map(v => v.size)));
  const uniqueColors = Array.from(
    new Map(
      variants
        .filter(v => v.color)
        .map(v => [v.color, { color: v.color!, colorHex: v.colorHex }])
    ).values()
  );

  // Update selected variant when size or color changes
  useEffect(() => {
    if (selectedSize || selectedColor) {
      const matchingVariant = variants.find(
        v => 
          (!selectedSize || v.size === selectedSize) &&
          (!selectedColor || v.color === selectedColor) &&
          v.isActive
      );
      setSelectedVariant(matchingVariant || null);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedSize, selectedColor, variants]);

  const getCurrentPrice = () => {
    const basePrice = product.basePrice;
    if (selectedVariant) {
      return basePrice + (selectedVariant.additionalPrice || 0);
    }
    return basePrice;
  };

  const getStockStatus = () => {
    if (!selectedVariant) {
      return { available: false, message: 'Sélectionnez une taille et une couleur' };
    }
    if (selectedVariant.stockQuantity > 0) {
      return { 
        available: true, 
        message: `${selectedVariant.stockQuantity} en stock` 
      };
    }
    return { available: false, message: 'Épuisé' };
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Veuillez sélectionner une taille et une couleur');
      return;
    }

    if (selectedVariant.stockQuantity === 0) {
      toast.error('Ce produit est épuisé');
      return;
    }

    if (quantity > selectedVariant.stockQuantity) {
      toast.error(`Seulement ${selectedVariant.stockQuantity} article(s) disponible(s)`);
      return;
    }

    // Add to cart store
    const cartItem = {
      id: Date.now(), // Temporary ID for local cart
      cartId: 0,
      productId: product.id,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: getCurrentPrice(),
        salePrice: null,
        sku: selectedVariant.sku,
        stock: selectedVariant.stockQuantity,
        images: product.images,
        featured: false,
        categoryId: product.categoryId || 0,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date()
      },
      quantity,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    addItem(cartItem);
    toast.success('Produit ajouté au panier', {
      description: `${quantity} × ${product.name}`,
    });
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    const maxQuantity = selectedVariant?.stockQuantity || 10;
    if (newQuantity >= 1 && newQuantity <= Math.min(10, maxQuantity)) {
      setQuantity(newQuantity);
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="text-sm text-muted-foreground">
          <Link href="/customer" className="hover:text-foreground">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/boutique" className="hover:text-foreground">Boutique</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      {/* Main Product Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column - Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <Card className="overflow-hidden relative aspect-[3/4] bg-muted">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={images[currentImageIndex]}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                    onClick={() => setCurrentImageIndex((prev) => 
                      prev === 0 ? images.length - 1 : prev - 1
                    )}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                    onClick={() => setCurrentImageIndex((prev) => 
                      prev === images.length - 1 ? 0 : prev + 1
                    )}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </Card>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex 
                        ? 'border-primary shadow-lg scale-105' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">{product.name}</h1>
              
              {/* Star Rating Placeholder */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(12 avis)</span>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-bold text-primary">
                  ${getCurrentPrice().toFixed(2)}
                </span>
              </div>

              {/* Short Description */}
              {product.description && (
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {product.description.substring(0, 200)}
                  {product.description.length > 200 && '...'}
                </p>
              )}
            </div>

            {/* Size Selector */}
            {uniqueSizes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Taille: {selectedSize && <span className="text-primary">{selectedSize}</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      size="lg"
                      onClick={() => setSelectedSize(size!)}
                      className="min-w-[60px]"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {uniqueColors.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Couleur: {selectedColor && <span className="text-primary">{selectedColor}</span>}
                </label>
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map(({ color, colorHex }) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedColor === color
                          ? 'border-primary shadow-md scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {colorHex && (
                        <div
                          className="w-6 h-6 rounded-full border border-border"
                          style={{ backgroundColor: colorHex }}
                        />
                      )}
                      <span className="text-sm font-medium">{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="py-3 px-4 bg-muted/50 rounded-lg">
              <p className={`text-sm font-medium ${stockStatus.available ? 'text-green-600' : 'text-destructive'}`}>
                {stockStatus.message}
              </p>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-semibold mb-3">Quantité</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || !selectedVariant}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={
                    quantity >= 10 || 
                    !selectedVariant || 
                    quantity >= (selectedVariant?.stockQuantity || 0)
                  }
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full text-lg h-14"
                onClick={handleAddToCart}
                disabled={!stockStatus.available}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {stockStatus.available ? 'Ajouter au panier' : 'Épuisé'}
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" size="lg" className="flex-1">
                  <Heart className="w-5 h-5 mr-2" />
                  Favoris
                </Button>
                <Button variant="outline" size="lg" className="flex-1">
                  <Share2 className="w-5 h-5 mr-2" />
                  Partager
                </Button>
              </div>
            </div>

            {/* Size Guide Link */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="w-full">
                  <Ruler className="w-4 h-4 mr-2" />
                  Guide des tailles
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Guide des tailles</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Consultez notre guide des tailles pour trouver la taille parfaite.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-4">Taille</th>
                          <th className="text-left py-2 px-4">Tour de poitrine (cm)</th>
                          <th className="text-left py-2 px-4">Tour de taille (cm)</th>
                          <th className="text-left py-2 px-4">Tour de hanches (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium">S</td>
                          <td className="py-2 px-4">84-88</td>
                          <td className="py-2 px-4">64-68</td>
                          <td className="py-2 px-4">88-92</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium">M</td>
                          <td className="py-2 px-4">88-92</td>
                          <td className="py-2 px-4">68-72</td>
                          <td className="py-2 px-4">92-96</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium">L</td>
                          <td className="py-2 px-4">92-96</td>
                          <td className="py-2 px-4">72-76</td>
                          <td className="py-2 px-4">96-100</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium">XL</td>
                          <td className="py-2 px-4">96-100</td>
                          <td className="py-2 px-4">76-80</td>
                          <td className="py-2 px-4">100-104</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delivery & Payment Info */}
            <Card className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Livraison disponible à Kinshasa</p>
                  <p className="text-xs text-muted-foreground">Délai de livraison: 2-5 jours ouvrables</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Modes de paiement acceptés</p>
                  <p className="text-xs text-muted-foreground">Mobile Money, Paiement à la livraison</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Retour gratuit sous 7 jours</p>
                  <p className="text-xs text-muted-foreground">Si le produit ne vous convient pas</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-xl mx-auto">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="livraison">Livraison</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-8">
              <Card className="p-8">
                <h3 className="text-2xl font-bold mb-4">Description du produit</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                  {product.description || (
                    <p>
                      Découvrez ce magnifique produit de la collection ML Allure. 
                      Confectionné avec soin et attention aux détails, ce produit allie 
                      élégance et confort pour vous offrir un style raffiné au quotidien.
                    </p>
                  )}
                  <p className="mt-4">
                    Que ce soit pour une occasion spéciale ou pour sublimer votre garde-robe 
                    quotidienne, ce produit saura répondre à vos attentes les plus exigeantes.
                  </p>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="informations" className="mt-8">
              <Card className="p-8">
                <h3 className="text-2xl font-bold mb-4">Informations produit</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Composition</h4>
                      <p className="text-sm text-muted-foreground">
                        100% Coton de qualité supérieure
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Entretien</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Lavage en machine à 30°C</li>
                        <li>• Ne pas utiliser de javel</li>
                        <li>• Séchage à basse température</li>
                        <li>• Repassage à fer moyen</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Référence</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedVariant?.sku || 'Sélectionnez une variante'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Origine</h4>
                      <p className="text-sm text-muted-foreground">
                        Fabriqué avec soin
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="livraison" className="mt-8">
              <Card className="p-8">
                <h3 className="text-2xl font-bold mb-4">Livraison & Retours</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Zones de livraison</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Nous livrons actuellement dans toute la ville de Kinshasa:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Gombe</li>
                      <li>• Limete</li>
                      <li>• Kinshasa</li>
                      <li>• Ngaliema</li>
                      <li>• Et tous les autres quartiers</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Délais de livraison</h4>
                    <p className="text-sm text-muted-foreground">
                      Les commandes sont généralement livrées sous 2 à 5 jours ouvrables 
                      après confirmation du paiement.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Frais de livraison</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Livraison standard: $5.00</li>
                      <li>• Livraison express (24h): $10.00</li>
                      <li>• Livraison gratuite pour les commandes supérieures à $100.00</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Politique de retour</h4>
                    <p className="text-sm text-muted-foreground">
                      Vous disposez de 7 jours pour retourner votre article s'il ne vous convient pas. 
                      Le produit doit être dans son état d'origine avec toutes les étiquettes.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Produits similaires</h2>
            <div className="relative">
              <div className="overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex gap-4 min-w-max px-2">
                  {relatedProducts.map((relatedProduct) => (
                    <div key={relatedProduct.id} className="w-[280px]">
                      <ProductCard product={relatedProduct} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}