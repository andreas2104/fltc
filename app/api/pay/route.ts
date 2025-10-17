import { PrismaClient, Prisma, StudentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Récupère tous les paiements
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const feesId = searchParams.get('feesId');

    const where: any = {};
    if (studentId) where.studentId = parseInt(studentId);
    if (feesId) where.feesId = parseInt(feesId);

    const payments = await prisma.pay.findMany({
      where,
      include: {
        student: true,
        fees: true,
      },
    });
    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// Enregistre un nouveau paiement
export async function POST(request: Request) {
  try {
    const { amount, month, studentId, feesId } = await request.json();
    
    if (!amount || !month || !studentId || !feesId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Vérifier que les frais existent et appartiennent à l'étudiant
    const fee = await prisma.fees.findFirst({
      where: {
        feesId,
        studentId,
      },
      include: {
        pay: true,
      }
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee not found for this student" }, { status: 404 });
    }

    // Calculer le total déjà payé pour ces frais
    const totalPaid = fee.pay.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Vérifier que le paiement ne dépasse pas le montant dû
    if (totalPaid + amount > fee.price) {
      return NextResponse.json({ 
        error: "Payment exceeds due amount", 
        dueAmount: fee.price - totalPaid 
      }, { status: 400 });
    }

    const newPayment = await prisma.pay.create({
      data: {
        amount,
        month,
        studentId,
        feesId,
      },
      include: {
        student: true,
        fees: true,
      },
    });

    // Mettre à jour le statut de l'étudiant
    await updateStudentStatus(studentId);

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json({ error: "Student or fee not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

async function updateStudentStatus(studentId: number) {
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: {
      fees: {
        include: {
          pay: true
        }
      }
    }
  });

  if (!student) return;

  let hasOverdue = false;
  let allFeesPaid = true;

  for (const fee of student.fees) {
    const totalPaid = fee.pay.reduce((sum, payment) => sum + payment.amount, 0);
    
    if (totalPaid < fee.price) {
      allFeesPaid = false;
      
      if (fee.feeType === 'ECOLAGE_MENSUEL' && fee.month) {
        const feeMonth = new Date(fee.month);
        const now = new Date();
        if (feeMonth < now && totalPaid === 0) {
          hasOverdue = true;
        }
      }
    }
  }

  let newStatus: StudentStatus;
  if (allFeesPaid) newStatus = StudentStatus.COMPLETED;
  else if (hasOverdue) newStatus = StudentStatus.OVERDUE;
  else newStatus = StudentStatus.PENDING;

  await prisma.student.update({
    where: { studentId },
    data: { status: newStatus }
  });
}