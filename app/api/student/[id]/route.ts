
// app/api/student/[id]/route.ts
import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { checkAndUpdateStatus } from "@/lib/payment";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

    // Ensure status is up to date before returning
    await checkAndUpdateStatus(studentId);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        promotion: true,
        payments: {
          orderBy: { date: 'desc' }
        }
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
    const promotionIdEntry = formData.get("promotionId");
    const promotionId = promotionIdEntry ? Number(promotionIdEntry.toString()) : undefined;
    const phone = formData.get("phone") as string;
    const imageFile = formData.get("image") as File | null;

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields (name)' }, { status: 400 });
    }

    let imagePath: string | undefined = undefined;
    
    // Handle image upload
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      
      // Generate unique filename
      const ext = path.extname(imageFile.name);
      const filename = `student_${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, filename);
      
      await writeFile(filePath, buffer);
      imagePath = `/uploads/${filename}`;
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        name,
        firstName: firstName || undefined,
        ...(promotionId && { promotionId }),
        ...(phone && { phone }),
        ...(imagePath && { image: imagePath }),
      },
      include: {
        promotion: true,
        payments: true,
      },
    });

    return NextResponse.json(updatedStudent, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
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

    // Cascade delete is handled by database if configured, or Prisma defaults.
    // In our schema schema.prisma, relations are implied. 
    // We should delete payments first preferably or rely on Cascade.
    // Let's rely on Prisma Cascade Delete from the @relation(onDelete: Cascade).
    // Wait, my schema didn't explicitly specify onDelete: Cascade for Payments/Promotions relations.
    // But Payments belong to Student.
    // Let's checking schema again...
    // model Payment { student Student @relation(...) }
    // It doesn't say onDelete: Cascade. So I should delete payments manually or update schema.
    // Updating schema is better but I just did a push.
    // I will delete payments manually here just in case.
    
    await prisma.payment.deleteMany({
      where: { studentId }
    });

    await prisma.student.delete({
      where: { id: studentId }
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