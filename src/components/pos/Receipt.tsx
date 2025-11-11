"use client";

import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, Printer } from "lucide-react";

interface ReceiptProps {
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
  paymentMethod: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  } | null;
  change?: number;
  onClose: () => void;
}

export function Receipt({ order, paymentMethod, customer, change, onClose }: ReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  // Add print styles
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #receipt-content, #receipt-content * {
          visibility: visible;
        }
        #receipt-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          max-width: 80mm;
          margin: 0;
          padding: 20px;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.priceAtPurchase * item.quantity,
    0
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="flex justify-between items-start mb-4 no-print">
          <h2 className="text-xl font-bold">Aperçu du reçu</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          id="receipt-content"
          className="bg-white text-black p-6 rounded-lg border"
          style={{ fontFamily: "monospace" }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1">ML Allure</h1>
            <p className="text-sm">Mode & Élégance</p>
            <p className="text-xs mt-2">Kinshasa, RD Congo</p>
            <p className="text-xs">Tel: +243 XXX XXX XXX</p>
            <p className="text-xs">Email: contact@mlallure.com</p>
          </div>

          <Separator className="my-4 border-black" />

          {/* Order Info */}
          <div className="mb-4 text-sm">
            <div className="flex justify-between">
              <span>N° Commande:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            {customer && (
              <div className="flex justify-between">
                <span>Client:</span>
                <span>{customer.name}</span>
              </div>
            )}
          </div>

          <Separator className="my-4 border-black" />

          {/* Items Table */}
          <div className="mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left pb-2">Article</th>
                  <th className="text-center pb-2">Qté</th>
                  <th className="text-right pb-2">Prix</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-dashed border-gray-400">
                    <td className="py-2">
                      <div className="font-medium">{item.productName}</div>
                      {item.variantDetails && (
                        <div className="text-xs text-gray-600">
                          {item.variantDetails.size} - {item.variantDetails.color}
                        </div>
                      )}
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">${item.priceAtPurchase.toFixed(2)}</td>
                    <td className="text-right font-medium">
                      ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator className="my-4 border-black" />

          {/* Totals */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Sous-total:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <Separator className="my-4 border-black" />

          {/* Payment Info */}
          <div className="mb-4 text-sm">
            <div className="flex justify-between">
              <span>Mode de paiement:</span>
              <span className="font-medium">
                {paymentMethod === "CASH" ? "Espèces" : "Mobile Money"}
              </span>
            </div>
            {change !== undefined && change > 0 && (
              <div className="flex justify-between font-bold">
                <span>Monnaie rendue:</span>
                <span>${change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <Separator className="my-4 border-black" />

          {/* Footer */}
          <div className="text-center text-sm mt-6">
            <p className="font-bold mb-2">Merci de votre visite!</p>
            <p className="text-xs">À bientôt chez ML Allure</p>
            <p className="text-xs mt-4">www.mlallure.com</p>
          </div>

          {/* Barcode Placeholder */}
          <div className="flex justify-center mt-6">
            <div className="border-2 border-black px-4 py-2">
              <div className="text-xs text-center">{order.orderNumber}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 no-print">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fermer
          </Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}