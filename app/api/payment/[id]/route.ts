
import prisma from "@/app/component/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { checkAndUpdateStatus } from "@/lib/payment";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paymentId = parseInt(id);

    if (isNaN(paymentId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const body = await request.json();
    const { amount, month, studentId } = body;

    // Validate if necessary. amount and month should be present.
    // Payment update logic
    
    // Check for overpayment
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            promotion: true,
            payments: true,
          }
        }
      }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const newAmountValue = amount !== undefined ? Number(amount) : existingPayment.amount;
    const currentTotalPaid = existingPayment.student.payments.reduce((acc, curr) => acc + curr.amount, 0);
    // Subtract the old amount and add the new one
    const adjustedTotal = currentTotalPaid - existingPayment.amount + newAmountValue;

    if (adjustedTotal > existingPayment.student.promotion.totalFee) {
       return NextResponse.json(
         { error: "you've attempt the amout more than promotion total fee" },
         { status: 400 }
       );
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: amount !== undefined ? Number(amount) : undefined,
        month: month || undefined,
      },
    });

    // Check status after update. 
    // We need the studentId. If it wasn't in body, fetch from payment
    let targetStudentId = studentId ? Number(studentId) : undefined;
    if (!targetStudentId) {
       const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
       if (existing) targetStudentId = existing.studentId;
    }

    if (targetStudentId) {
        await checkAndUpdateStatus(targetStudentId);
    }

    return NextResponse.json(updatedPayment, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    console.error("Error updating payment", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paymentId = parseInt(id);

    if (isNaN(paymentId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    const studentId = payment.studentId;

    await prisma.payment.delete({
      where: { id: paymentId },
    });

    // Update status after deletion
    await checkAndUpdateStatus(studentId);

    return NextResponse.json({ message: "Payment deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting payment", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
