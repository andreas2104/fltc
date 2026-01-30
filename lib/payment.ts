
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Define the type with relations included
type StudentWithRelations = Prisma.StudentGetPayload<{
  include: { promotion: true; payments: true }
}>;

/**
 * Calculates the total paid by a student and their remaining balance.
 * @param studentId Is the ID of the student
 */
export async function getStudentBalance(studentId: number) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      promotion: true,
      payments: true,
    },
  }) as any;

  if (!student) {
    throw new Error(`Student with ID ${studentId} not found`);
  }

  const totalPaid = student.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
  const totalFee = student.promotion.totalFee;
  const remaining = totalFee - totalPaid;

  return {
    studentName: student.name,
    promotion: student.promotion.name,
    totalFee,
    totalPaid,
    remaining,
    status: student.status,
    payments: student.payments
  };
}

/**
 * Checks if a student has paid the full amount and updates status to COMPLETED if so.
 * This should be called after every payment insertion.
 * @param studentId The ID of the student
 */
export async function checkAndUpdateStatus(studentId: number) {
  const { totalPaid, totalFee, status } = await getStudentBalance(studentId);

  let newStatus = status;
  if (totalPaid >= totalFee && status !== 'COMPLETED') {
    newStatus = 'COMPLETED';
  } else if (totalPaid < totalFee && status === 'COMPLETED') {
    newStatus = 'PENDING';
  }

  if (newStatus !== status) {
    await prisma.student.update({
      where: { id: studentId },
      data: { status: newStatus },
    });
  }

  return newStatus;
}
