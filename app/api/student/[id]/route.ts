// app/api/student/[id]/route.ts
import { PrismaClient, Prisma, StudentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);
   
    if (isNaN(studentId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { studentId },
      include: {
        fees: {
          include: {
            pay: true
          }
        },
        pay: {
          include: {
            fees: true
          }
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const updatedStatus = await calculateStudentStatus(studentId);
    if (updatedStatus !== student.status) {
      await prisma.student.update({
        where: { studentId },
        data: { status: updatedStatus }
      });
    }

    const studentWithUpdatedStatus = {
      ...student,
      status: updatedStatus
    };

    return NextResponse.json(studentWithUpdatedStatus, { status: 200 });
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);
   
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const firstName = formData.get("firstName") as string;
    const contact = formData.get("contact") as string;
    const promotionEntry = formData.get("promotion");
    const promotion = promotionEntry ? promotionEntry.toString() : undefined;
    const imageFile = formData.get("identity") as File | null;

    if (!name || !firstName || !contact) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let identityPath: string | undefined = undefined;
    
    // Handle image upload if present
    if (imageFile && imageFile.size > 0) {
       const { saveFile } = await import("@/lib/file-upload");
       identityPath = await saveFile(imageFile);
    }

    const updatedStudent = await prisma.student.update({
      where: { studentId },
      data: {
        name,
        firstName,
        contact,
        ...(promotion && { promotion }),
        ...(identityPath !== undefined && { identity: identityPath }), // Only update if new image
      },
      include: {
        fees: {
          include: {
            pay: true
          }
        },
        pay: {
          include: {
            fees: true
          }
        },
      },
    });

    return NextResponse.json(updatedStudent, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Contact already exists' }, { status: 409 });
      }
    }
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    await prisma.student.delete({
      where: { studentId }
    });
   
    return NextResponse.json({ message: "Student deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

async function calculateStudentStatus(studentId: number): Promise<StudentStatus> {
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

  if (!student) return StudentStatus.PENDING;

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

  if (allFeesPaid) return StudentStatus.COMPLETED;
  if (hasOverdue) return StudentStatus.OVERDUE;
  return StudentStatus.PENDING;
}