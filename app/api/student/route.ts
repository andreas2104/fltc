import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Récupère tous les étudiants
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        center: true,
        fees: true,
        pay: true,
      },
    });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// Crée un nouvel étudiant
export async function POST(request: Request) {
  try {
    const { name, firstName, contact, identity, centerId } = await request.json();
    if (!name || !firstName || !contact || !identity || !centerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newStudent = await prisma.student.create({
      data: {
        name,
        firstName,
        contact,
        identity,
        center: {
          connect: { centerId: centerId }
        }
      },
      include: {
        center: true,
      },
    });
    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { // Unique constraint violation
          return NextResponse.json({ error: "A student with this contact or identity already exists" }, { status: 409 });
        }
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
