
import { PrismaClient } from '@prisma/client';
import { getStudentBalance, checkAndUpdateStatus } from '../lib/payment';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning up old data ---');
  await prisma.payment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.promotion.deleteMany();

  console.log('--- Creating Promotion & Student ---');
  const promo = await prisma.promotion.create({
    data: {
      name: 'DevOps 2024',
      totalFee: 100000,
    },
  });

  const student = await prisma.student.create({
    data: {
      name: 'John Doe',
      promotionId: promo.id,
    },
  });

  console.log(`Created Student: ${student.name}, Promotion: ${promo.name} (Fee: ${promo.totalFee})`);

  console.log('--- Initial Balance Check ---');
  let balance = await getStudentBalance(student.id);
  console.log('Initial Balance:', balance);

  console.log('--- Making Payment 1 (50,000) ---');
  await prisma.payment.create({
    data: {
      amount: 50000,
      month: 'January',
      studentId: student.id,
    },
  });
  await checkAndUpdateStatus(student.id);
  
  balance = await getStudentBalance(student.id);
  console.log('After Payment 1:', { paid: balance.totalPaid, remaining: balance.remaining, status: balance.status });

  console.log('--- Making Payment 2 (50,000) - Should finish ---');
  await prisma.payment.create({
    data: {
      amount: 50000,
      month: 'February',
      studentId: student.id,
    },
  });
  const newStatus = await checkAndUpdateStatus(student.id);
  
  balance = await getStudentBalance(student.id);
  console.log('After Payment 2:', { paid: balance.totalPaid, remaining: balance.remaining, status: balance.status });

  if (balance.status === 'COMPLETED') {
    console.log('SUCCESS: Status automatically updated to COMPLETED!');
  } else {
    console.error('FAILURE: Status did not update.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
