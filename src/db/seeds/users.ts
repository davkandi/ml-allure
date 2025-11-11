import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const sampleUsers = [
        {
            email: 'admin@mlallure.com',
            password: hashedPassword,
            role: 'ADMIN',
            firstName: 'Admin',
            lastName: 'User',
            phone: '+243 123 456 789',
            isActive: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});