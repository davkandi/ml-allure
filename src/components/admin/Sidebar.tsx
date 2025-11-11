"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Warehouse,
  ShoppingCart,
  Users,
  Wallet,
  Settings,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  {
    name: "Tableau de bord",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Produits",
    href: "/admin/produits",
    icon: Package,
  },
  {
    name: "Catégories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    name: "Inventaire",
    href: "/admin/inventaire",
    icon: Warehouse,
  },
  {
    name: "Commandes",
    href: "/admin/commandes",
    icon: ShoppingCart,
  },
  {
    name: "Clients",
    href: "/admin/clients",
    icon: Users,
  },
  {
    name: "Transactions",
    href: "/admin/transactions",
    icon: Wallet,
  },
  {
    name: "Paramètres",
    href: "/admin/parametres",
    icon: Settings,
  },
];

interface SidebarProps {
  userRole?: string;
}

export const Sidebar = ({ userRole = "Admin" }: SidebarProps) => {
  const pathname = usePathname();
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [pendingOver24h, setPendingOver24h] = useState(0);

  useEffect(() => {
    fetchPendingPayments();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchPendingPayments, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch("/api/transactions?status=PENDING&limit=100");
      if (!response.ok) return;
      
      const transactions = await response.json();
      setPendingPaymentsCount(transactions.length);
      
      // Count pending > 24 hours
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      const over24h = transactions.filter(
        (t: any) => t.createdAt < twentyFourHoursAgo
      ).length;
      setPendingOver24h(over24h);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-40">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/mlallure_logo-1761303054607.jpg?width=8000&height=8000&resize=contain"
              alt="ML Allure"
              width={160}
              height={48}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* User Role Badge */}
        <div className="px-6 py-4 border-b border-sidebar-border">
          <Badge
            variant="secondary"
            className="w-full justify-center py-1.5 bg-sidebar-accent text-sidebar-accent-foreground"
          >
            {userRole}
          </Badge>
        </div>

        {/* Alert for pending payments > 24h */}
        {pendingOver24h > 0 && (
          <div className="mx-3 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-yellow-900">
                  {pendingOver24h} paiement{pendingOver24h > 1 ? "s" : ""}
                </p>
                <p className="text-yellow-700">En attente +24h</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const showBadge = item.href === "/admin/transactions" && pendingPaymentsCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {showBadge && (
                  <Badge 
                    variant="destructive" 
                    className="ml-auto text-xs px-1.5 py-0 h-5 min-w-[20px]"
                  >
                    {pendingPaymentsCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground text-center">
            ML Allure Admin
            <br />
            Version 1.0.0
          </div>
        </div>
      </div>
    </aside>
  );
};