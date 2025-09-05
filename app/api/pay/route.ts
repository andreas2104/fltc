import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Récupère tous les paiements
export async function GET() {
  try {
    const data = await prisma.pay.findMany({
      include: {
        student: true,
        fees: true,
      },
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// Crée un nouveau paiement
export async function POST(request: Request) {
  try {
    const { amount, month, studentId, feesId } = await request.json();
    if (amount === undefined || !month || !studentId || !feesId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const newPayment = await prisma.pay.create({
      data: {
        amount,
        month,
        student: {
          connect: { studentId: studentId },
        },
        fees: {
          connect: { feesId: feesId },
        },
      },
      include: {
        student: true,
        fees: true,
      },
    });
    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: "Related student or fees not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
