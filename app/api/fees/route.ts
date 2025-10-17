import { PrismaClient, Prisma, FeeType, StudentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('studentId');

    if (studentIdParam) {
      const studentId = parseInt(studentIdParam);
      
      if (isNaN(studentId)) {
        return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 });
      }

      const studentFees = await prisma.fees.findMany({
        where: { studentId },
        include: {
          student: true,
          pay: true,
        },
        orderBy: [
          { feeType: 'asc' },
          { month: 'asc' },
        ],
      });

      const totalAnnuel = studentFees
        .filter(f => f.feeType === FeeType.DROITS_ANNUELS)
        .reduce((sum, fee) => sum + fee.price, 0);

      const totalMensuel = studentFees
        .filter(f => f.feeType === FeeType.ECOLAGE_MENSUEL)
        .reduce((sum, fee) => sum + fee.price, 0);

      const totalPaye = studentFees.reduce((acc, fee) => {
        return acc + fee.pay.reduce((paySum, pay) => paySum + pay.amount, 0);
      }, 0);

      return NextResponse.json({
        studentFees,
        totals: {
          annuel: totalAnnuel,
          mensuel: totalMensuel,
          totalAttendu: totalAnnuel + totalMensuel,
          totalPaye,
          resteAPayer: Math.max(0, totalAnnuel + totalMensuel - totalPaye),
        },
      }, { status: 200 });
    }

    const fees = await prisma.fees.findMany({
      include: {
        student: true,
        pay: true,
      },
      orderBy: [
        { studentId: 'asc' },
        { feeType: 'asc' },
        { month: 'asc' },
      ],
    });

    return NextResponse.json(fees, { status: 200 });
  } catch (error) {
    console.error("Error fetching fees:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { price, feeType, month, studentId } = await request.json();
    
    if (!price || !feeType || !studentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (feeType === FeeType.ECOLAGE_MENSUEL && !month) {
      return NextResponse.json({ error: "Month is required for monthly fees" }, { status: 400 });
    }

    const newFee = await prisma.fees.create({
      data: {
        price,
        feeType,
        month: feeType === FeeType.ECOLAGE_MENSUEL ? month : null,
        studentId,
      },
      include: {
        student: true,
        pay: true,
      },
    });

    await updateStudentStatus(studentId);

    return NextResponse.json(newFee, { status: 201 });
  } catch (error) {
    console.error("Error creating fee:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
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