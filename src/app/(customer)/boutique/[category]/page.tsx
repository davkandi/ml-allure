'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/customer/ProductCard';
import { ChevronLeft, ChevronRight, Filter, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

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
  categoryId: number;
  images: string[];
  createdAt: string;
  variants?: ProductVariant[];
}

const SIZES = ['S', 'M', 'L', 'XL', '36', '38', '40', '42'];
const ITEMS_PER_PAGE = 12;

export default function CategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const categorySlug = params.category as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Available colors from products
  const [availableColors, setAvailableColors] = useState<Array<{ color: string; hex: string }>>([]);

  // Load filters from URL on mount
  useEffect(() => {
    const minPrice = Number(searchParams.get('minPrice')) || 0;
    const maxPrice = Number(searchParams.get('maxPrice')) || 500;
    const sizes = searchParams.get('sizes')?.split(',').filter(Boolean) || [];
    const colors = searchParams.get('colors')?.split(',').filter(Boolean) || [];
    const avail = searchParams.get('availability')?.split(',').filter(Boolean) || [];
    const sort = searchParams.get('sort') || 'newest';
    const page = Number(searchParams.get('page')) || 1;

    setPriceRange([minPrice, maxPrice]);
    setSelectedSizes(sizes);
    setSelectedColors(colors);
    setAvailability(avail);
    setSortBy(sort);
    setCurrentPage(page);
  }, [searchParams]);

  // Fetch category
  useEffect(() => {
    fetch(`/api/categories?slug=${categorySlug}`)
      .then(res => res.json())
      .then(data => setCategory(data))
      .catch(console.error);
  }, [categorySlug]);

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    if (!category) return;
    
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.set('limit', '100'); // Fetch more for client-side filtering
      params.set('isActive', 'true');
      params.set('categoryId', String(category.id));
      
      if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
      if (priceRange[1] < 500) params.set('maxPrice', String(priceRange[1]));

      // Sort mapping
      if (sortBy === 'price-asc') {
        params.set('sort', 'basePrice');
        params.set('order', 'asc');
      } else if (sortBy === 'price-desc') {
        params.set('sort', 'basePrice');
        params.set('order', 'desc');
      } else if (sortBy === 'name') {
        params.set('sort', 'name');
        params.set('order', 'asc');
      } else {
        params.set('sort', 'createdAt');
        params.set('order', 'desc');
      }

      // Fetch products
      const productsRes = await fetch(`/api/products?${params}`);
      let allProducts = await productsRes.json();

      // Parse images if needed
      allProducts = allProducts.map((p: any) => ({
        ...p,
        images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images || []
      }));

      // Fetch variants for all products
      const variantsRes = await fetch('/api/product-variants');
      const allVariants = await variantsRes.json();

      // Attach variants to products
      allProducts = allProducts.map((product: Product) => ({
        ...product,
        variants: allVariants.filter((v: ProductVariant) => v.productId === product.id)
      }));

      // Client-side filtering for size, color, availability
      let filtered = allProducts;

      // Filter by size
      if (selectedSizes.length > 0) {
        filtered = filtered.filter((p: Product) => 
          p.variants?.some(v => selectedSizes.includes(v.size || ''))
        );
      }

      // Filter by color
      if (selectedColors.length > 0) {
        filtered = filtered.filter((p: Product) => 
          p.variants?.some(v => selectedColors.includes(v.color || ''))
        );
      }

      // Filter by availability
      if (availability.includes('En stock')) {
        filtered = filtered.filter((p: Product) => 
          p.variants?.some(v => v.stockQuantity > 0)
        );
      }
      if (availability.includes('Épuisé')) {
        filtered = filtered.filter((p: Product) => 
          p.variants?.every(v => v.stockQuantity === 0)
        );
      }

      setTotalProducts(filtered.length);

      // Apply pagination
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      setProducts(filtered.slice(start, end));

      // Extract unique colors from all products in category
      const colors = new Map<string, string>();
      allProducts.forEach((p: Product) => {
        p.variants?.forEach((v: ProductVariant) => {
          if (v.color && v.colorHex) {
            colors.set(v.color, v.colorHex);
          }
        });
      });
      setAvailableColors(Array.from(colors.entries()).map(([color, hex]) => ({ color, hex })));

    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [category, currentPage, priceRange, sortBy, selectedSizes, selectedColors, availability]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL with filters
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
    if (priceRange[1] < 500) params.set('maxPrice', String(priceRange[1]));
    if (selectedSizes.length > 0) params.set('sizes', selectedSizes.join(','));
    if (selectedColors.length > 0) params.set('colors', selectedColors.join(','));
    if (availability.length > 0) params.set('availability', availability.join(','));
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', String(currentPage));

    router.push(`/customer/boutique/${categorySlug}?${params.toString()}`, { scroll: false });
  }, [priceRange, selectedSizes, selectedColors, availability, sortBy, currentPage, categorySlug, router]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Reset all filters
  const resetFilters = () => {
    setPriceRange([0, 500]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setAvailability([]);
    setCurrentPage(1);
    router.push(`/customer/boutique/${categorySlug}`);
  };

  // Toggle handlers
  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
    setCurrentPage(1);
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
    setCurrentPage(1);
  };

  const toggleAvailability = (avail: string) => {
    setAvailability(prev => 
      prev.includes(avail) ? prev.filter(a => a !== avail) : [...prev, avail]
    );
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  // Filter Sidebar Component
  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Prix</h3>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={(val) => {
              setPriceRange(val as [number, number]);
              setCurrentPage(1);
            }}
            min={0}
            max={500}
            step={10}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{priceRange[0]} USD</span>
            <span>{priceRange[1]} USD</span>
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Tailles</h3>
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map(size => (
            <Button
              key={size}
              variant={selectedSizes.includes(size) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSize(size)}
              className="h-10"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* Colors */}
      {availableColors.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4">Couleurs</h3>
          <div className="flex flex-wrap gap-3">
            {availableColors.map(({ color, hex }) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  selectedColors.includes(color) 
                    ? 'border-primary ring-2 ring-primary ring-offset-2' 
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: hex }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Disponibilité</h3>
        <div className="space-y-3">
          {['En stock', 'Épuisé'].map(avail => (
            <div key={avail} className="flex items-center space-x-2">
              <Checkbox
                id={`avail-${avail}`}
                checked={availability.includes(avail)}
                onCheckedChange={() => toggleAvailability(avail)}
              />
              <Label htmlFor={`avail-${avail}`} className="text-sm cursor-pointer">
                {avail}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={resetFilters}
      >
        Réinitialiser les filtres
      </Button>
    </div>
  );

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Category Header */}
      <div className="bg-muted py-12 mb-8">
        <div className="container mx-auto px-4">
          <Link 
            href="/customer/boutique" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la boutique
          </Link>
          <h1 className="text-4xl font-bold mb-3">{category.name}</h1>
          {category.description && (
            <p className="text-lg text-muted-foreground max-w-3xl">
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-1/4 shrink-0">
            <Card className="sticky top-4">
              <CardContent className="pt-6">
                <FilterSidebar />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="text-sm text-muted-foreground">
                {totalProducts} produit{totalProducts !== 1 ? 's' : ''} trouvé{totalProducts !== 1 ? 's' : ''}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Mobile Filter Toggle */}
                <Button
                  variant="outline"
                  className="lg:hidden flex-1 sm:flex-none"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Nouveautés</SelectItem>
                    <SelectItem value="price-asc">Prix croissant</SelectItem>
                    <SelectItem value="price-desc">Prix décroissant</SelectItem>
                    <SelectItem value="name">Nom A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[3/4] w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <Card className="p-12">
                <p className="text-center text-muted-foreground">
                  Aucun produit trouvé dans cette catégorie avec ces filtres
                </p>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="h-full w-80 bg-background overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Filtres</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <FilterSidebar />
          </motion.div>
        </div>
      )}
    </div>
  );
}
