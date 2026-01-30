
import prisma from "@/app/component/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany();
    return NextResponse.json(promotions, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, totalFee } = body;

    if (!name || !totalFee) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newPromotion = await prisma.promotion.create({
      data: {
        name,
        totalFee: Number(totalFee),
      },
    });

    return NextResponse.json(newPromotion, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
