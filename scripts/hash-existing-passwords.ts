import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';

const connectionUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/smart_recruit';
const adapter = new PrismaMariaDb(connectionUrl);
const prisma = new PrismaClient({ adapter });

function isBcrypt(pw: string | null | undefined): boolean {
  if (!pw) return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(pw);
}

async function main() {
  console.log('🔒 Mengamankan dan mengenkripsi seluruh password pengguna di database...');
  
  const users = await prisma.user.findMany();
  console.log(`Ditemukan ${users.length} pengguna di tabel User.`);

  let updatedCount = 0;

  for (const user of users) {
    // If OAuth placeholder
    if (user.password === 'google-oauth-authenticated') {
      console.log(`🧹 Membersihkan password OAuth untuk: ${user.email}`);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: null }
      });
      updatedCount++;
      continue;
    }

    // If plaintext password (not hashed)
    if (user.password && !isBcrypt(user.password)) {
      console.log(`🔑 Mengenkripsi plaintext password untuk user: ${user.email} (${user.name})`);
      const hashed = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed }
      });
      updatedCount++;
    }
  }

  console.log(`✨ Sukses! ${updatedCount} password pengguna berhasil dienkripsi dengan standar industri Bcrypt.`);
}

main()
  .catch((e) => {
    console.error('Error migrating passwords:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
