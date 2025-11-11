"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface SearchResult {
  id: number;
  name: string;
  basePrice: number;
  images: string[] | null;
  variants: Array<{
    id: number;
    sku: string;
    size: string;
    color: string;
    stockQuantity: number;
  }>;
}

interface ProductSearchBarProps {
  onSelectProduct: (product: SearchResult) => void;
}

export function ProductSearchBar({ onSelectProduct }: ProductSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(query)}&isActive=true&limit=10`
        );
        const data = await response.json();
        setResults(data.products || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectProduct(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectProduct = (product: SearchResult) => {
    onSelectProduct(product);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getTotalStock = (variants: SearchResult["variants"]) => {
    return variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  };

  const getFirstImage = (images: string[] | null) => {
    if (!images || images.length === 0) return null;
    return images[0];
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Rechercher un produit (nom, SKU, code-barres)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-16 pl-14 pr-4 text-lg"
          autoFocus
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-[500px] overflow-auto"
          style={{ backgroundColor: 'hsl(var(--popover))', opacity: 1 }}
        >
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              Recherche en cours...
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Aucun produit trouvé
            </div>
          ) : (
            <div className="py-2">
              {results.map((product, index) => {
                const totalStock = getTotalStock(product.variants);
                const firstImage = getFirstImage(product.images);

                return (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 hover:bg-accent transition-colors",
                      selectedIndex === index && "bg-accent"
                    )}
                  >
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base">
                        {product.name}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {product.variants.length} variant
                        {product.variants.length > 1 ? "s" : ""} • Stock: {totalStock}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        ${product.basePrice.toFixed(2)}
                      </div>
                      {totalStock > 0 ? (
                        <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                          En stock
                        </div>
                      ) : (
                        <div className="text-xs text-red-600 dark:text-red-500 mt-1">
                          Rupture
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}