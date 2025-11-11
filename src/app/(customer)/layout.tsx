import { CustomerLayout } from "@/components/customer/Layout";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "ML Allure - Mode Élégante & Accessoires",
    template: "%s | ML Allure",
  },
  description:
    "ML Allure - Votre destination pour la mode élégante, les accessoires de qualité et les dernières tendances à Kinshasa, RD Congo. Découvrez nos collections pour hommes et femmes.",
  keywords: [
    "mode",
    "fashion",
    "accessoires",
    "vêtements",
    "Kinshasa",
    "RD Congo",
    "ML Allure",
    "élégance",
    "tendance",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "ML Allure",
  },
};

export default function CustomerLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CustomerLayout>{children}</CustomerLayout>
      <Toaster position="top-right" richColors />
    </>
  );
}