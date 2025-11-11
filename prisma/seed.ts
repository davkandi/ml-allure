import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@mlallure.com',
      password: hashedPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'ML Allure',
      phone: '+243 123 456 789',
      isActive: true,
    },
  });
  console.log('✓ Admin user created:', adminUser.email);

  // 2. Create Categories
  console.log('Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Hommes',
        slug: 'hommes',
        description: 'Collection élégante pour hommes',
        imageUrl: '/images/categories/hommes.jpg',
        isActive: true,
        displayOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Femmes',
        slug: 'femmes',
        description: 'Collection raffinée pour femmes',
        imageUrl: '/images/categories/femmes.jpg',
        isActive: true,
        displayOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Accessoires',
        slug: 'accessoires',
        description: 'Accessoires de mode élégants',
        imageUrl: '/images/categories/accessoires.jpg',
        isActive: true,
        displayOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Chaussures',
        slug: 'chaussures',
        description: 'Chaussures de qualité supérieure',
        imageUrl: '/images/categories/chaussures.jpg',
        isActive: true,
        displayOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Sacs',
        slug: 'sacs',
        description: 'Sacs à main et sacs de voyage',
        imageUrl: '/images/categories/sacs.jpg',
        isActive: true,
        displayOrder: 5,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Bijoux',
        slug: 'bijoux',
        description: 'Bijoux élégants et sophistiqués',
        imageUrl: '/images/categories/bijoux.jpg',
        isActive: true,
        displayOrder: 6,
      },
    }),
  ]);
  console.log('✓ Created', categories.length, 'categories');

  // 3. Create Products with Variants
  console.log('Creating products with variants...');
  
  const productsData = [
    // Hommes (Men's) - 4 products
    {
      name: 'Costume Élégant Noir',
      slug: 'costume-elegant-noir',
      description: 'Costume deux pièces en laine premium, coupe moderne et élégante.',
      categoryId: categories[0].id,
      basePrice: 450.00,
      images: ['/images/products/costume-noir-1.jpg', '/images/products/costume-noir-2.jpg'],
      isFeatured: true,
      tags: ['costume', 'formel', 'élégant'],
      variants: [
        { size: 'M', color: 'Noir', colorHex: '#000000', stock: 15, additionalPrice: 0 },
        { size: 'L', color: 'Noir', colorHex: '#000000', stock: 12, additionalPrice: 0 },
        { size: 'XL', color: 'Noir', colorHex: '#000000', stock: 8, additionalPrice: 10 },
      ],
    },
    {
      name: 'Chemise Blanche Classic',
      slug: 'chemise-blanche-classic',
      description: 'Chemise en coton égyptien, parfaite pour toute occasion formelle.',
      categoryId: categories[0].id,
      basePrice: 85.00,
      images: ['/images/products/chemise-blanche.jpg'],
      isFeatured: false,
      tags: ['chemise', 'coton', 'formel'],
      variants: [
        { size: 'S', color: 'Blanc', colorHex: '#FFFFFF', stock: 20, additionalPrice: 0 },
        { size: 'M', color: 'Blanc', colorHex: '#FFFFFF', stock: 25, additionalPrice: 0 },
        { size: 'L', color: 'Blanc', colorHex: '#FFFFFF', stock: 18, additionalPrice: 0 },
        { size: 'XL', color: 'Blanc', colorHex: '#FFFFFF', stock: 10, additionalPrice: 5 },
      ],
    },
    {
      name: 'Pantalon Chino Beige',
      slug: 'pantalon-chino-beige',
      description: 'Pantalon chino confortable et polyvalent pour un style décontracté chic.',
      categoryId: categories[0].id,
      basePrice: 95.00,
      images: ['/images/products/chino-beige.jpg'],
      isFeatured: false,
      tags: ['pantalon', 'décontracté', 'chino'],
      variants: [
        { size: 'M', color: 'Beige', colorHex: '#F5F5DC', stock: 14, additionalPrice: 0 },
        { size: 'L', color: 'Beige', colorHex: '#F5F5DC', stock: 16, additionalPrice: 0 },
        { size: 'L', color: 'Bleu Marine', colorHex: '#000080', stock: 12, additionalPrice: 0 },
      ],
    },
    {
      name: 'Veste en Cuir Marron',
      slug: 'veste-cuir-marron',
      description: 'Veste en cuir véritable, style intemporel et raffiné.',
      categoryId: categories[0].id,
      basePrice: 320.00,
      images: ['/images/products/veste-cuir.jpg'],
      isFeatured: true,
      tags: ['veste', 'cuir', 'décontracté'],
      variants: [
        { size: 'M', color: 'Marron', colorHex: '#8B4513', stock: 8, additionalPrice: 0 },
        { size: 'L', color: 'Marron', colorHex: '#8B4513', stock: 6, additionalPrice: 0 },
        { size: 'XL', color: 'Marron', colorHex: '#8B4513', stock: 4, additionalPrice: 20 },
      ],
    },

    // Femmes (Women's) - 5 products
    {
      name: 'Robe Soirée Rouge',
      slug: 'robe-soiree-rouge',
      description: 'Robe de soirée élégante en satin, idéale pour les occasions spéciales.',
      categoryId: categories[1].id,
      basePrice: 280.00,
      images: ['/images/products/robe-rouge-1.jpg', '/images/products/robe-rouge-2.jpg'],
      isFeatured: true,
      tags: ['robe', 'soirée', 'élégant'],
      variants: [
        { size: 'S', color: 'Rouge', colorHex: '#DC143C', stock: 10, additionalPrice: 0 },
        { size: 'M', color: 'Rouge', colorHex: '#DC143C', stock: 15, additionalPrice: 0 },
        { size: 'L', color: 'Rouge', colorHex: '#DC143C', stock: 8, additionalPrice: 10 },
      ],
    },
    {
      name: 'Blouse en Soie Crème',
      slug: 'blouse-soie-creme',
      description: 'Blouse en soie naturelle, légère et confortable pour un style raffiné.',
      categoryId: categories[1].id,
      basePrice: 120.00,
      images: ['/images/products/blouse-creme.jpg'],
      isFeatured: false,
      tags: ['blouse', 'soie', 'élégant'],
      variants: [
        { size: 'S', color: 'Crème', colorHex: '#FFFDD0', stock: 18, additionalPrice: 0 },
        { size: 'M', color: 'Crème', colorHex: '#FFFDD0', stock: 22, additionalPrice: 0 },
        { size: 'L', color: 'Crème', colorHex: '#FFFDD0', stock: 12, additionalPrice: 0 },
      ],
    },
    {
      name: 'Jupe Plissée Noire',
      slug: 'jupe-plissee-noire',
      description: 'Jupe plissée mi-longue, élégante et polyvalente.',
      categoryId: categories[1].id,
      basePrice: 95.00,
      images: ['/images/products/jupe-noire.jpg'],
      isFeatured: false,
      tags: ['jupe', 'plissée', 'formel'],
      variants: [
        { size: 'S', color: 'Noir', colorHex: '#000000', stock: 20, additionalPrice: 0 },
        { size: 'M', color: 'Noir', colorHex: '#000000', stock: 25, additionalPrice: 0 },
        { size: 'L', color: 'Noir', colorHex: '#000000', stock: 15, additionalPrice: 0 },
      ],
    },
    {
      name: 'Manteau Long Camel',
      slug: 'manteau-long-camel',
      description: 'Manteau long en laine, parfait pour un look sophistiqué en toute saison.',
      categoryId: categories[1].id,
      basePrice: 380.00,
      images: ['/images/products/manteau-camel.jpg'],
      isFeatured: true,
      tags: ['manteau', 'laine', 'hiver'],
      variants: [
        { size: 'S', color: 'Camel', colorHex: '#C19A6B', stock: 7, additionalPrice: 0 },
        { size: 'M', color: 'Camel', colorHex: '#C19A6B', stock: 10, additionalPrice: 0 },
        { size: 'L', color: 'Camel', colorHex: '#C19A6B', stock: 5, additionalPrice: 15 },
      ],
    },
    {
      name: 'Pantalon Tailleur Gris',
      slug: 'pantalon-tailleur-gris',
      description: 'Pantalon de tailleur coupe droite, idéal pour le bureau.',
      categoryId: categories[1].id,
      basePrice: 110.00,
      images: ['/images/products/pantalon-gris.jpg'],
      isFeatured: false,
      tags: ['pantalon', 'tailleur', 'formel'],
      variants: [
        { size: 'S', color: 'Gris', colorHex: '#808080', stock: 16, additionalPrice: 0 },
        { size: 'M', color: 'Gris', colorHex: '#808080', stock: 20, additionalPrice: 0 },
        { size: 'L', color: 'Gris', colorHex: '#808080', stock: 12, additionalPrice: 0 },
      ],
    },

    // Accessoires - 3 products
    {
      name: 'Ceinture en Cuir Italien',
      slug: 'ceinture-cuir-italien',
      description: 'Ceinture en cuir véritable fabriquée en Italie, boucle argentée.',
      categoryId: categories[2].id,
      basePrice: 65.00,
      images: ['/images/products/ceinture-cuir.jpg'],
      isFeatured: false,
      tags: ['ceinture', 'cuir', 'accessoire'],
      variants: [
        { size: '85', color: 'Noir', colorHex: '#000000', stock: 25, additionalPrice: 0 },
        { size: '90', color: 'Noir', colorHex: '#000000', stock: 30, additionalPrice: 0 },
        { size: '95', color: 'Marron', colorHex: '#8B4513', stock: 20, additionalPrice: 0 },
      ],
    },
    {
      name: 'Écharpe en Cachemire',
      slug: 'echarpe-cachemire',
      description: 'Écharpe luxueuse en cachemire pur, douce et élégante.',
      categoryId: categories[2].id,
      basePrice: 145.00,
      images: ['/images/products/echarpe-cachemire.jpg'],
      isFeatured: true,
      tags: ['écharpe', 'cachemire', 'hiver'],
      variants: [
        { size: 'Unique', color: 'Gris Clair', colorHex: '#D3D3D3', stock: 15, additionalPrice: 0 },
        { size: 'Unique', color: 'Beige', colorHex: '#F5F5DC', stock: 18, additionalPrice: 0 },
        { size: 'Unique', color: 'Bordeaux', colorHex: '#800020', stock: 12, additionalPrice: 0 },
      ],
    },
    {
      name: 'Chapeau Fedora',
      slug: 'chapeau-fedora',
      description: 'Chapeau fedora classique en feutre, pour un style rétro chic.',
      categoryId: categories[2].id,
      basePrice: 75.00,
      images: ['/images/products/fedora.jpg'],
      isFeatured: false,
      tags: ['chapeau', 'fedora', 'rétro'],
      variants: [
        { size: 'M', color: 'Noir', colorHex: '#000000', stock: 14, additionalPrice: 0 },
        { size: 'L', color: 'Noir', colorHex: '#000000', stock: 10, additionalPrice: 0 },
        { size: 'L', color: 'Gris', colorHex: '#808080', stock: 8, additionalPrice: 0 },
      ],
    },

    // Chaussures - 4 products
    {
      name: 'Mocassins en Cuir Noir',
      slug: 'mocassins-cuir-noir',
      description: 'Mocassins élégants en cuir véritable, confort optimal.',
      categoryId: categories[3].id,
      basePrice: 180.00,
      images: ['/images/products/mocassins-noir.jpg'],
      isFeatured: true,
      tags: ['mocassins', 'cuir', 'formel'],
      variants: [
        { size: '40', color: 'Noir', colorHex: '#000000', stock: 12, additionalPrice: 0 },
        { size: '41', color: 'Noir', colorHex: '#000000', stock: 15, additionalPrice: 0 },
        { size: '42', color: 'Noir', colorHex: '#000000', stock: 14, additionalPrice: 0 },
        { size: '43', color: 'Noir', colorHex: '#000000', stock: 10, additionalPrice: 0 },
      ],
    },
    {
      name: 'Escarpins Rouges',
      slug: 'escarpins-rouges',
      description: 'Escarpins élégants à talons hauts, parfaits pour les soirées.',
      categoryId: categories[3].id,
      basePrice: 165.00,
      images: ['/images/products/escarpins-rouges.jpg'],
      isFeatured: true,
      tags: ['escarpins', 'talons', 'soirée'],
      variants: [
        { size: '37', color: 'Rouge', colorHex: '#DC143C', stock: 10, additionalPrice: 0 },
        { size: '38', color: 'Rouge', colorHex: '#DC143C', stock: 14, additionalPrice: 0 },
        { size: '39', color: 'Rouge', colorHex: '#DC143C', stock: 12, additionalPrice: 0 },
        { size: '40', color: 'Rouge', colorHex: '#DC143C', stock: 8, additionalPrice: 0 },
      ],
    },
    {
      name: 'Baskets Blanches Premium',
      slug: 'baskets-blanches-premium',
      description: 'Baskets en cuir blanc, style minimaliste et moderne.',
      categoryId: categories[3].id,
      basePrice: 140.00,
      images: ['/images/products/baskets-blanches.jpg'],
      isFeatured: false,
      tags: ['baskets', 'décontracté', 'sport'],
      variants: [
        { size: '39', color: 'Blanc', colorHex: '#FFFFFF', stock: 20, additionalPrice: 0 },
        { size: '40', color: 'Blanc', colorHex: '#FFFFFF', stock: 25, additionalPrice: 0 },
        { size: '41', color: 'Blanc', colorHex: '#FFFFFF', stock: 22, additionalPrice: 0 },
        { size: '42', color: 'Blanc', colorHex: '#FFFFFF', stock: 18, additionalPrice: 0 },
      ],
    },
    {
      name: 'Bottes Chelsea Marron',
      slug: 'bottes-chelsea-marron',
      description: 'Bottes Chelsea en daim, élégantes et confortables.',
      categoryId: categories[3].id,
      basePrice: 220.00,
      images: ['/images/products/bottes-chelsea.jpg'],
      isFeatured: false,
      tags: ['bottes', 'daim', 'automne'],
      variants: [
        { size: '40', color: 'Marron', colorHex: '#8B4513', stock: 10, additionalPrice: 0 },
        { size: '41', color: 'Marron', colorHex: '#8B4513', stock: 12, additionalPrice: 0 },
        { size: '42', color: 'Marron', colorHex: '#8B4513', stock: 8, additionalPrice: 0 },
      ],
    },

    // Sacs - 2 products
    {
      name: 'Sac à Main en Cuir Caramel',
      slug: 'sac-main-cuir-caramel',
      description: 'Sac à main élégant en cuir pleine fleur, plusieurs compartiments.',
      categoryId: categories[4].id,
      basePrice: 295.00,
      images: ['/images/products/sac-caramel.jpg'],
      isFeatured: true,
      tags: ['sac', 'cuir', 'élégant'],
      variants: [
        { size: 'Unique', color: 'Caramel', colorHex: '#C68E6D', stock: 12, additionalPrice: 0 },
        { size: 'Unique', color: 'Noir', colorHex: '#000000', stock: 15, additionalPrice: 0 },
      ],
    },
    {
      name: 'Sac à Dos en Toile',
      slug: 'sac-dos-toile',
      description: 'Sac à dos pratique en toile résistante, style urbain.',
      categoryId: categories[4].id,
      basePrice: 125.00,
      images: ['/images/products/sac-dos.jpg'],
      isFeatured: false,
      tags: ['sac à dos', 'toile', 'décontracté'],
      variants: [
        { size: 'Unique', color: 'Bleu Marine', colorHex: '#000080', stock: 20, additionalPrice: 0 },
        { size: 'Unique', color: 'Gris', colorHex: '#808080', stock: 18, additionalPrice: 0 },
        { size: 'Unique', color: 'Kaki', colorHex: '#8B864E', stock: 15, additionalPrice: 0 },
      ],
    },

    // Bijoux - 2 products
    {
      name: 'Collier en Or Rose',
      slug: 'collier-or-rose',
      description: 'Collier délicat en or rose 18 carats, pendentif cœur.',
      categoryId: categories[5].id,
      basePrice: 350.00,
      images: ['/images/products/collier-or-rose.jpg'],
      isFeatured: true,
      tags: ['collier', 'or', 'bijou'],
      variants: [
        { size: '40cm', color: 'Or Rose', colorHex: '#B76E79', stock: 8, additionalPrice: 0 },
        { size: '45cm', color: 'Or Rose', colorHex: '#B76E79', stock: 10, additionalPrice: 10 },
      ],
    },
    {
      name: 'Bracelet en Argent',
      slug: 'bracelet-argent',
      description: 'Bracelet élégant en argent sterling 925, design moderne.',
      categoryId: categories[5].id,
      basePrice: 125.00,
      images: ['/images/products/bracelet-argent.jpg'],
      isFeatured: false,
      tags: ['bracelet', 'argent', 'bijou'],
      variants: [
        { size: 'S', color: 'Argent', colorHex: '#C0C0C0', stock: 15, additionalPrice: 0 },
        { size: 'M', color: 'Argent', colorHex: '#C0C0C0', stock: 20, additionalPrice: 0 },
        { size: 'L', color: 'Argent', colorHex: '#C0C0C0', stock: 12, additionalPrice: 5 },
      ],
    },
  ];

  let totalVariants = 0;
  
  for (const productData of productsData) {
    const { variants, ...productInfo } = productData;
    
    const product = await prisma.product.create({
      data: {
        ...productInfo,
        images: productInfo.images,
        tags: productInfo.tags,
      },
    });

    // Create variants for this product
    for (const variant of variants) {
      const sku = `MLA-${product.slug.substring(0, 6).toUpperCase()}-${variant.size}-${variant.color.substring(0, 3).toUpperCase()}`;
      
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku,
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          stockQuantity: variant.stock,
          additionalPrice: variant.additionalPrice,
          isActive: true,
        },
      });
      totalVariants++;
    }
  }

  console.log('✓ Created', productsData.length, 'products with', totalVariants, 'variants');

  // 4. Create Sample Inventory Logs
  console.log('Creating sample inventory logs...');
  
  const allVariants = await prisma.productVariant.findMany({
    take: 10,
  });

  const inventoryLogs = [];
  for (const variant of allVariants) {
    // Restock log
    inventoryLogs.push(
      prisma.inventoryLog.create({
        data: {
          variantId: variant.id,
          changeType: 'RESTOCK',
          quantityChange: variant.stockQuantity,
          previousQuantity: 0,
          newQuantity: variant.stockQuantity,
          reason: 'Initial stock from supplier',
          performedBy: adminUser.id,
        },
      })
    );

    // Random adjustment
    if (Math.random() > 0.5) {
      const adjustment = Math.floor(Math.random() * 5) + 1;
      inventoryLogs.push(
        prisma.inventoryLog.create({
          data: {
            variantId: variant.id,
            changeType: 'ADJUSTMENT',
            quantityChange: adjustment,
            previousQuantity: variant.stockQuantity,
            newQuantity: variant.stockQuantity + adjustment,
            reason: 'Stock count correction',
            performedBy: adminUser.id,
          },
        })
      );
    }
  }

  await Promise.all(inventoryLogs);
  console.log('✓ Created', inventoryLogs.length, 'inventory logs');

  console.log('🎉 Seed completed successfully!');
  console.log('\nSummary:');
  console.log('- 1 admin user');
  console.log('-', categories.length, 'categories');
  console.log('-', productsData.length, 'products');
  console.log('-', totalVariants, 'product variants');
  console.log('-', inventoryLogs.length, 'inventory logs');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
