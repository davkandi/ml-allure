"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Facebook, Instagram, Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const quickLinks = [
  { name: "À Propos", href: "/customer/a-propos" },
  { name: "Contact", href: "/customer/contact" },
  { name: "Politique de Retour", href: "/customer/politique-retour" },
  { name: "Conditions d'Utilisation", href: "/customer/conditions" },
];

const categories = [
  { name: "Hommes", href: "/customer/hommes" },
  { name: "Femmes", href: "/customer/femmes" },
  { name: "Accessoires", href: "/customer/accessoires" },
  { name: "Chaussures", href: "/customer/chaussures" },
];

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Veuillez entrer votre adresse email");
      return;
    }

    setIsSubmitting(true);
    
    // TODO: Replace with actual newsletter subscription API
    setTimeout(() => {
      toast.success("Merci de votre inscription à notre newsletter!");
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <footer className="bg-card border-t border-border">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/customer" className="inline-block">
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/mlallure_logo-1761245055312.jpg?width=8000&height=8000&resize=contain"
                alt="ML Allure"
                width={150}
                height={50}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              ML Allure - Votre destination pour la mode élégante et les accessoires de qualité à Kinshasa.
            </p>
            <div className="flex gap-3">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Liens Rapides</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Catégories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.href}>
                  <Link
                    href={category.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contactez-nous</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a href="tel:+243810455130" className="hover:text-primary transition-colors">
                  +243 810 455 130
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:mlallure@yahoo.com" className="hover:text-primary transition-colors">
                  mlallure@yahoo.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Kinshasa, RD Congo</span>
              </li>
            </ul>

            {/* Newsletter */}
            <div>
              <h4 className="font-medium text-sm mb-2">Newsletter</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Inscrivez-vous pour recevoir nos offres exclusives
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9"
                  disabled={isSubmitting}
                />
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Payment Methods & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-xs text-muted-foreground">Méthodes de paiement:</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                <Phone className="h-4 w-4" />
                <span className="text-xs font-medium">Mobile Money</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                <span className="text-xs font-medium">💵 Cash</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ML Allure. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};
