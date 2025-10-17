import { PrismaClient, Prisma, StudentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Récupère un paiement spécifique
export async function GET(
  request: Request,
  { params }: { params: { payId: string } }
) {
  try {
    const payId = parseInt(params.payId);
    
    if (isNaN(payId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const payment = await prisma.pay.findUnique({
      where: { payId },
      include: {
        student: true,
        fees: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(payment, { status: 200 });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// Met à jour un paiement
export async function PUT(
  request: Request,
  { params }: { params: { payId: string } }
) {
  try {
    const payId = parseInt(params.payId);
    const body = await request.json();
    const { amount, month, studentId, feesId } = body;
    
    if (isNaN(payId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Vérification des champs requis
    if (!amount || !month || !studentId || !feesId) {
      return NextResponse.json({ 
        error: "Missing required fields",
        details: {
          amount: !amount ? "Amount is required" : undefined,
          month: !month ? "Payment date (month) is required" : undefined,
          studentId: !studentId ? "Student ID is required" : undefined,
          feesId: !feesId ? "Fee ID is required" : undefined,
        }
      }, { status: 400 });
    }

    // Vérifier que le paiement existe
    const existingPayment = await prisma.pay.findUnique({
      where: { payId }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Vérifier que les frais existent et appartiennent à l'étudiant
    const fee = await prisma.fees.findFirst({
      where: {
        feesId: Number(feesId),
        studentId: Number(studentId),
      },
      include: {
        pay: true,
      }
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee not found for this student" }, { status: 404 });
    }

    // Calculer le total déjà payé (excluant le paiement actuel en cours de modification)
    const totalPaidExcludingCurrent = fee.pay
      .filter(payment => payment.payId !== payId)
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    // Vérifier que le paiement ne dépasse pas le montant dû
    if (totalPaidExcludingCurrent + Number(amount) > fee.price) {
      return NextResponse.json({ 
        error: "Payment exceeds due amount", 
        dueAmount: fee.price - totalPaidExcludingCurrent 
      }, { status: 400 });
    }

    const updatedPayment = await prisma.pay.update({
      where: { payId },
      data: {
        amount: Number(amount),
        month: month,
        studentId: Number(studentId),
        feesId: Number(feesId),
      },
      include: {
        student: true,
        fees: true,
      },
    });

    // Mettre à jour le statut de l'étudiant
    await updateStudentStatus(Number(studentId));

    return NextResponse.json(updatedPayment, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }
      if (error.code === 'P2003') {
        return NextResponse.json({ error: "Student or fee not found" }, { status: 404 });
      }
    }
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { payId: string } }
) {
  try {
    const payId = parseInt(params.payId);
    
    if (isNaN(payId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Récupérer le paiement avant suppression pour avoir l'ID de l'étudiant
    const payment = await prisma.pay.findUnique({
      where: { payId },
      select: { studentId: true }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await prisma.pay.delete({
      where: { payId },
    });

    // Mettre à jour le statut de l'étudiant
    await updateStudentStatus(payment.studentId);

    return NextResponse.json({ message: "Payment deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    console.error("Error deleting payment:", error);
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