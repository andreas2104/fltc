
import prisma from "@/app/component/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promotionId = parseInt(id);

    if (isNaN(promotionId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    return NextResponse.json(promotion, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promotionId = parseInt(id);

    if (isNaN(promotionId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const body = await request.json();
    const { name, totalFee } = body;

    if (!name || !totalFee) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedPromotion = await prisma.promotion.update({
      where: { id: promotionId },
      data: {
        name,
        totalFee: Number(totalFee),
      },
    });

    return NextResponse.json(updatedPromotion, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promotionId = parseInt(id);

    if (isNaN(promotionId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if dependent students exist?
    // The user didn't explicitly ask for cascade check, but it's good practice.
    // However, Prisma might throw error if foreign key constraint fails.
    // We'll proceed with standard delete.
    
    await prisma.promotion.delete({
      where: { id: promotionId },
    });

    return NextResponse.json({ message: "Promotion deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') { // Foreign key constraint failed
         return NextResponse.json({ error: "Cannot delete promotion with existing students." }, { status: 400 });
      }
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
