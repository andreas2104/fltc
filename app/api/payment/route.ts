
import prisma from "@/app/component/lib/prisma";
import { NextResponse } from "next/server";
import { checkAndUpdateStatus } from "@/lib/payment";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const whereClause: Prisma.PaymentWhereInput = search
      ? {
          OR: [
            {
              month: {
                contains: search,
                // mode: 'insensitive' // SQLite default is case insensitive for LIKE usually, but Prisma mimics it
              },
            },
            {
              student: {
                OR: [
                  { name: { contains: search } },
                  { firstName: { contains: search } },
                  { 
                    promotion: {
                        name: { contains: search }
                    }
                  }
                ],
              },
            },
             // Prisma doesn't support 'contains' on DateTime directly like string.
             // We can rely on client side or exact match, or use raw query if needed.
             // For simplicity, we'll skip complex date string parsing in global search unless strict format provided.
          ],
        }
      : {};

    const [payments, total, totalRevenue] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        orderBy: {
          date: 'desc'
        },
        include: {
          student: {
             include: {
                 promotion: true
             }
          }
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: whereClause }),
      prisma.payment.aggregate({
        where: whereClause,
        _sum: { amount: true }
      }),
    ]);

    return NextResponse.json({
      data: payments,
      meta: {
        total,
        totalRevenue: totalRevenue._sum.amount || 0,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, month, studentId } = body;

    if (!amount || !month || !studentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const studentData = await prisma.student.findUnique({
      where: { id: Number(studentId) },
      include: {
        promotion: true,
        payments: true,
      },
    });

    if (!studentData) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const totalPaid = studentData.payments.reduce((acc, curr) => acc + curr.amount, 0);
    const newTotal = totalPaid + Number(amount);

    if (newTotal > studentData.promotion.totalFee) {
        return NextResponse.json(
            { error: "you've attempt the amout more than promotion total fee" },
            { status: 400 }
        );
    }

    const payment = await prisma.payment.create({
      data: {
        amount: Number(amount),
        month,
        studentId: Number(studentId),
      },
    });

    // Automatically update student status if paid in full
    await checkAndUpdateStatus(Number(studentId));

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
