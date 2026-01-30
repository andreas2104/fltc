
import prisma from "@/app/component/lib/prisma";
import { NextResponse } from "next/server";
import { checkAndUpdateStatus } from "@/lib/payment";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: {
        date: 'desc'
      },
      include: {
        student: true
      }
    });
    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, month, studentId } = body;

    if (!amount || !month || !studentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        amount: Number(amount),
        month,
        studentId: Number(studentId),
      },
    });

    // Automatically update student status if paid in full
    await checkAndUpdateStatus(Number(studentId));

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
