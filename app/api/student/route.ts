import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// get all students
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || "";
    const promotionId = searchParams.get("promotionId");

    const skip = (page - 1) * limit;

    const whereClause: Prisma.StudentWhereInput = {
      AND: [
        promotionId ? { promotionId: Number(promotionId) } : {},
        search ? {
          OR: [
            { name: { contains: search } }, // SQLite is case-insensitive for contains usually, or use mode: 'insensitive' if postgres/mysql
            { firstName: { contains: search } }
          ]
        } : {}
      ]
    };

    const [students, total, completed, pending, overdue] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        include: {
          promotion: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.student.count({ where: whereClause }),
      prisma.student.count({ where: { ...whereClause, status: "COMPLETED" } }),
      prisma.student.count({ where: { ...whereClause, status: "PENDING" } }),
      prisma.student.count({ where: { ...whereClause, status: "OVERDUE" } }),
    ]);

    return NextResponse.json({
      data: students,
      meta: {
        total,
        completed,
        pending,
        overdue,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }, { status: 200 });
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
