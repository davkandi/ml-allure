'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, CreditCard, Truck, MapPin, Phone, Mail, User, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { orderService } from '@/services/orderService';
import { toast } from 'sonner';
import OrderSummary from './OrderSummary';
import { cn } from '@/lib/utils';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryMethod: 'home' | 'pickup';
  address?: string;
  commune?: string;
  deliveryInstructions?: string;
  saveInfo: boolean;
  paymentMethod: 'mobile' | 'cash';
}

const COMMUNES = [
  'Gombe',
  'Kinshasa',
  'Ngaliema',
  'Limete',
  'Matete',
  'Kalamu',
  'Kasa-Vubu',
  'Lemba',
  'Bandalungwa',
  'Bumbu',
  'Makala',
  'Ngiri-Ngiri',
  'Selembao',
];

const DELIVERY_FEES: Record<string, number> = {
  Gombe: 3,
  Kinshasa: 3,
  Ngaliema: 3.5,
  Limete: 4,
  Matete: 4.5,
  Kalamu: 4,
  'Kasa-Vubu': 4,
  Lemba: 4.5,
  Bandalungwa: 4,
  Bumbu: 5,
  Makala: 4.5,
  'Ngiri-Ngiri': 4.5,
  Selembao: 5,
};

const STEPS = [
  { id: 1, name: 'Livraison', icon: Truck },
  { id: 2, name: 'Paiement', icon: CreditCard },
  { id: 3, name: 'Confirmation', icon: Check },
];

export default function CheckoutForm() {
  const router = useRouter();
  const { cart, total: cartTotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      deliveryMethod: 'home',
      saveInfo: false,
      paymentMethod: 'mobile',
    },
  });

  const deliveryMethod = watch('deliveryMethod');
  const commune = watch('commune');
  const paymentMethod = watch('paymentMethod');

  // Calculate delivery fee
  const deliveryFee = deliveryMethod === 'pickup' ? 0 : (commune ? DELIVERY_FEES[commune] || 5 : 5);
  const totalAmount = cartTotal + deliveryFee;

  // Validate step 1
  const validateStep1 = () => {
    const values = watch();
    const errors: string[] = [];

    if (!values.firstName) errors.push('Prénom requis');
    if (!values.lastName) errors.push('Nom requis');
    if (!values.email) errors.push('Email requis');
    if (!values.phone) errors.push('Téléphone requis');
    
    if (deliveryMethod === 'home') {
      if (!values.address) errors.push('Adresse requise');
      if (!values.commune) errors.push('Commune requise');
    }

    if (errors.length > 0) {
      toast.error(errors[0]);
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCart = () => {
    router.push('/boutique');
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (currentStep === 2) {
      setIsSubmitting(true);
      try {
        // Generate order number
        const orderNum = `MLA-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        
        // Create order (simplified - adjust based on your API)
        const orderData = {
          addressId: 1, // You'll need to create address first
          items: cart!.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.salePrice || item.product.price,
          })),
          subtotal: cartTotal,
          tax: 0,
          shipping: deliveryFee,
          notes: data.deliveryInstructions || '',
        };

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setOrderNumber(orderNum);
        setCurrentStep(3);
        
        // Clear cart after successful order
        // clearCart(); // Commented out for testing
        
        toast.success('Commande passée avec succès!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        toast.error('Erreur lors de la création de la commande');
        console.error('Order creation error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all mb-2',
                      isCompleted && 'bg-primary border-primary text-primary-foreground',
                      isCurrent && 'border-primary text-primary bg-primary/10',
                      !isCompleted && !isCurrent && 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors',
                      (isCompleted || isCurrent) && 'text-foreground',
                      !isCompleted && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.name}
                  </span>
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-4 transition-colors',
                      isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form Steps */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {/* Step 1: Delivery Information */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">Informations de Livraison</h2>

                    <div className="space-y-6">
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Prénom <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="firstName"
                            {...register('firstName', { required: true })}
                            placeholder="Votre prénom"
                            className="mt-1"
                          />
                          {errors.firstName && (
                            <p className="text-sm text-destructive mt-1">Prénom requis</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Nom <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            {...register('lastName', { required: true })}
                            placeholder="Votre nom"
                            className="mt-1"
                          />
                          {errors.lastName && (
                            <p className="text-sm text-destructive mt-1">Nom requis</p>
                          )}
                        </div>
                      </div>

                      {/* Contact Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            {...register('email', { required: true })}
                            placeholder="votre@email.com"
                            className="mt-1"
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive mt-1">Email requis</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Téléphone <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...register('phone', { required: true })}
                            placeholder="+243 XXX XXX XXX"
                            className="mt-1"
                          />
                          {errors.phone && (
                            <p className="text-sm text-destructive mt-1">Téléphone requis</p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Delivery Method */}
                      <div>
                        <Label className="text-base font-semibold mb-3 block">
                          Méthode de livraison <span className="text-destructive">*</span>
                        </Label>
                        <RadioGroup
                          value={deliveryMethod}
                          onValueChange={(value) => setValue('deliveryMethod', value as 'home' | 'pickup')}
                          className="space-y-3"
                        >
                          <Card className={cn(
                            'p-4 cursor-pointer transition-all',
                            deliveryMethod === 'home' && 'border-primary shadow-sm'
                          )}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="home" id="home" />
                              <Label htmlFor="home" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Truck className="w-5 h-5 text-primary" />
                                  <div>
                                    <p className="font-semibold">Livraison à domicile</p>
                                    <p className="text-sm text-muted-foreground">
                                      Livraison dans 2-5 jours ouvrables
                                    </p>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          </Card>

                          <Card className={cn(
                            'p-4 cursor-pointer transition-all',
                            deliveryMethod === 'pickup' && 'border-primary shadow-sm'
                          )}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="pickup" id="pickup" />
                              <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-5 h-5 text-primary" />
                                  <div>
                                    <p className="font-semibold">Retrait en magasin</p>
                                    <p className="text-sm text-muted-foreground">
                                      Avenue de la Paix, Gombe, Kinshasa
                                    </p>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          </Card>
                        </RadioGroup>
                      </div>

                      {/* Address Fields (Conditional) */}
                      {deliveryMethod === 'home' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="address" className="flex items-center gap-2">
                              <Home className="w-4 h-4" />
                              Adresse complète <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                              id="address"
                              {...register('address', { required: deliveryMethod === 'home' })}
                              placeholder="Numéro, rue, quartier..."
                              className="mt-1 min-h-[80px]"
                            />
                            {errors.address && (
                              <p className="text-sm text-destructive mt-1">Adresse requise</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="commune">
                              Commune/Zone <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={commune}
                              onValueChange={(value) => setValue('commune', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Sélectionner une commune" />
                              </SelectTrigger>
                              <SelectContent>
                                {COMMUNES.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c} - ${DELIVERY_FEES[c].toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="deliveryInstructions">
                              Instructions de livraison (optionnel)
                            </Label>
                            <Textarea
                              id="deliveryInstructions"
                              {...register('deliveryInstructions')}
                              placeholder="Point de repère, instructions spéciales..."
                              className="mt-1 min-h-[60px]"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Save Info Checkbox */}
                      {isAuthenticated && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="saveInfo"
                            checked={watch('saveInfo')}
                            onCheckedChange={(checked) => setValue('saveInfo', checked as boolean)}
                          />
                          <Label htmlFor="saveInfo" className="text-sm cursor-pointer">
                            Sauvegarder ces informations pour mes prochaines commandes
                          </Label>
                        </div>
                      )}
                    </div>

                    {/* Step 1 Buttons */}
                    <div className="flex gap-4 mt-8">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToCart}
                        className="flex-1"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Retour au panier
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="flex-1"
                      >
                        Continuer
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">Méthode de Paiement</h2>

                    <div className="space-y-6">
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={(value) => setValue('paymentMethod', value as 'mobile' | 'cash')}
                        className="space-y-4"
                      >
                        {/* Mobile Money */}
                        <Card className={cn(
                          'p-6 cursor-pointer transition-all',
                          paymentMethod === 'mobile' && 'border-primary shadow-md'
                        )}>
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value="mobile" id="mobile" className="mt-1" />
                            <Label htmlFor="mobile" className="flex-1 cursor-pointer">
                              <div className="flex items-start gap-3">
                                <CreditCard className="w-6 h-6 text-primary mt-1" />
                                <div className="flex-1">
                                  <p className="font-semibold text-lg mb-2">Paiement Mobile</p>
                                  <div className="flex gap-3 mb-3">
                                    <div className="px-3 py-1 bg-primary/10 rounded text-sm font-medium text-primary">
                                      M-Pesa
                                    </div>
                                    <div className="px-3 py-1 bg-red-500/10 rounded text-sm font-medium text-red-600">
                                      Airtel Money
                                    </div>
                                    <div className="px-3 py-1 bg-orange-500/10 rounded text-sm font-medium text-orange-600">
                                      Orange Money
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Vous recevrez les instructions de paiement après la confirmation de votre commande
                                  </p>
                                </div>
                              </div>
                            </Label>
                          </div>
                        </Card>

                        {/* Cash on Delivery */}
                        <Card className={cn(
                          'p-6 cursor-pointer transition-all',
                          paymentMethod === 'cash' && 'border-primary shadow-md'
                        )}>
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value="cash" id="cash" className="mt-1" />
                            <Label htmlFor="cash" className="flex-1 cursor-pointer">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 mt-1">💵</div>
                                <div className="flex-1">
                                  <p className="font-semibold text-lg mb-2">Paiement à la livraison</p>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Payez en espèces lors de la réception de votre commande
                                  </p>
                                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-3">
                                    <p className="text-sm text-amber-800 dark:text-amber-400">
                                      <strong>Note:</strong> Préparez le montant exact pour faciliter la transaction
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Label>
                          </div>
                        </Card>
                      </RadioGroup>
                    </div>

                    {/* Step 2 Buttons */}
                    <div className="flex gap-4 mt-8">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreviousStep}
                        className="flex-1"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Retour
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'En cours...' : 'Passer la commande'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-8 text-center">
                    {/* Success Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      className="w-20 h-20 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </motion.div>

                    <h2 className="text-3xl font-bold mb-2">Commande confirmée!</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Merci pour votre commande
                    </p>

                    {/* Order Number */}
                    <div className="bg-muted rounded-lg p-4 mb-8">
                      <p className="text-sm text-muted-foreground mb-1">Numéro de commande</p>
                      <p className="text-2xl font-bold text-primary">{orderNumber}</p>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-card border rounded-lg p-6 mb-8 text-left">
                      <h3 className="font-semibold text-lg mb-4">Récapitulatif</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sous-total</span>
                          <span className="font-medium">${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Frais de livraison</span>
                          <span className="font-medium">
                            {deliveryFee === 0 ? 'Gratuit' : `$${deliveryFee.toFixed(2)}`}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary">${totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 text-left">
                      <h3 className="font-semibold mb-3">Prochaines étapes</h3>
                      {paymentMethod === 'mobile' ? (
                        <div className="space-y-2 text-sm">
                          <p>✓ Vous recevrez un SMS avec les instructions de paiement</p>
                          <p>✓ Numéros de paiement:</p>
                          <div className="ml-4 space-y-1 font-mono text-xs bg-white dark:bg-gray-900 p-3 rounded">
                            <p>M-Pesa: +243 XXX XXX XXX</p>
                            <p>Airtel Money: +243 XXX XXX XXX</p>
                            <p>Orange Money: +243 XXX XXX XXX</p>
                          </div>
                          <p>✓ Après paiement, votre commande sera traitée</p>
                          <p>✓ Livraison estimée: 2-5 jours ouvrables</p>
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm">
                          <p>✓ Préparez le montant exact: <strong>${totalAmount.toFixed(2)}</strong></p>
                          <p>✓ Notre livreur vous contactera pour confirmer l'adresse</p>
                          <p>✓ Livraison estimée: 2-5 jours ouvrables</p>
                          <p>✓ Payez en espèces lors de la réception</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push('/customer')}
                      >
                        Continuer vos achats
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => router.push('/compte/commandes')}
                      >
                        Suivre ma commande
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Right Column - Order Summary */}
        {currentStep < 3 && (
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <OrderSummary
                items={cart!.items}
                subtotal={cartTotal}
                deliveryFee={deliveryFee}
                total={totalAmount}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}