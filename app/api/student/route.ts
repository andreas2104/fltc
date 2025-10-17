import { PrismaClient, Prisma, StudentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Récupère tous les étudiants
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        fees: {
          include: {
            pay: true
          }
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
            data: { status: updatedStatus }
          });
        }

        return {
          ...student,
          status: updatedStatus
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
    const { name, firstName, contact, identity } = await request.json();
    if (!name || !firstName || !contact || !identity ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newStudent = await prisma.student.create({
      data: {
        name,
        firstName,
        contact,
        identity,
        status: StudentStatus.PENDING
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
        if (error.code === 'P2002') {
          return NextResponse.json({ error: "A student with this contact or identity already exists" }, { status: 409 });
        }
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// Fonction pour calculer le statut de l'étudiant
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
      
      // Vérifier si c'est en retard (logique simplifiée - à adapter)
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