import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Récupère tous les frais
export async function GET() {
  try {
    const data = await prisma.fees.findMany({
      include: {
        student: true,
        pay: true,
      },
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching fees:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// Crée de nouveaux frais
export async function POST(request: Request) {
  try {
    const { price, studentId } = await request.json(); 
    if (price === undefined || !studentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const newFees = await prisma.fees.create({
      data: {
        price,
        student: {
          connect: { studentId: studentId },
        },
      },
      include: {
        student: true,
      },
    });
    return NextResponse.json(newFees, { status: 201 });
  } catch (error) {
    console.error("Error creating fees:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
