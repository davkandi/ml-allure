'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  total: number;
  createdAt: string;
  itemCount: number;
}

const STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'bg-amber-500', icon: Clock },
  CONFIRMED: { label: 'Confirmée', color: 'bg-blue-500', icon: CheckCircle },
  PROCESSING: { label: 'En préparation', color: 'bg-purple-500', icon: Package },
  READY_FOR_PICKUP: { label: 'Prête', color: 'bg-indigo-500', icon: CheckCircle },
  SHIPPED: { label: 'Expédiée', color: 'bg-cyan-500', icon: Package },
  DELIVERED: { label: 'Livrée', color: 'bg-green-500', icon: CheckCircle },
  CANCELLED: { label: 'Annulée', color: 'bg-red-500', icon: XCircle },
};

export default function OrderTrackingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [guestOrderNumber, setGuestOrderNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [guestOrder, setGuestOrder] = useState<Order | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data for demonstration
  const mockUserOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'MLA-20250123-0001',
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      total: 125000,
      createdAt: '2025-01-23T10:30:00Z',
      itemCount: 3,
    },
    {
      id: '2',
      orderNumber: 'MLA-20250120-0042',
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      total: 85000,
      createdAt: '2025-01-20T14:15:00Z',
      itemCount: 2,
    },
    {
      id: '3',
      orderNumber: 'MLA-20250118-0033',
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      total: 65000,
      createdAt: '2025-01-18T09:45:00Z',
      itemCount: 1,
    },
    {
      id: '4',
      orderNumber: 'MLA-20250115-0028',
      status: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      total: 45000,
      createdAt: '2025-01-15T16:20:00Z',
      itemCount: 1,
    },
  ];

  // Fetch guest order
  const handleGuestTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestOrderNumber.trim()) {
      toast.error('Veuillez entrer un numéro de commande');
      return;
    }

    setIsSearching(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const mockOrder: Order = {
        id: '1',
        orderNumber: guestOrderNumber,
        status: 'SHIPPED',
        paymentStatus: 'PAID',
        total: 125000,
        createdAt: '2025-01-23T10:30:00Z',
        itemCount: 3,
      };
      
      setGuestOrder(mockOrder);
      toast.success('Commande trouvée!');
    } catch (error) {
      toast.error('Commande introuvable');
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setUserOrders(mockUserOrders);
    } catch (error) {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user orders on mount
  useState(() => {
    if (isAuthenticated) {
      fetchUserOrders();
    }
  });

  // Filter orders
  const filteredOrders = userOrders.filter(order => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'READY_FOR_PICKUP'].includes(order.status);
    if (filterStatus === 'delivered') return order.status === 'DELIVERED';
    if (filterStatus === 'cancelled') return order.status === 'CANCELLED';
    return true;
  });

  const handleViewDetails = (orderNumber: string) => {
    router.push(`/commandes/${orderNumber}`);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold mb-4"
            >
              Suivi de Commande
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg"
            >
              Suivez l'état de vos commandes en temps réel
            </motion.p>
          </div>

          {!isAuthenticated ? (
            /* Mode 1: Guest Tracking */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-8 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Rechercher votre commande</h2>
                  <p className="text-muted-foreground">
                    Entrez votre numéro de commande pour suivre son état
                  </p>
                </div>

                <form onSubmit={handleGuestTracking} className="space-y-6">
                  <div>
                    <Label htmlFor="orderNumber">Numéro de commande</Label>
                    <Input
                      id="orderNumber"
                      placeholder="Ex: MLA-20250123-0001"
                      value={guestOrderNumber}
                      onChange={(e) => setGuestOrderNumber(e.target.value)}
                      className="mt-2 text-lg h-12"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Le numéro de commande se trouve dans votre email de confirmation
                    </p>
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg" disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2"
                        >
                          <Search className="w-5 h-5" />
                        </motion.div>
                        Recherche en cours...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Suivre ma commande
                      </>
                    )}
                  </Button>
                </form>

                {guestOrder && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <Separator className="mb-6" />
                    <OrderCard order={guestOrder} onViewDetails={handleViewDetails} />
                  </motion.div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Vous avez un compte?</p>
                  <Button variant="outline" onClick={() => router.push('/connexion')}>
                    Se connecter pour voir toutes vos commandes
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            /* Mode 2: Logged-in User Orders */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Mes Commandes</h2>
                    <p className="text-muted-foreground">
                      Gérez et suivez toutes vos commandes
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {userOrders.length} commande{userOrders.length > 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Filter Tabs */}
                <Tabs value={filterStatus} onValueChange={setFilterStatus} className="mb-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">
                      Toutes ({userOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="active">
                      En cours ({userOrders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'READY_FOR_PICKUP'].includes(o.status)).length})
                    </TabsTrigger>
                    <TabsTrigger value="delivered">
                      Livrées ({userOrders.filter(o => o.status === 'DELIVERED').length})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled">
                      Annulées ({userOrders.filter(o => o.status === 'CANCELLED').length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Orders List */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Package className="w-8 h-8 text-primary" />
                    </motion.div>
                    <p className="ml-3 text-muted-foreground">Chargement des commandes...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                    <p className="text-muted-foreground mb-6">
                      Vous n'avez pas encore de commandes dans cette catégorie
                    </p>
                    <Button onClick={() => router.push('/boutique')}>
                      Découvrir nos produits
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {filteredOrders.map((order, index) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <OrderCard order={order} onViewDetails={handleViewDetails} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onViewDetails: (orderNumber: string) => void;
}

function OrderCard({ order, onViewDetails }: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Section */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-bold text-lg">{order.orderNumber}</h3>
            <Badge className={cn('text-white', statusConfig.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Articles</p>
              <p className="font-medium">{order.itemCount} article{order.itemCount > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-bold text-primary">${order.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Right Section - Action Button */}
        <Button onClick={() => onViewDetails(order.orderNumber)} variant="outline" className="md:w-auto w-full">
          <Eye className="w-4 h-4 mr-2" />
          Voir les détails
        </Button>
      </div>
    </Card>
  );
}