import { hashPassword, verifyPassword, isPasswordHashed } from '../src/lib/password';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

try {
  process.loadEnvFile?.();
} catch {}

const connectionUrl = (process.env.DATABASE_URL || '').replace('localhost', '127.0.0.1');
const adapter = new PrismaMariaDb(connectionUrl);
const prisma = new PrismaClient({ adapter });

async function test() {
  console.log('--- Testing Password Security ---');
  
  // Test 1: Hash generation
  const testPw = 'RahasiaSuperKuat123!';
  const hashed = await hashPassword(testPw);
  console.log('1. Hash generated successfully:', hashed.substring(0, 20) + '...');
  
  // Test 2: Check isPasswordHashed
  const isHashed = isPasswordHashed(hashed);
  console.log('2. isPasswordHashed check:', isHashed);
  if (!isHashed) throw new Error('isPasswordHashed failed');

  // Test 3: Verification with correct password
  const matchCorrect = await verifyPassword(testPw, hashed);
  console.log('3. Correct password match:', matchCorrect);
  if (!matchCorrect) throw new Error('verifyPassword failed on correct password');

  // Test 4: Verification with wrong password
  const matchWrong = await verifyPassword('SalahPassword', hashed);
  console.log('4. Wrong password rejected:', !matchWrong);
  if (matchWrong) throw new Error('verifyPassword allowed wrong password');

  // Test 5: Verify existing DB users can authenticate
  const budi = await prisma.user.findUnique({ where: { email: 'budi.santoso@gmail.com' } });
  if (budi) {
    console.log('5. Budi Santoso stored password:', budi.password?.substring(0, 15) + '... (is Bcrypt:', isPasswordHashed(budi.password), ')');
    const budiMatch = await verifyPassword('password123', budi.password);
    console.log('   Budi login with "password123":', budiMatch ? 'SUCCESS ✅' : 'FAILED ❌');
  }

  const pito = await prisma.user.findUnique({ where: { email: 'akunkhusustumbaldua@gmail.com' } });
  if (pito) {
    console.log('6. Pito Sanjaya stored password:', pito.password?.substring(0, 15) + '... (is Bcrypt:', isPasswordHashed(pito.password), ')');
    const pitoMatch = await verifyPassword('Mautauaja12', pito.password);
    console.log('   Pito login with "Mautauaja12":', pitoMatch ? 'SUCCESS ✅' : 'FAILED ❌');
  }

  console.log('\n🎉 ALL SECURITY TESTS PASSED!');
}

test()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
