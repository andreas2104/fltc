import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Récupère les frais par leur ID
export async function GET(request: Request, {params}: {params: {feesId: string}}){
  try {
    const { feesId } = params;
    const id = Number(feesId);
    if (isNaN(id)) {
      return NextResponse.json({error: "Invalid ID format"}, {status:400});
    }
    const fees = await prisma.fees.findUnique({
      where: {feesId: id},
      include: {
        student: true,
        pay: true,
      },
    });
    if(!fees) {
      return NextResponse.json({error: "Fees not found"}, {status: 404});
    }
    return NextResponse.json(fees, {status: 200});
  } catch (error) {
    console.error('Error fetching fees by ID:', error);
    return NextResponse.json({error: "Server Error"}, {status: 500});
  }
}

// Met à jour les frais par leur ID
export async function PUT(request: Request, {params}: {params: {feesId: string}}) {
  try {
    const { feesId } = params;
    const { price, studentId } = await request.json();
    const id = Number(feesId);
    if(isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format'}, {status: 400});
    }
    const uf = await prisma.fees.update({
      where: {feesId: id},
      data: {
        price,
        student: {
          connect: { studentId: studentId },
        },
      },
    });
    return NextResponse.json(uf, {status:200});
  } catch(error) {
    console.error('Error updating fees:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Fees not found' }, { status: 404 });
    }
    return NextResponse.json({error: 'Server Error'}, { status: 500 });
  }
}

// Supprime les frais par leur ID
export async function DELETE(request:Request,{params}: {params: {feesId: string}}){
  try {
    const feesId = Number(params.feesId);
    if(isNaN(feesId)) {
      return NextResponse.json({ error: "Invalid ID format"}, {status: 400});
    }
    await prisma.fees.delete({where: {feesId: feesId}});
    return NextResponse.json({message: "Fees deleted successfully"}, {status: 200});
  } catch(error) {
    console.error('Error deleting fees:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Fees not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Server Error'}, {status: 500});
  }
}
