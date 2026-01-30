
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
    
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: amount ? Number(amount) : undefined,
        month: month || undefined,
        // Usually we don't change studentId for a payment, but if needed:
        // studentId: studentId ? Number(studentId) : undefined 
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
