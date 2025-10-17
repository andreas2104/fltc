import { PrismaClient, Prisma, FeeType, StudentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();


export async function GET(
  request: Request,
  { params }: { params: { feesId: string } }
) {
  try {
    const feesId = parseInt(params.feesId);

    if (isNaN(feesId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const fee = await prisma.fees.findUnique({
      where: { feesId },
      include: {
        student: true,
        pay: true,
      },
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    return NextResponse.json(fee, { status: 200 });
  } catch (error) {
    console.error("Error fetching fee:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }>}
) {
  try {
    const {id} = await params;
    const feesId = parseInt(id);
    const { price, feeType, month, studentId } = await request.json();
    
    if (isNaN(feesId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    if (feeType === FeeType.ECOLAGE_MENSUEL && !month) {
      return NextResponse.json({ error: "Month is required for monthly fees" }, { status: 400 });
    }

    const updatedFee = await prisma.fees.update({
      where: { feesId },
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

    if (studentId) {
      await updateStudentStatus(studentId);
    }

    return NextResponse.json(updatedFee, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: "Fee not found" }, { status: 404 });
      }
      if (error.code === 'P2003') {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
    }
    console.error("Error updating fee:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id} = await params;
    const feesId = parseInt(id);
    if (isNaN(feesId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    const fee = await prisma.fees.findUnique({
      where: { feesId },
      select: { studentId: true }
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    await prisma.pay.deleteMany({
      where: { feesId: feesId }
    });
    await prisma.fees.delete({
      where: { feesId },
    });

    await updateStudentStatus(fee.studentId);

    return NextResponse.json({ message: "Fee deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: "Fee not found" }, { status: 404 });
      }
    }
    console.error("Error deleting fee:", error);
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
        const feeMonth = new Date(fee.month + '-01'); 
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


