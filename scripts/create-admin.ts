/**
 * Script to create an admin user
 * 
 * Usage (interactive):
 *   npm run create-admin
 * 
 * Usage (with arguments):
 *   npm run create-admin <email> <password> <firstName> <lastName>
 * 
 * Example:
 *   npm run create-admin admin@medibook.com SecurePass123! Admin User
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hashPassword } from '../src/lib/auth';
import * as readline from 'readline';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function promptForInput(): Promise<{ email: string; password: string; firstName: string; lastName: string }> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log('\n📝 Admin User Creation\n');
    
    const email = await question(rl, 'Email: ');
    const password = await question(rl, 'Password: ');
    const firstName = await question(rl, 'First Name: ');
    const lastName = await question(rl, 'Last Name: ');

    return { email, password, firstName, lastName };
  } finally {
    rl.close();
  }
}

async function createAdmin() {
  const args = process.argv.slice(2);
  
  let email: string;
  let password: string;
  let firstName: string;
  let lastName: string;

  // If arguments provided, use them; otherwise prompt interactively
  if (args.length >= 4) {
    [email, password, firstName, lastName] = args;
  } else {
    const input = await promptForInput();
    email = input.email.trim();
    password = input.password.trim();
    firstName = input.firstName.trim();
    lastName = input.lastName.trim();
  }

  // Validate inputs
  if (!email || !password || !firstName || !lastName) {
    console.error('❌ All fields are required!');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long!');
    process.exit(1);
  }

  if (!email.includes('@')) {
    console.error('❌ Invalid email address!');
    process.exit(1);
  }

  try {
    console.log('\n🔨 Creating admin user...');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${firstName} ${lastName}\n`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      console.error(`❌ User with email ${email} already exists!`);
      process.exit(1);
    }

    // Get or create admin role
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Administrator role',
      },
    });

    console.log('✓ Admin role found/created');

    // Hash password
    const passwordHash = await hashPassword(password);
    console.log('✓ Password hashed');

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        roleId: adminRole.id,
        emailVerified: true, // Admin users are auto-verified
        emailVerifiedAt: new Date(),
      },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   User ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Role: admin`);
    console.log(`   Email Verified: ${adminUser.emailVerified}`);
    console.log('\n🔐 Next Steps:');
    console.log('   1. Go to /sign-in');
    console.log('   2. Sign in with the credentials you just created');
    console.log('   3. You will be redirected to /admin dashboard\n');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

