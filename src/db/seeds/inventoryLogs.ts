import { db } from '@/db';
import { inventoryLogs } from '@/db/schema';

async function main() {
    const now = Date.now();
    
    const sampleInventoryLogs = [
        {
            variantId: 1,
            changeType: 'RESTOCK',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Initial stock replenishment',
            performedBy: 1,
            orderId: null,
            createdAt: now - 9 * 24 * 60 * 60 * 1000,
        },
        {
            variantId: 2,
            changeType: 'RESTOCK',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Monthly restock from supplier',
            performedBy: 1,
            orderId: null,
            createdAt: now - 8 * 24 * 60 * 60 * 1000,
        },
        {
            variantId: 3,
            changeType: 'RESTOCK',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Initial stock replenishment',
            performedBy: 1,
            orderId: null,
            createdAt: now - 7 * 24 * 60 * 60 * 1000,
        },
        {
            variantId: 4,
            changeType: 'RESTOCK',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Monthly restock from supplier',
            performedBy: 1,
            orderId: null,
            createdAt: now - 6 * 24 * 60 * 60 * 1000,
        },
        {
            variantId: 5,
            changeType: 'RESTOCK',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Initial stock replenishment',
            performedBy: 1,
            orderId: null,
            createdAt: now - 5 * 24 * 60 * 60 * 1000,
        },
        {
            variantId: 6,
            changeType: 'RESTOCK',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Monthly restock from supplier',
            performedBy: 1,
            orderId: null,
            createdAt: now - 4 * 24 * 60 * 60 * 1000,
        },
        {
            variantId: 7,
            changeType: 'RESTOCK',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Initial stock replenishment',
            performedBy: 1,
            orderId: null,
            createdAt: now - 3 * 24 * 60 * 60 * 1000,
        },
        {
            variantId: 8,
            changeType: 'RESTOCK',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Monthly restock from supplier',
            performedBy: 1,
            orderId: null,
            createdAt: now - 2 * 24 * 60 * 60 * 1000,
        },
        {
            variantId: 9,
            changeType: 'RESTOCK',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Initial stock replenishment',
            performedBy: 1,
            orderId: null,
            createdAt: now - 1 * 24 * 60 * 60 * 1000,
        },
        {
            variantId: 10,
            changeType: 'RESTOCK',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Monthly restock from supplier',
            performedBy: 1,
            orderId: null,
            createdAt: now,
        },
    ];

    await db.insert(inventoryLogs).values(sampleInventoryLogs);
    
    console.log('✅ Inventory logs seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});