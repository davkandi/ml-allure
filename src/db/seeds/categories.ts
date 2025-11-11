import { db } from '@/db';
import { categories } from '@/db/schema';

async function main() {
    const sampleCategories = [
        {
            name: 'Hommes',
            slug: 'hommes',
            description: 'Mode masculine élégante et contemporaine',
            imageUrl: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400',
            isActive: 1,
            displayOrder: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Femmes',
            slug: 'femmes',
            description: 'Collections féminines tendance et sophistiquées',
            imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
            isActive: 1,
            displayOrder: 2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Accessoires',
            slug: 'accessoires',
            description: 'Accessoires de mode pour compléter votre style',
            imageUrl: 'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?w=400',
            isActive: 1,
            displayOrder: 3,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Chaussures',
            slug: 'chaussures',
            description: 'Chaussures confortables et élégantes pour toutes occasions',
            imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
            isActive: 1,
            displayOrder: 4,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Sacs',
            slug: 'sacs',
            description: 'Sacs à main et sacs de voyage de qualité',
            imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
            isActive: 1,
            displayOrder: 5,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Bijoux',
            slug: 'bijoux',
            description: 'Bijoux raffinés pour sublimer votre look',
            imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
            isActive: 1,
            displayOrder: 6,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
    ];

    await db.insert(categories).values(sampleCategories);
    
    console.log('✅ Categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});