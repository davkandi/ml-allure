'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Truck, CreditCard, Shield, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ProductCard from '@/components/customer/ProductCard';
import { Product } from '@/types';

// Hero carousel slides
const heroSlides = [
  {
    id: 1,
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/elegant-fashion-photography-of-a-stylish-2c5c20e3-20251023190443.jpg',
    title: 'ML Allure - Élégance et Style à Kinshasa',
    subtitle: 'Découvrez notre collection exclusive'
  },
  {
    id: 2,
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/professional-fashion-photography-of-a-co-16820d3c-20251023190447.jpg',
    title: 'Mode Masculine Raffinée',
    subtitle: 'Des costumes qui font la différence'
  },
  {
    id: 3,
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/high-end-fashion-accessories-flat-lay-ph-97d6cbba-20251023190447.jpg',
    title: 'Accessoires de Luxe',
    subtitle: 'Complétez votre look avec élégance'
  }
];

// Categories
const categories = [
  {
    id: 1,
    name: 'Hommes',
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fashion-photography-men-s-collection-man-32c0396c-20251023190447.jpg',
    link: '/customer/boutique?category=hommes'
  },
  {
    id: 2,
    name: 'Femmes',
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fashion-photography-women-s-collection-e-00facdd7-20251023190446.jpg',
    link: '/customer/boutique?category=femmes'
  },
  {
    id: 3,
    name: 'Accessoires',
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/luxury-fashion-accessories-photography-d-8534dea9-20251023190447.jpg',
    link: '/customer/boutique?category=accessoires'
  },
  {
    id: 4,
    name: 'Chaussures',
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/high-end-designer-shoes-photography-eleg-0abda25f-20251023190448.jpg',
    link: '/customer/boutique?category=chaussures'
  },
  {
    id: 5,
    name: 'Sacs',
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/luxury-designer-handbags-and-purses-phot-5acfa7ba-20251023190449.jpg',
    link: '/customer/boutique?category=sacs'
  },
  {
    id: 6,
    name: 'Bijoux',
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/elegant-jewelry-photography-luxury-neckl-b096e799-20251023190445.jpg',
    link: '/customer/boutique?category=bijoux'
  }
];

// Featured products mock data
const featuredProducts: Product[] = [
  {
    id: 1,
    name: 'Robe Élégante Rose',
    slug: 'robe-elegante-rose',
    description: 'Robe de soirée luxueuse',
    price: 12500,
    sku: 'DRESS-001',
    stock: 5,
    images: ['https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/elegant-fashion-photography-of-a-stylish-2c5c20e3-20251023190443.jpg'],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: 'Costume Bordeaux Premium',
    slug: 'costume-bordeaux-premium',
    description: 'Costume sur mesure élégant',
    price: 28000,
    sku: 'SUIT-001',
    stock: 3,
    images: ['https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/professional-fashion-photography-of-a-co-16820d3c-20251023190447.jpg'],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: 'Sac à Main Champagne',
    slug: 'sac-main-champagne',
    description: 'Sac en cuir de luxe',
    price: 8500,
    sku: 'BAG-001',
    stock: 8,
    images: ['https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/luxury-designer-handbags-and-purses-phot-5acfa7ba-20251023190449.jpg'],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    name: 'Escarpins Bordeaux',
    slug: 'escarpins-bordeaux',
    description: 'Chaussures élégantes',
    price: 6800,
    sku: 'SHOE-001',
    stock: 12,
    images: ['https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/high-end-designer-shoes-photography-eleg-0abda25f-20251023190448.jpg'],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    name: 'Collier Or Rose',
    slug: 'collier-or-rose',
    description: 'Bijou raffiné',
    price: 4200,
    sku: 'JEW-001',
    stock: 6,
    images: ['https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/elegant-jewelry-photography-luxury-neckl-b096e799-20251023190445.jpg'],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 6,
    name: 'Ensemble Accessoires',
    slug: 'ensemble-accessoires',
    description: 'Collection complète',
    price: 15000,
    sku: 'ACC-001',
    stock: 4,
    images: ['https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/luxury-fashion-accessories-photography-d-8534dea9-20251023190447.jpg'],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 7,
    name: 'Robe de Cocktail',
    slug: 'robe-cocktail',
    description: 'Pour vos soirées spéciales',
    price: 9800,
    sku: 'DRESS-002',
    stock: 7,
    images: ['https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fashion-photography-women-s-collection-e-00facdd7-20251023190446.jpg'],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 8,
    name: 'Costume Élégance',
    slug: 'costume-elegance',
    description: 'Style professionnel',
    price: 24500,
    sku: 'SUIT-002',
    stock: 5,
    images: ['https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fashion-photography-men-s-collection-man-32c0396c-20251023190447.jpg'],
    featured: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Instagram posts
const instagramPosts = [
  'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fashion-lifestyle-photography-for-instag-3b4d7cbb-20251023190446.jpg',
  'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fashion-lifestyle-photography-for-instag-c8926869-20251023190446.jpg',
  'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/fashion-lifestyle-photography-for-instag-2f1454c5-20251023190447.jpg',
  'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/elegant-fashion-photography-of-a-stylish-2c5c20e3-20251023190443.jpg',
  'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/high-end-fashion-accessories-flat-lay-ph-97d6cbba-20251023190447.jpg',
  'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/7d89b4db-c2da-4e40-8db3-803e371a4845/generated_images/luxury-fashion-accessories-photography-d-8534dea9-20251023190447.jpg'
];

export default function CustomerHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate carousel every 5 seconds
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
    <div className="min-h-screen">
      {/* Hero Section with Carousel */}
      <section className="relative h-[70vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <Image
              src={heroSlides[currentSlide].image}
              alt={heroSlides[currentSlide].title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4 max-w-4xl">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
                >
                  {heroSlides[currentSlide].title}
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl md:text-2xl mb-8"
                >
                  {heroSlides[currentSlide].subtitle}
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link href="/customer/boutique">
                    <Button size="lg" className="text-lg px-8 py-6">
                      Découvrir
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 rounded-full transition-all z-10"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 rounded-full transition-all z-10"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Progress Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-center mb-12">Nos Collections</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={category.link}>
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                        <span className="text-sm opacity-90 group-hover:underline">Voir plus →</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Featured Products - Nouveautés */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-bold">Nouveautés</h2>
            <Link href="/customer/boutique">
              <Button variant="outline">Voir tout →</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Why Choose ML Allure */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-center mb-12">Pourquoi ML Allure?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Truck className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Livraison à Kinshasa</h3>
              <p className="text-muted-foreground">
                Livraison rapide et sécurisée dans toute la ville de Kinshasa en 24-48h
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-secondary/10 p-4 rounded-full">
                  <CreditCard className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Paiement Flexible</h3>
              <p className="text-muted-foreground">
                Plusieurs options de paiement: Mobile Money, espèces, cartes bancaires
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-accent/10 p-4 rounded-full">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Qualité Garantie</h3>
              <p className="text-muted-foreground">
                Produits authentiques de haute qualité avec garantie de satisfaction
              </p>
            </Card>
          </div>
        </motion.div>
      </section>

      {/* Instagram Feed */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Suivez-nous sur Instagram</h2>
            <a
              href="https://instagram.com/mlallure0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-primary hover:underline inline-flex items-center gap-2"
            >
              <Instagram className="w-6 h-6" />
              @mlallure0
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {instagramPosts.map((post, index) => (
              <motion.a
                key={index}
                href="https://instagram.com/mlallure0"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
              >
                <Image
                  src={post}
                  alt={`Instagram post ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Instagram className="w-8 h-8 text-white" />
                </div>
              </motion.a>
            ))}
          </div>
          <div className="text-center mt-8">
            <a
              href="https://instagram.com/mlallure0"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                <Instagram className="w-5 h-5 mr-2" />
                Suivre sur Instagram
              </Button>
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}