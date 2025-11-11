import { db } from '@/db';
import { products } from '@/db/schema';

async function main() {
    const sampleProducts = [
        // Category 1 (Hommes) - 4 products
        {
            name: 'Chemise en Lin Blanc',
            slug: 'chemise-en-lin-blanc',
            description: 'Une élégante chemise en lin naturel pour l\'été. Coupe classique avec col italien, parfaite pour les occasions décontractées ou semi-formelles.',
            categoryId: 1,
            basePrice: 89.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
                'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400',
                'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=400'
            ]),
            isActive: 1,
            isFeatured: 1,
            tags: JSON.stringify(['été', 'casual', 'lin']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Pantalon Chino Beige',
            slug: 'pantalon-chino-beige',
            description: 'Pantalon chino classique en coton stretch. Coupe slim moderne avec finitions soignées. Idéal pour le bureau ou les sorties du weekend.',
            categoryId: 1,
            basePrice: 119.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400',
                'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['casual', 'bureau', 'confortable']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Veste Blazer Marine',
            slug: 'veste-blazer-marine',
            description: 'Blazer élégant en laine mélangée avec doublure en satin. Coupe ajustée moderne avec deux boutons. Un essentiel pour toute garde-robe masculine.',
            categoryId: 1,
            basePrice: 279.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400',
                'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400'
            ]),
            isActive: 1,
            isFeatured: 1,
            tags: JSON.stringify(['formel', 'élégant', 'bureau']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Pull Col Roulé Noir',
            slug: 'pull-col-roule-noir',
            description: 'Pull en cachemire mélangé avec col roulé classique. Doux et chaud, parfait pour la saison froide. Disponible en plusieurs couleurs.',
            categoryId: 1,
            basePrice: 145.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
                'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['hiver', 'chaud', 'casual']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        // Category 2 (Femmes) - 4 products
        {
            name: 'Robe Élégante Noir',
            slug: 'robe-elegante-noir',
            description: 'Robe cocktail sophistiquée en crêpe fluide. Coupe ajustée avec col en V et manches trois-quarts. Parfaite pour les événements spéciaux.',
            categoryId: 2,
            basePrice: 189.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
                'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400',
                'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'
            ]),
            isActive: 1,
            isFeatured: 1,
            tags: JSON.stringify(['soirée', 'élégant', 'formel']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Blouse Satin Rouge',
            slug: 'blouse-satin-rouge',
            description: 'Blouse luxueuse en satin avec col lavallière. Finitions délicates et boutons nacrés. Apporte une touche d\'élégance à toute tenue.',
            categoryId: 2,
            basePrice: 95.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1564257577154-bc976a7cd0c4?w=400',
                'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['chic', 'bureau', 'satin']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Jupe Plissée Rose',
            slug: 'jupe-plissee-rose',
            description: 'Jupe midi plissée en mousseline légère. Taille haute élastique et doublure en soie. Style romantique et féminin pour toutes occasions.',
            categoryId: 2,
            basePrice: 79.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400',
                'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['romantique', 'printemps', 'féminin']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Ensemble Tailleur Bleu',
            slug: 'ensemble-tailleur-bleu',
            description: 'Ensemble tailleur professionnel composé d\'une veste cintrée et d\'un pantalon droit. Tissu stretch confortable. Idéal pour le monde professionnel.',
            categoryId: 2,
            basePrice: 299.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400',
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'
            ]),
            isActive: 1,
            isFeatured: 1,
            tags: JSON.stringify(['professionnel', 'élégant', 'bureau']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        // Category 3 (Accessoires) - 3 products
        {
            name: 'Ceinture Cuir Marron',
            slug: 'ceinture-cuir-marron',
            description: 'Ceinture en cuir véritable de haute qualité. Boucle classique en métal argenté. Largeur standard 3.5cm, disponible en plusieurs tailles.',
            categoryId: 3,
            basePrice: 59.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1624222247344-550fb60583db?w=400',
                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['cuir', 'classique', 'accessoire']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Écharpe Soie Multicolore',
            slug: 'echarpe-soie-multicolore',
            description: 'Écharpe légère en soie pure avec motifs artistiques. Dimensions généreuses 180x70cm. Parfaite pour ajouter une touche de couleur à votre tenue.',
            categoryId: 3,
            basePrice: 89.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400',
                'https://images.unsplash.com/photo-1582142306909-195724d3c5e4?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['soie', 'coloré', 'élégant']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Lunettes de Soleil Classic',
            slug: 'lunettes-de-soleil-classic',
            description: 'Lunettes de soleil intemporelles avec monture en acétate et verres polarisés UV400. Style aviateur moderne avec étui de protection inclus.',
            categoryId: 3,
            basePrice: 129.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
                'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['été', 'protection', 'style']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        // Category 4 (Chaussures) - 4 products
        {
            name: 'Escarpins Cuir Noir',
            slug: 'escarpins-cuir-noir',
            description: 'Escarpins classiques en cuir véritable avec talon de 8cm. Bout pointu élégant et semelle intérieure rembourrée pour plus de confort.',
            categoryId: 4,
            basePrice: 149.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
                'https://images.unsplash.com/photo-1596702842406-d490794ec509?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['formel', 'élégant', 'bureau']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Baskets Tendance Blanc',
            slug: 'baskets-tendance-blanc',
            description: 'Sneakers modernes en cuir blanc avec détails colorés. Semelle en caoutchouc antidérapante. Confort optimal pour un usage quotidien.',
            categoryId: 4,
            basePrice: 119.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
                'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400',
                'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400'
            ]),
            isActive: 1,
            isFeatured: 1,
            tags: JSON.stringify(['sport', 'casual', 'confortable']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Bottines Chelsea Marron',
            slug: 'bottines-chelsea-marron',
            description: 'Bottines Chelsea en daim premium. Élastiques latéraux et tirette arrière pour un enfilage facile. Style intemporel pour toutes saisons.',
            categoryId: 4,
            basePrice: 189.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400',
                'https://images.unsplash.com/photo-1581101767113-1677fc2beaa8?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['automne', 'classique', 'daim']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Sandales Été Beige',
            slug: 'sandales-ete-beige',
            description: 'Sandales légères en cuir naturel avec semelle en liège. Brides ajustables pour un maintien parfait. Idéales pour les journées ensoleillées.',
            categoryId: 4,
            basePrice: 79.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400',
                'https://images.unsplash.com/photo-1562362851-b8a8f8e68e9d?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['été', 'plage', 'confortable']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        // Category 5 (Sacs) - 3 products
        {
            name: 'Sac à Main Cuir Rouge',
            slug: 'sac-a-main-cuir-rouge',
            description: 'Sac à main structuré en cuir italien. Fermeture magnétique et poches intérieures multiples. Bandoulière amovible pour porter à l\'épaule ou en crossbody.',
            categoryId: 5,
            basePrice: 259.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
                'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['luxe', 'cuir', 'élégant']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Sac Bandoulière Noir',
            slug: 'sac-bandouliere-noir',
            description: 'Sac crossbody compact en cuir grainé. Format idéal pour l\'essentiel quotidien. Chaîne dorée ajustable et fermeture éclair sécurisée.',
            categoryId: 5,
            basePrice: 159.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
                'https://images.unsplash.com/photo-1590393883775-53c1b2f5f114?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['pratique', 'quotidien', 'compact']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Pochette Soirée Or',
            slug: 'pochette-soiree-or',
            description: 'Pochette élégante avec finition métallisée dorée. Chaîne détachable et intérieur en satin. Parfaite pour les événements formels et les soirées.',
            categoryId: 5,
            basePrice: 99.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400',
                'https://images.unsplash.com/photo-1564422167509-4f73449ca6e8?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['soirée', 'luxe', 'formel']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        // Category 6 (Bijoux) - 2 products
        {
            name: 'Collier Perles Élégant',
            slug: 'collier-perles-elegant',
            description: 'Collier sophistiqué en perles d\'eau douce véritables. Fermoir en argent sterling 925. Longueur ajustable, livré dans un écrin cadeau.',
            categoryId: 6,
            basePrice: 349.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
                'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['perles', 'luxe', 'élégant']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Boucles d\'Oreilles Diamant',
            slug: 'boucles-d-oreilles-diamant',
            description: 'Boucles d\'oreilles en or blanc 18 carats serties de diamants véritables. Design intemporel et élégant. Certificat d\'authenticité inclus.',
            categoryId: 6,
            basePrice: 449.99,
            currency: 'USD',
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=400',
                'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400'
            ]),
            isActive: 1,
            isFeatured: 0,
            tags: JSON.stringify(['diamant', 'luxe', 'précieux']),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    ];

    await db.insert(products).values(sampleProducts);
    
    console.log('✅ Products seeder completed successfully - 20 French fashion products created');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});