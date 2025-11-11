"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  User,
  Users,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  Loader2,
  Receipt as ReceiptIcon,
  ShoppingBag,
  ArrowLeft,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { Receipt } from "./Receipt";

interface CartItem {
  productId: number;
  variantId: number;
  productName: string;
  variantDetails: {
    size: string;
    color: string;
    sku: string;
  };
  price: number;
  quantity: number;
  image?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface POSCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  total: number;
  onSuccess: () => void;
}

type Step = "customer" | "payment" | "confirmation" | "success";
type PaymentMethod = "CASH" | "MOBILE_MONEY";
type MobileProvider = "M-Pesa" | "Airtel" | "Orange";

interface SaleResult {
  order: {
    id: number;
    orderNumber: string;
    createdAt: string;
    total: number;
    items: Array<{
      id: number;
      productName: string;
      variantDetails: any;
      quantity: number;
      priceAtPurchase: number;
    }>;
  };
  change?: number;
}

export function POSCheckout({ open, onOpenChange, cart, total, onSuccess }: POSCheckoutProps) {
  const [step, setStep] = useState<Step>("customer");
  const [isProcessing, setIsProcessing] = useState(false);

  // Customer Step
  const [isRegisteredCustomer, setIsRegisteredCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Payment Step
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [mobileProvider, setMobileProvider] = useState<MobileProvider>("M-Pesa");
  const [mobilePhone, setMobilePhone] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Success Step
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("customer");
        setIsRegisteredCustomer(false);
        setCustomerSearch("");
        setSearchResults([]);
        setSelectedCustomer(null);
        setPaymentMethod("CASH");
        setAmountReceived("");
        setMobileProvider("M-Pesa");
        setMobilePhone("");
        setReferenceNumber("");
        setSaleResult(null);
        setShowReceipt(false);
      }, 300);
    }
  }, [open]);

  // Customer search
  useEffect(() => {
    if (!customerSearch || customerSearch.length < 3) {
      setSearchResults([]);
      return;
    }

    const searchCustomers = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/customers?search=${encodeURIComponent(customerSearch)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.customers || []);
        }
      } catch (error) {
        console.error("Error searching customers:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchCustomers, 500);
    return () => clearTimeout(debounce);
  }, [customerSearch]);

  const calculateChange = () => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - total);
  };

  const handleNextStep = () => {
    if (step === "customer") {
      setStep("payment");
    } else if (step === "payment") {
      if (paymentMethod === "CASH") {
        const received = parseFloat(amountReceived) || 0;
        if (received < total) {
          toast.error("Le montant reçu est insuffisant");
          return;
        }
      } else {
        if (!mobilePhone || !referenceNumber) {
          toast.error("Veuillez remplir tous les champs Mobile Money");
          return;
        }
      }
      setStep("confirmation");
    } else if (step === "confirmation") {
      handleConfirmSale();
    }
  };

  const handleConfirmSale = async () => {
    setIsProcessing(true);
    try {
      const saleData = {
        customerId: selectedCustomer?.id || null,
        paymentMethod,
        amountReceived: paymentMethod === "CASH" ? parseFloat(amountReceived) : null,
        mobileProvider: paymentMethod === "MOBILE_MONEY" ? mobileProvider : null,
        mobilePhone: paymentMethod === "MOBILE_MONEY" ? mobilePhone : null,
        referenceNumber: paymentMethod === "MOBILE_MONEY" ? referenceNumber : null,
        items: cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
          productName: item.productName,
          variantDetails: item.variantDetails,
        })),
      };

      const response = await fetch("/api/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la vente");
      }

      const result = await response.json();
      setSaleResult(result);
      setStep("success");
      toast.success("Vente enregistrée avec succès!", {
        description: `Commande N° ${result.order.orderNumber}`,
      });
    } catch (error) {
      console.error("Sale error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la vente");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSale = () => {
    onOpenChange(false);
    onSuccess();
  };

  const renderCustomerStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg">Client enregistré?</Label>
          <RadioGroup
            value={isRegisteredCustomer ? "yes" : "no"}
            onValueChange={(value) => {
              setIsRegisteredCustomer(value === "yes");
              setSelectedCustomer(null);
              setCustomerSearch("");
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="cursor-pointer">
                Oui
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="cursor-pointer">
                Non (Invité)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {isRegisteredCustomer && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par téléphone ou email..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {selectedCustomer ? (
              <Card className="p-4 bg-primary/5 border-primary">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedCustomer.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Changer
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {isSearching && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <ScrollArea className="h-[200px] rounded-lg border">
                    <div className="p-2 space-y-2">
                      {searchResults.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch("");
                            setSearchResults([]);
                          }}
                          className="w-full p-3 text-left rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="font-semibold">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.email} • {customer.phone}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {!isSearching &&
                  customerSearch.length >= 3 &&
                  searchResults.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun client trouvé</p>
                    </div>
                  )}
              </>
            )}
          </div>
        )}

        {!isRegisteredCustomer && (
          <Card className="p-4 bg-muted/50">
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-medium">Vente sans compte client</p>
                <p className="text-sm text-muted-foreground mt-1">
                  La vente sera enregistrée comme invité. Le client pourra réclamer la
                  commande plus tard si nécessaire.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button onClick={handleNextStep} size="lg">
          Suivant: Paiement
        </Button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-lg">Mode de paiement</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod("CASH")}
            className={`p-6 rounded-lg border-2 transition-all ${
              paymentMethod === "CASH"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Banknote className="h-12 w-12 mx-auto mb-3 text-primary" />
            <div className="text-lg font-semibold">Espèces</div>
            <div className="text-sm text-muted-foreground">Paiement comptant</div>
          </button>

          <button
            onClick={() => setPaymentMethod("MOBILE_MONEY")}
            className={`p-6 rounded-lg border-2 transition-all ${
              paymentMethod === "MOBILE_MONEY"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Smartphone className="h-12 w-12 mx-auto mb-3 text-primary" />
            <div className="text-lg font-semibold">Mobile Money</div>
            <div className="text-sm text-muted-foreground">M-Pesa, Airtel, Orange</div>
          </button>
        </div>

        {paymentMethod === "CASH" && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Montant reçu (USD)</Label>
              <Input
                type="number"
                placeholder="0"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="h-12 text-lg"
                autoFocus
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setAmountReceived(total.toString())}
              className="w-full"
            >
              Montant exact (${total.toFixed(2)})
            </Button>

            {amountReceived && parseFloat(amountReceived) >= total && (
              <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Monnaie à rendre:</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${calculateChange().toFixed(2)}
                  </span>
                </div>
              </Card>
            )}
          </div>
        )}

        {paymentMethod === "MOBILE_MONEY" && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Opérateur</Label>
              <RadioGroup
                value={mobileProvider}
                onValueChange={(value) => setMobileProvider(value as MobileProvider)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="M-Pesa" id="mpesa" />
                  <Label htmlFor="mpesa" className="cursor-pointer">
                    M-Pesa
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Airtel" id="airtel" />
                  <Label htmlFor="airtel" className="cursor-pointer">
                    Airtel Money
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Orange" id="orange" />
                  <Label htmlFor="orange" className="cursor-pointer">
                    Orange Money
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Numéro de téléphone</Label>
              <Input
                type="tel"
                placeholder="+243 XXX XXX XXX"
                value={mobilePhone}
                onChange={(e) => setMobilePhone(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Numéro de référence</Label>
              <Input
                placeholder="Référence de la transaction"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={() => setStep("customer")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button onClick={handleNextStep} size="lg">
          Suivant: Confirmation
        </Button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Récapitulatif de la commande</h3>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client:</span>
            <span className="font-medium">
              {selectedCustomer ? selectedCustomer.name : "Invité"}
            </span>
          </div>

          <Separator />

          <div>
            <div className="text-sm text-muted-foreground mb-2">Articles:</div>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.variantId} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.productName} ({item.variantDetails.size},{" "}
                    {item.variantDetails.color})
                  </span>
                  <span className="font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-muted-foreground">Mode de paiement:</span>
            <span className="font-medium">
              {paymentMethod === "CASH" ? "Espèces" : `Mobile Money (${mobileProvider})`}
            </span>
          </div>

          {paymentMethod === "CASH" && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant reçu:</span>
                <span className="font-medium">${parseFloat(amountReceived).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Monnaie:</span>
                <span className="font-semibold">${calculateChange().toFixed(2)}</span>
              </div>
            </>
          )}

          {paymentMethod === "MOBILE_MONEY" && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Téléphone:</span>
                <span className="font-medium">{mobilePhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Référence:</span>
                <span className="font-medium">{referenceNumber}</span>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={() => setStep("payment")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button
          onClick={handleNextStep}
          size="lg"
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Confirmer la vente
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-2">Vente enregistrée avec succès!</h3>
        <p className="text-muted-foreground">
          Commande N° <span className="font-semibold">{saleResult?.order.orderNumber}</span>
        </p>
      </div>

      {saleResult?.change && saleResult.change > 0 && (
        <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Monnaie à rendre</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${saleResult.change.toFixed(2)}
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => setShowReceipt(true)}
          size="lg"
          variant="outline"
          className="w-full"
        >
          <Printer className="h-5 w-5 mr-2" />
          Imprimer le reçu
        </Button>

        <Button onClick={handleNewSale} size="lg" className="w-full">
          <ShoppingBag className="h-5 w-5 mr-2" />
          Nouvelle vente
        </Button>
      </div>

      {showReceipt && saleResult && (
        <Receipt
          order={saleResult.order}
          paymentMethod={paymentMethod}
          customer={selectedCustomer}
          change={saleResult.change}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            {step === "customer" && "Informations client"}
            {step === "payment" && "Paiement"}
            {step === "confirmation" && "Confirmation"}
            {step === "success" && "Vente confirmée"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {step !== "success" && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={step === "customer" ? "default" : "secondary"}>1. Client</Badge>
                <div className="flex-1 h-px bg-border mx-2" />
                <Badge variant={step === "payment" ? "default" : "secondary"}>2. Paiement</Badge>
                <div className="flex-1 h-px bg-border mx-2" />
                <Badge variant={step === "confirmation" ? "default" : "secondary"}>
                  3. Confirmation
                </Badge>
              </div>
            </div>
          )}

          {step === "customer" && renderCustomerStep()}
          {step === "payment" && renderPaymentStep()}
          {step === "confirmation" && renderConfirmationStep()}
          {step === "success" && renderSuccessStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}