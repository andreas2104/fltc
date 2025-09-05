import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Récupère un étudiant par son ID
export async function GET(request: Request, { params }: { params: { studentId: string } }) {
  try {
    const { studentId } = params;
    const id = Number(studentId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { studentId: id },
      include: {
        center: true,
        fees: true,
        pay: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student, { status: 200 });
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// Met à jour un étudiant par son ID
export async function PUT(request: Request, { params }: { params: { studentId: string } }) {
  try {
    const { studentId } = params;
    const { name, firstName, contact, identity, centerId } = await request.json();
    const id = Number(studentId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const updatedStudent = await prisma.student.update({
      where: { studentId: id },
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

    return NextResponse.json(updatedStudent, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// Supprime un étudiant par son ID
export async function DELETE(request: Request, { params }: { params: { studentId: string } }) {
  try {
    const studentId = Number(params.studentId);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    await prisma.student.delete({ where: { studentId: studentId } });
    return NextResponse.json({ message: "Student deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
