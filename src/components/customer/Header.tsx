"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, Menu, ChevronDown, LogOut, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/lib/store/authStore";
import CartButton from "@/components/customer/CartButton";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Accueil", href: "/customer" },
  { name: "Hommes", href: "/customer/hommes" },
  { name: "Femmes", href: "/customer/femmes" },
  { name: "Accessoires", href: "/customer/accessoires" },
  { name: "Chaussures", href: "/customer/chaussures" },
  { name: "Sacs", href: "/customer/sacs" },
  { name: "Bijoux", href: "/customer/bijoux" },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/customer/recherche?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-md"
          : "bg-background"
      )}
    >
      {/* Top Bar */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10 text-xs">
            <p className="text-muted-foreground hidden md:block">
              Livraison gratuite à Kinshasa pour les commandes de plus de 50$
            </p>
            <div className="flex items-center gap-4 ml-auto">
              <Link href="/customer/aide" className="text-muted-foreground hover:text-foreground transition-colors">
                Aide
              </Link>
              <Link href="/suivi-commande" className="text-muted-foreground hover:text-foreground transition-colors">
                Suivi de commande
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/customer" className="flex items-center">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/mlallure_logo-1761245055312.jpg?width=8000&height=8000&resize=contain"
              alt="ML Allure"
              width={150}
              height={50}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative group",
                  pathname === item.href
                    ? "text-primary"
                    : "text-foreground"
                )}
              >
                {item.name}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full",
                    pathname === item.href && "w-full"
                  )}
                />
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher des produits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </form>

          {/* Icons */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* User Account */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/compte" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mon Compte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/suivi-commande" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      Mes Commandes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/connexion">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Shopping Cart Button - New Component */}
            <CartButton />

            {/* Mobile Menu Toggle */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <Image
                      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/mlallure_logo-1761245055312.jpg?width=8000&height=8000&resize=contain"
                      alt="ML Allure"
                      width={120}
                      height={40}
                      className="h-8 w-auto"
                    />
                  </div>

                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </form>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col gap-2 flex-1">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "px-4 py-3 rounded-md text-sm font-medium transition-colors",
                          pathname === item.href
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile User Menu */}
                  {isAuthenticated && user ? (
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="px-4 py-2 mb-2">
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Link
                        href="/compte"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-md text-sm hover:bg-muted"
                      >
                        <User className="h-4 w-4" />
                        Mon Compte
                      </Link>
                      <Link
                        href="/suivi-commande"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-md text-sm hover:bg-muted"
                      >
                        <Package className="h-4 w-4" />
                        Mes Commandes
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-3 rounded-md text-sm hover:bg-muted text-destructive w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  ) : (
                    <div className="border-t border-border pt-4 mt-4">
                      <Button asChild className="w-full mb-2">
                        <Link href="/connexion" onClick={() => setIsMobileMenuOpen(false)}>
                          Se connecter
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/inscription" onClick={() => setIsMobileMenuOpen(false)}>
                          Créer un compte
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};