"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Truck, CreditCard, Shield, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProductCard from "@/components/customer/ProductCard";
import type { Product } from "@/types";

// Hero slides data
const heroSlides = [
  {
    id: 1,
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/elegant-fashion-banner-with-a-sophistica-83e9334c-20251023185242.jpg",
    title: "ML Allure - Élégance et Style à Kinshasa",
    subtitle: "Découvrez notre collection exclusive",
    cta: "Découvrir",
    ctaLink: "/customer/boutique"
  },
  {
    id: 2,
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/modern-african-woman-in-chic-burgundy-bl-8bfc21ef-20251023185240.jpg",
    title: "Nouvelle Collection Automne",
    subtitle: "Sophistication et raffinement pour chaque occasion",
    cta: "Explorer",
    ctaLink: "/customer/boutique"
  },
  {
    id: 3,
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/stylish-african-model-in-flowing-champag-8afcdf8a-20251023185235.jpg",
    title: "Luxe et Élégance",
    subtitle: "Des pièces uniques pour sublimer votre garde-robe",
    cta: "Voir la Collection",
    ctaLink: "/customer/boutique"
  }
];

// Categories data
const categories = [
  {
    id: 1,
    name: "Hommes",
    slug: "hommes",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/elegant-men-s-fashion-category-sophistic-be455e3e-20251023185241.jpg",
    href: "/customer/hommes"
  },
  {
    id: 2,
    name: "Femmes",
    slug: "femmes",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/women-s-fashion-category-elegant-african-2347b55a-20251023185240.jpg",
    href: "/customer/femmes"
  },
  {
    id: 3,
    name: "Accessoires",
    slug: "accessoires",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fashion-accessories-flat-lay-elegant-gol-baed832d-20251023185241.jpg",
    href: "/customer/accessoires"
  },
  {
    id: 4,
    name: "Chaussures",
    slug: "chaussures",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/designer-shoes-category-elegant-women-s--1fbac31a-20251023185238.jpg",
    href: "/customer/chaussures"
  },
  {
    id: 5,
    name: "Sacs",
    slug: "sacs",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/luxury-handbag-category-elegant-leather--7954c98d-20251023185236.jpg",
    href: "/customer/sacs"
  },
  {
    id: 6,
    name: "Bijoux",
    slug: "bijoux",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fine-jewelry-category-elegant-gold-neckl-dc468735-20251023185240.jpg",
    href: "/customer/bijoux"
  }
];

// Mock featured products
const featuredProducts: Product[] = [
  {
    id: 1,
    name: "Robe Élégante Rose",
    slug: "robe-elegante-rose",
    description: "Robe de soirée élégante avec détails en dentelle",
    price: 89.99,
    sku: "RER001",
    stock: 15,
    images: ["https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/elegant-fashion-banner-with-a-sophistica-83e9334c-20251023185242.jpg"],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: "Blazer Bordeaux Chic",
    slug: "blazer-bordeaux-chic",
    description: "Blazer sophistiqué pour un look professionnel",
    price: 129.99,
    sku: "BBC001",
    stock: 10,
    images: ["https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/modern-african-woman-in-chic-burgundy-bl-8bfc21ef-20251023185240.jpg"],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: "Robe Champagne Fluide",
    slug: "robe-champagne-fluide",
    description: "Robe légère et élégante pour toutes occasions",
    price: 99.99,
    sku: "RCF001",
    stock: 8,
    images: ["https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/stylish-african-model-in-flowing-champag-8afcdf8a-20251023185235.jpg"],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    name: "Escarpins Rose Gold",
    slug: "escarpins-rose-gold",
    description: "Chaussures élégantes à talons hauts",
    price: 79.99,
    salePrice: 59.99,
    sku: "ERG001",
    stock: 20,
    images: ["https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/designer-shoes-category-elegant-women-s--1fbac31a-20251023185238.jpg"],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    name: "Sac à Main Cuir Champagne",
    slug: "sac-main-cuir-champagne",
    description: "Sac en cuir de luxe avec finitions dorées",
    price: 149.99,
    sku: "SMC001",
    stock: 12,
    images: ["https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/luxury-handbag-category-elegant-leather--7954c98d-20251023185236.jpg"],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 6,
    name: "Parure Bijoux Or",
    slug: "parure-bijoux-or",
    description: "Collier et boucles d'oreilles en or rose",
    price: 199.99,
    sku: "PBO001",
    stock: 5,
    images: ["https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fine-jewelry-category-elegant-gold-neckl-dc468735-20251023185240.jpg"],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 7,
    name: "Ensemble Accessoires",
    slug: "ensemble-accessoires",
    description: "Lunettes, foulard et accessoires assortis",
    price: 69.99,
    sku: "EAC001",
    stock: 18,
    images: ["https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fashion-accessories-flat-lay-elegant-gol-baed832d-20251023185241.jpg"],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 8,
    name: "Costume Homme Élégant",
    slug: "costume-homme-elegant",
    description: "Costume sur mesure en tissu premium",
    price: 299.99,
    sku: "CHE001",
    stock: 7,
    images: ["https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/elegant-men-s-fashion-category-sophistic-be455e3e-20251023185241.jpg"],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Why choose us features
const features = [
  {
    icon: Truck,
    title: "Livraison à Kinshasa",
    description: "Livraison rapide et sécurisée dans toute la ville de Kinshasa"
  },
  {
    icon: CreditCard,
    title: "Paiement Flexible",
    description: "Mobile Money, Cash - Options de paiement adaptées à vos besoins"
  },
  {
    icon: Shield,
    title: "Qualité Garantie",
    description: "Produits authentiques et de haute qualité, satisfait ou remboursé"
  }
];

// Instagram posts (static for now)
const instagramPosts = [
  "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/elegant-fashion-banner-with-a-sophistica-83e9334c-20251023185242.jpg",
  "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/modern-african-woman-in-chic-burgundy-bl-8bfc21ef-20251023185240.jpg",
  "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/women-s-fashion-category-elegant-african-2347b55a-20251023185240.jpg",
  "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/designer-shoes-category-elegant-women-s--1fbac31a-20251023185238.jpg",
  "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/luxury-handbag-category-elegant-leather--7954c98d-20251023185236.jpg",
  "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fine-jewelry-category-elegant-gold-neckl-dc468735-20251023185240.jpg"
];

export default function CustomerHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Carousel */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden">
        <AnimatePresence mode="wait">
          {heroSlides.map((slide, index) => (
            index === currentSlide && (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0"
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="max-w-2xl text-white"
                    >
                      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                        {slide.title}
                      </h1>
                      <p className="text-lg md:text-xl mb-8 text-gray-200">
                        {slide.subtitle}
                      </p>
                      <Button asChild size="lg" className="text-lg px-8">
                        <Link href={slide.ctaLink}>{slide.cta}</Link>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Collections</h2>
            <p className="text-muted-foreground text-lg">
              Découvrez nos catégories de produits soigneusement sélectionnés
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link href={category.href}>
                  <Card className="overflow-hidden group cursor-pointer border-2 hover:border-primary transition-all duration-300">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="text-xl md:text-2xl font-bold mb-2">{category.name}</h3>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                          Voir plus
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Nouveautés */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nouveautés</h2>
            <p className="text-muted-foreground text-lg">
              Les dernières pièces ajoutées à notre collection
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline">
              <Link href="/customer/boutique">Voir tout</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose ML Allure */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pourquoi Choisir ML Allure</h2>
            <p className="text-muted-foreground text-lg">
              Votre satisfaction est notre priorité
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                <Card className="text-center p-8 h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                      <feature.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <Instagram className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">Suivez-nous sur Instagram</h2>
            </div>
            <a
              href="https://www.instagram.com/mlallure0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg text-primary hover:underline"
            >
              @mlallure0
            </a>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {instagramPosts.map((post, index) => (
              <motion.a
                key={index}
                href="https://www.instagram.com/mlallure0"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer"
              >
                <Image
                  src={post}
                  alt={`Instagram post ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <Instagram className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.a>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg">
              <a
                href="https://www.instagram.com/mlallure0"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="mr-2 h-5 w-5" />
                Suivre sur Instagram
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}