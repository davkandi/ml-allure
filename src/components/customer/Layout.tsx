"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Home } from "lucide-react";

interface CustomerLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
  isLoading?: boolean;
}

// Map routes to French breadcrumb labels
const routeLabels: Record<string, string> = {
  customer: "Accueil",
  hommes: "Hommes",
  femmes: "Femmes",
  accessoires: "Accessoires",
  chaussures: "Chaussures",
  sacs: "Sacs",
  bijoux: "Bijoux",
  panier: "Panier",
  compte: "Mon Compte",
  commandes: "Mes Commandes",
  recherche: "Recherche",
  "a-propos": "À Propos",
  contact: "Contact",
  "politique-retour": "Politique de Retour",
  conditions: "Conditions d'Utilisation",
  aide: "Aide",
  suivi: "Suivi de commande",
};

const generateBreadcrumbs = (pathname: string) => {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs = [];

  let currentPath = "";
  for (let i = 0; i < paths.length; i++) {
    const segment = paths[i];
    currentPath += `/${segment}`;
    
    // Skip if it's just a dynamic ID (numbers or UUIDs)
    if (/^[0-9a-f-]+$/i.test(segment)) {
      continue;
    }

    breadcrumbs.push({
      label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: currentPath,
      isLast: i === paths.length - 1,
    });
  }

  return breadcrumbs;
};

export const CustomerLayout = ({
  children,
  showBreadcrumbs = true,
  isLoading = false,
}: CustomerLayoutProps) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const breadcrumbs = generateBreadcrumbs(pathname);
  const showBreadcrumbsSection = showBreadcrumbs && breadcrumbs.length > 0 && pathname !== "/customer";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Breadcrumbs */}
      {mounted && showBreadcrumbsSection && (
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/customer" className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    <span className="sr-only">Accueil</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-2">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          </div>
        )}
        {children}
      </main>

      <Footer />
    </div>
  );
};

// Loading Skeleton Components for common patterns
export const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="aspect-[3/4] w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    ))}
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="grid md:grid-cols-2 gap-8">
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-md" />
        ))}
      </div>
    </div>
    <div className="space-y-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);
