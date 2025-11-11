'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, MapPin, CreditCard, Phone, Mail, HelpCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OrderStatusTimeline } from '@/components/customer/OrderStatusTimeline';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: 'MOBILE_MONEY' | 'CASH_ON_DELIVERY';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  deliveryMethod: 'HOME_DELIVERY' | 'STORE_PICKUP';
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  timestamps: {
    CONFIRMED?: string;
    PROCESSING?: string;
    SHIPPED?: string;
    READY_FOR_PICKUP?: string;
    DELIVERED?: string;
    CANCELLED?: string;
  };
  items: {
    id: string;
    productName: string;
    variantDetails: {
      size: string;
      color: string;
    };
    quantity: number;
    priceAtPurchase: number;
    image: string;
  }[];
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  deliveryAddress?: {
    address: string;
    commune: string;
    instructions?: string;
  };
}

const PAYMENT_METHOD_LABELS = {
  MOBILE_MONEY: 'Mobile Money',
  CASH_ON_DELIVERY: 'Paiement à la livraison',
};

const PAYMENT_STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'bg-amber-500' },
  PAID: { label: 'Payé', color: 'bg-green-500' },
  FAILED: { label: 'Échoué', color: 'bg-red-500' },
  REFUNDED: { label: 'Remboursé', color: 'bg-blue-500' },
};

export default function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock order data
  const mockOrder: OrderDetail = {
    id: '1',
    orderNumber: resolvedParams.orderNumber,
    status: 'SHIPPED',
    paymentMethod: 'MOBILE_MONEY',
    paymentStatus: 'PAID',
    deliveryMethod: 'HOME_DELIVERY',
    subtotal: 120000,
    deliveryFee: 5000,
    total: 125000,
    createdAt: '2025-01-23T10:30:00Z',
    timestamps: {
      CONFIRMED: '2025-01-23T10:35:00Z',
      PROCESSING: '2025-01-23T14:20:00Z',
      SHIPPED: '2025-01-24T09:15:00Z',
    },
    items: [
      {
        id: '1',
        productName: 'Robe Élégante Soirée',
        variantDetails: { size: 'M', color: 'Noir' },
        quantity: 1,
        priceAtPurchase: 75000,
        image: '/images/dress-1.jpg',
      },
      {
        id: '2',
        productName: 'Sac à Main Cuir',
        variantDetails: { size: 'Unique', color: 'Marron' },
        quantity: 1,
        priceAtPurchase: 45000,
        image: '/images/bag-1.jpg',
      },
    ],
    customer: {
      firstName: 'Marie',
      lastName: 'Dubois',
      email: 'marie.dubois@email.com',
      phone: '+243 123 456 789',
    },
    deliveryAddress: {
      address: '123 Avenue de la Paix, Quartier Résidentiel',
      commune: 'Gombe',
      instructions: 'Sonner à l\'interphone',
    },
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setOrder(mockOrder);
      } catch (error) {
        toast.error('Erreur lors du chargement de la commande');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [resolvedParams.orderNumber]);

  const handleContactSupport = () => {
    toast.info('Support: +243 XXX XXX XXX');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Package className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Commande introuvable</h2>
          <p className="text-muted-foreground mb-6">
            Nous n'avons pas trouvé cette commande
          </p>
          <Button onClick={() => router.push('/suivi-commande')}>
            Retour au suivi
          </Button>
        </Card>
      </div>
    );
  }

  const paymentStatusConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => router.push('/suivi-commande')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au suivi
            </Button>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Commande {order.orderNumber}</h1>
                <p className="text-muted-foreground">
                  Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <Badge className={cn('text-white text-sm px-4 py-2', paymentStatusConfig.color)}>
                {paymentStatusConfig.label}
              </Badge>
            </div>
          </motion.div>

          {/* Status Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold mb-2">État de la commande</h2>
              <OrderStatusTimeline
                currentStatus={order.status}
                timestamps={order.timestamps}
                deliveryMethod={order.deliveryMethod}
              />
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Articles commandés
                  </h2>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={item.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="flex gap-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.productName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{item.productName}</h3>
                            <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                              <span>Taille: {item.variantDetails.size}</span>
                              <span>Couleur: {item.variantDetails.color}</span>
                              <span>Qté: {item.quantity}</span>
                            </div>
                            <p className="font-bold text-primary">
                              ${item.priceAtPurchase.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Delivery Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    {order.deliveryMethod === 'HOME_DELIVERY' ? (
                      <Truck className="w-5 h-5" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                    Informations de livraison
                  </h2>
                  {order.deliveryMethod === 'HOME_DELIVERY' && order.deliveryAddress ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Adresse</p>
                        <p className="font-medium">{order.deliveryAddress.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Commune</p>
                        <p className="font-medium">{order.deliveryAddress.commune}</p>
                      </div>
                      {order.deliveryAddress.instructions && (
                        <div>
                          <p className="text-sm text-muted-foreground">Instructions</p>
                          <p className="font-medium">{order.deliveryAddress.instructions}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 pt-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Contact</p>
                          <p className="font-medium">{order.customer.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium text-sm">{order.customer.email}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-semibold mb-2">Retrait en magasin</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        ML Allure Boutique<br />
                        Avenue de la Paix, Gombe<br />
                        Kinshasa, RDC
                      </p>
                      <p className="text-sm font-medium">
                        <Phone className="w-4 h-4 inline mr-1" />
                        {order.customer.phone}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Payment Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Paiement
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Méthode</p>
                      <p className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <Badge className={cn('text-white', paymentStatusConfig.color)}>
                        {paymentStatusConfig.label}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Total Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Récapitulatif</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frais de livraison</span>
                      <span className="font-medium">
                        {order.deliveryFee === 0 ? 'Gratuit' : `$${order.deliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Help Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleContactSupport}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Besoin d'aide?
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}