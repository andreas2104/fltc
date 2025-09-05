import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Récupère un paiement par son ID
export async function GET(request: Request, {params}: {params: {payId: string}}){
  try {
    const { payId } = params;
    const id = Number(payId);
    if (isNaN(id)) {
      return NextResponse.json({error: "Invalid ID format"}, {status:400});
    }
    const pay = await prisma.pay.findUnique({
      where: {payId: id},
      include: {
        student: true,
        fees: true,
      },
    });
    if(!pay) {
      return NextResponse.json({error: "Pay not found"}, {status: 404});
    }
    return NextResponse.json(pay, {status: 200});
  } catch (error) {
    console.error('Error fetching pay by ID:', error);
    return NextResponse.json({error: "Server Error"}, {status: 500});
  }
}

// Met à jour un paiement par son ID
export async function PUT(request: Request, {params}: {params: {payId: string}}) {
  try {
    const { payId } = params;
    const { amount, month, studentId, feesId } = await request.json();
    const id = Number(payId);
    if(isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format'}, {status: 400});
    }
    const up = await prisma.pay.update({
      where: {payId: id},
      data: {
        amount,
        month,
        student: {
          connect: { studentId: studentId },
        },
        fees: {
          connect: { feesId: feesId },
        },
      },
    });
    return NextResponse.json(up, {status:200});
  } catch(error) {
    console.error('Error updating pay:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Pay not found' }, { status: 404 });
    }
    return NextResponse.json({error: 'Server Error'}, { status: 500 });
  }
}

// Supprime un paiement par son ID
export async function DELETE(request:Request,{params}: {params: {payId: string}}){
  try {
    const payId = Number(params.payId);
    if(isNaN(payId)) {
      return NextResponse.json({ error: "Invalid ID format"}, {status: 400});
    }
    await prisma.pay.delete({where: {payId: payId}});
    return NextResponse.json({message: "Pay deleted successfully"}, {status: 200});
  } catch(error) {
    console.error('Error deleting pay:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Pay not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Server Error'}, {status: 500});
  }
}
