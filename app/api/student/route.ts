import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// get all students
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        promotion: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' }
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
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const firstName = formData.get("firstName") as string;
    const promotionId = formData.get("promotionId") as string;
    const phone = formData.get("phone") as string;
    const imageFile = formData.get("image") as File | null;
    
    // Validations de base
    if (!name || !promotionId) {
      return NextResponse.json(
        { error: "Missing required fields (name, promotionId)" },
        { status: 400 }
      );
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

    const newStudent = await prisma.student.create({
      data: {
        name,
        firstName: firstName || undefined,
        promotionId: Number(promotionId),
        phone: phone || undefined,
        image: imagePath,
        status: "PENDING",
      },
      include: {
        promotion: true,
      },
    });
    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A student already exists with these details" },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

