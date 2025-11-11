'use client';

import { motion } from 'framer-motion';
import { Check, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface TimelineStep {
  status: OrderStatus;
  label: string;
  icon: React.ElementType;
}

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  timestamps?: {
    [key in OrderStatus]?: string;
  };
  deliveryMethod?: 'HOME_DELIVERY' | 'STORE_PICKUP';
}

const TIMELINE_STEPS: TimelineStep[] = [
  { status: 'CONFIRMED', label: 'Confirmée', icon: Check },
  { status: 'PROCESSING', label: 'En préparation', icon: Package },
  { status: 'SHIPPED', label: 'Expédiée', icon: Truck },
  { status: 'DELIVERED', label: 'Livrée', icon: CheckCircle },
];

const TIMELINE_STEPS_PICKUP: TimelineStep[] = [
  { status: 'CONFIRMED', label: 'Confirmée', icon: Check },
  { status: 'PROCESSING', label: 'En préparation', icon: Package },
  { status: 'READY_FOR_PICKUP', label: 'Prête au retrait', icon: CheckCircle },
  { status: 'DELIVERED', label: 'Retirée', icon: CheckCircle },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  READY_FOR_PICKUP: 3,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
};

export function OrderStatusTimeline({ currentStatus, timestamps = {}, deliveryMethod = 'HOME_DELIVERY' }: OrderStatusTimelineProps) {
  const steps = deliveryMethod === 'STORE_PICKUP' ? TIMELINE_STEPS_PICKUP : TIMELINE_STEPS;
  const currentStatusIndex = STATUS_ORDER[currentStatus];

  if (currentStatus === 'CANCELLED') {
    return (
      <div className="py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center"
          >
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </motion.div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">Commande annulée</h3>
            {timestamps.CANCELLED && (
              <p className="text-sm text-muted-foreground mt-1">
                Annulée le {new Date(timestamps.CANCELLED).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === 'PENDING') {
    return (
      <div className="py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 bg-amber-100 dark:bg-amber-950 rounded-full flex items-center justify-center"
          >
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </motion.div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-amber-600 dark:text-amber-400">En attente de confirmation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Votre commande sera confirmée sous peu
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="relative">
        <div className="absolute top-8 left-0 right-0 h-1 bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${(currentStatusIndex / (steps.length - 1)) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="h-full bg-primary"
          />
        </div>

        <div className="relative grid grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const stepIndex = STATUS_ORDER[step.status];
            const isCompleted = currentStatusIndex >= stepIndex;
            const isCurrent = currentStatus === step.status;
            const timestamp = timestamps[step.status];

            return (
              <div key={step.status} className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center border-4 bg-background transition-all z-10',
                    isCompleted && 'border-primary bg-primary text-primary-foreground shadow-lg',
                    isCurrent && 'border-primary bg-primary/10 text-primary animate-pulse',
                    !isCompleted && !isCurrent && 'border-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <Icon className="w-7 h-7" />
                    </motion.div>
                  ) : (
                    <Icon className="w-7 h-7" />
                  )}
                </motion.div>

                <div className="mt-4 text-center">
                  <p
                    className={cn(
                      'font-semibold text-sm',
                      isCompleted && 'text-foreground',
                      isCurrent && 'text-primary',
                      !isCompleted && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  {timestamp && isCompleted && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xs text-muted-foreground mt-1"
                    >
                      {new Date(timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <div className="inline-block bg-primary/10 px-6 py-3 rounded-full">
          <p className="text-sm font-medium text-primary">
            {currentStatus === 'CONFIRMED' && '✓ Votre commande a été confirmée'}
            {currentStatus === 'PROCESSING' && '📦 Votre commande est en cours de préparation'}
            {currentStatus === 'READY_FOR_PICKUP' && '✨ Votre commande est prête au retrait'}
            {currentStatus === 'SHIPPED' && '🚚 Votre commande a été expédiée'}
            {currentStatus === 'DELIVERED' && '🎉 Votre commande a été livrée'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
