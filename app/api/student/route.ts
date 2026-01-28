import { PrismaClient, Prisma, StudentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// get all students
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        fees: {
          include: {
            pay: true,
          },
        },
        pay: true,
      },
    });

    // Calculer le statut mis à jour pour chaque étudiant
    const studentsWithUpdatedStatus = await Promise.all(
      students.map(async (student) => {
        const updatedStatus = await calculateStudentStatus(student.studentId);

        // Mettre à jour le statut si nécessaire
        if (updatedStatus !== student.status) {
          await prisma.student.update({
            where: { studentId: student.studentId },
            data: { status: updatedStatus },
          });
        }

        return {
          ...student,
          status: updatedStatus,
        };
      })
    );

    return NextResponse.json(studentsWithUpdatedStatus, { status: 200 });
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
    const contact = formData.get("contact") as string;
    const promotion = formData.get("promotion") as string;
    const imageFile = formData.get("identity") as File | null;
    
    // Validations de base
    if (!name || !firstName || !contact) {
      return NextResponse.json(
        { error: "Missing required fields (name, firstName, contact)" },
        { status: 400 }
      );
    }

    let identityPath: string | null = null;
    
    // Handle image upload if present
    if (imageFile && imageFile.size > 0) {
      // Import dynamically to avoid issues if saved in a different order, 
      // but here we know we have the helper. 
      // Note: In Next.js App Router, we can import from @/lib/...
      const { saveFile } = await import("@/lib/file-upload");
      identityPath = await saveFile(imageFile);
    }

    const newStudent = await prisma.student.create({
      data: {
        name,
        firstName,
        contact,
        promotion: promotion || "Unknown",
        identity: identityPath, // Save the path or null
        status: StudentStatus.PENDING,
      },
      include: {
        fees: true,
        pay: true,
      },
    });
    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A student with this contact already exists" },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// Fonction pour calculer le statut de l'étudiant
async function calculateStudentStatus(
  studentId: number
): Promise<StudentStatus> {
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: {
      fees: {
        include: {
          pay: true,
        },
      },
    },
  });

  if (!student) return StudentStatus.PENDING;

  let hasOverdue = false;
  let allFeesPaid = true;

  for (const fee of student.fees) {
    const totalPaid = fee.pay.reduce((sum, payment) => sum + payment.amount, 0);

    if (totalPaid < fee.price) {
      allFeesPaid = false;

      // Vérifier si c'est en retard (logique simplifiée - à adapter)
      if (fee.feeType === "ECOLAGE_MENSUEL" && fee.month) {
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
