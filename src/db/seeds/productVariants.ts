import { db } from '@/db';
import { productVariants } from '@/db/schema';

async function main() {
    const now = Date.now();
    
    const sampleProductVariants = [
        // Products 1-8 (Clothing - Hommes/Femmes)
        // Product 1
        { productId: 1, sku: 'MLA-1-1', size: 'S', color: 'Noir', colorHex: '#000000', stockQuantity: 25, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 1, sku: 'MLA-1-2', size: 'M', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 35, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 1, sku: 'MLA-1-3', size: 'L', color: 'Bleu', colorHex: '#4169E1', stockQuantity: 20, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 2
        { productId: 2, sku: 'MLA-2-1', size: 'S', color: 'Noir', colorHex: '#000000', stockQuantity: 22, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 2, sku: 'MLA-2-2', size: 'M', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 38, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 2, sku: 'MLA-2-3', size: 'L', color: 'Bleu', colorHex: '#4169E1', stockQuantity: 18, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 3
        { productId: 3, sku: 'MLA-3-1', size: 'S', color: 'Noir', colorHex: '#000000', stockQuantity: 28, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 3, sku: 'MLA-3-2', size: 'M', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 32, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 3, sku: 'MLA-3-3', size: 'L', color: 'Bleu', colorHex: '#4169E1', stockQuantity: 22, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 4
        { productId: 4, sku: 'MLA-4-1', size: 'S', color: 'Noir', colorHex: '#000000', stockQuantity: 24, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 4, sku: 'MLA-4-2', size: 'M', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 36, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 4, sku: 'MLA-4-3', size: 'L', color: 'Bleu', colorHex: '#4169E1', stockQuantity: 19, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 5
        { productId: 5, sku: 'MLA-5-1', size: 'S', color: 'Noir', colorHex: '#000000', stockQuantity: 26, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 5, sku: 'MLA-5-2', size: 'M', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 34, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 5, sku: 'MLA-5-3', size: 'L', color: 'Bleu', colorHex: '#4169E1', stockQuantity: 21, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 6
        { productId: 6, sku: 'MLA-6-1', size: 'S', color: 'Noir', colorHex: '#000000', stockQuantity: 23, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 6, sku: 'MLA-6-2', size: 'M', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 37, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 6, sku: 'MLA-6-3', size: 'L', color: 'Bleu', colorHex: '#4169E1', stockQuantity: 17, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 7
        { productId: 7, sku: 'MLA-7-1', size: 'S', color: 'Noir', colorHex: '#000000', stockQuantity: 27, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 7, sku: 'MLA-7-2', size: 'M', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 33, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 7, sku: 'MLA-7-3', size: 'L', color: 'Bleu', colorHex: '#4169E1', stockQuantity: 24, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 8
        { productId: 8, sku: 'MLA-8-1', size: 'S', color: 'Noir', colorHex: '#000000', stockQuantity: 29, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 8, sku: 'MLA-8-2', size: 'M', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 31, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 8, sku: 'MLA-8-3', size: 'L', color: 'Bleu', colorHex: '#4169E1', stockQuantity: 16, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Products 9-11 (Accessoires)
        // Product 9
        { productId: 9, sku: 'MLA-9-1', size: 'Unique', color: 'Noir', colorHex: '#000000', stockQuantity: 30, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 9, sku: 'MLA-9-2', size: 'Unique', color: 'Marron', colorHex: '#8B4513', stockQuantity: 25, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 9, sku: 'MLA-9-3', size: 'Unique', color: 'Rouge', colorHex: '#DC143C', stockQuantity: 20, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 10
        { productId: 10, sku: 'MLA-10-1', size: 'Unique', color: 'Noir', colorHex: '#000000', stockQuantity: 28, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 10, sku: 'MLA-10-2', size: 'Unique', color: 'Marron', colorHex: '#8B4513', stockQuantity: 22, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 10, sku: 'MLA-10-3', size: 'Unique', color: 'Rouge', colorHex: '#DC143C', stockQuantity: 18, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 11
        { productId: 11, sku: 'MLA-11-1', size: 'Unique', color: 'Noir', colorHex: '#000000', stockQuantity: 32, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 11, sku: 'MLA-11-2', size: 'Unique', color: 'Marron', colorHex: '#8B4513', stockQuantity: 27, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 11, sku: 'MLA-11-3', size: 'Unique', color: 'Rouge', colorHex: '#DC143C', stockQuantity: 22, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Products 12-15 (Chaussures)
        // Product 12
        { productId: 12, sku: 'MLA-12-1', size: '38', color: 'Noir', colorHex: '#000000', stockQuantity: 20, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 12, sku: 'MLA-12-2', size: '40', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 25, additionalPrice: 10, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 12, sku: 'MLA-12-3', size: '42', color: 'Marron', colorHex: '#8B4513', stockQuantity: 15, additionalPrice: 15, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 13
        { productId: 13, sku: 'MLA-13-1', size: '38', color: 'Noir', colorHex: '#000000', stockQuantity: 18, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 13, sku: 'MLA-13-2', size: '40', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 22, additionalPrice: 10, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 13, sku: 'MLA-13-3', size: '42', color: 'Marron', colorHex: '#8B4513', stockQuantity: 12, additionalPrice: 15, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 14
        { productId: 14, sku: 'MLA-14-1', size: '38', color: 'Noir', colorHex: '#000000', stockQuantity: 22, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 14, sku: 'MLA-14-2', size: '40', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 28, additionalPrice: 10, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 14, sku: 'MLA-14-3', size: '42', color: 'Marron', colorHex: '#8B4513', stockQuantity: 16, additionalPrice: 15, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 15
        { productId: 15, sku: 'MLA-15-1', size: '38', color: 'Noir', colorHex: '#000000', stockQuantity: 24, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 15, sku: 'MLA-15-2', size: '40', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 26, additionalPrice: 10, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 15, sku: 'MLA-15-3', size: '42', color: 'Marron', colorHex: '#8B4513', stockQuantity: 18, additionalPrice: 15, isActive: 1, createdAt: now, updatedAt: now },
        
        // Products 16-18 (Sacs)
        // Product 16
        { productId: 16, sku: 'MLA-16-1', size: 'M', color: 'Rouge', colorHex: '#DC143C', stockQuantity: 25, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 16, sku: 'MLA-16-2', size: 'M', color: 'Noir', colorHex: '#000000', stockQuantity: 30, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 16, sku: 'MLA-16-3', size: 'L', color: 'Beige', colorHex: '#F5F5DC', stockQuantity: 20, additionalPrice: 20, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 17
        { productId: 17, sku: 'MLA-17-1', size: 'M', color: 'Rouge', colorHex: '#DC143C', stockQuantity: 22, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 17, sku: 'MLA-17-2', size: 'M', color: 'Noir', colorHex: '#000000', stockQuantity: 28, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 17, sku: 'MLA-17-3', size: 'L', color: 'Beige', colorHex: '#F5F5DC', stockQuantity: 18, additionalPrice: 20, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 18
        { productId: 18, sku: 'MLA-18-1', size: 'M', color: 'Rouge', colorHex: '#DC143C', stockQuantity: 28, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 18, sku: 'MLA-18-2', size: 'M', color: 'Noir', colorHex: '#000000', stockQuantity: 32, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 18, sku: 'MLA-18-3', size: 'L', color: 'Beige', colorHex: '#F5F5DC', stockQuantity: 22, additionalPrice: 20, isActive: 1, createdAt: now, updatedAt: now },
        
        // Products 19-20 (Bijoux)
        // Product 19
        { productId: 19, sku: 'MLA-19-1', size: 'Unique', color: 'Or', colorHex: '#FFD700', stockQuantity: 12, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 19, sku: 'MLA-19-2', size: 'Unique', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 14, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 19, sku: 'MLA-19-3', size: 'Unique', color: 'Rose', colorHex: '#FFB6C1', stockQuantity: 10, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        
        // Product 20
        { productId: 20, sku: 'MLA-20-1', size: 'Unique', color: 'Or', colorHex: '#FFD700', stockQuantity: 11, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 20, sku: 'MLA-20-2', size: 'Unique', color: 'Blanc', colorHex: '#FFFFFF', stockQuantity: 13, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
        { productId: 20, sku: 'MLA-20-3', size: 'Unique', color: 'Rose', colorHex: '#FFB6C1', stockQuantity: 9, additionalPrice: 0, isActive: 1, createdAt: now, updatedAt: now },
    ];

    await db.insert(productVariants).values(sampleProductVariants);
    
    console.log('✅ Product variants seeder completed successfully - 60 variants created (3 per product for 20 products)');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});