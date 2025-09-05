import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";


const prisma = new PrismaClient();

export async function GET() {
  const data = await prisma.center.findMany();
  return NextResponse.json(data);
  
}

export async function POST(request: Request) {
  try {
    const {city} = await request.json(); 
    const newCenter = await prisma.center.create( {
      data: {city},
    });
    return NextResponse.json(newCenter, {status: 201});
  } catch (error) {
    if(error instanceof Error)
      return NextResponse.json({ error: "Server Error"}, {status:500});
  }
}