
import prisma from "@/app/component/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [
      totalStudents,
      totalRevenue,
      overdueStudents,
      promotions
    ] = await Promise.all([
      prisma.student.count(),
      prisma.payment.aggregate({
        _sum: { amount: true }
      }),
      prisma.student.count({
        where: { status: "OVERDUE" }
      }),
      prisma.promotion.findMany({
        include: {
          _count: {
            select: { students: true }
          }
        }
      })
    ]);

    const promotionStats = promotions.map(p => ({
      name: p.name,
      studentCount: p._count.students,
      totalFee: p.totalFee
    }));

    // Calculate total overdue amount (approximate based on overdue students * promotion fee)
    // This is a bit complex without detailed payment tracking per student vs due date,
    // so we will just return the count of overdue students as requested.
    // If strict amount needed, we'd need to fetch overdue students and sum their (promotion.totalFee - paidAmount).
    // For now, adhering to plan: Overdue Count.

    return NextResponse.json({
      totalStudents,
      totalRevenue: totalRevenue._sum.amount || 0,
      overdueStudents,
      promotionStats
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
