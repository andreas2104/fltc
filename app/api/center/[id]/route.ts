import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request, {params}: {params: {centerId: string}}){
  try {
    const {centerId} = params;
    if (isNaN(Number(centerId))) {
      return NextResponse.json({error: "Invalid id format"}, {status: 400});
    }
    const center = await prisma.center.findUnique({
      where: {centerId: Number(centerId)},
    });
    if(!center) {
      return NextResponse.json({error: 'center not found'}, {status: 404});
    }
    return NextResponse.json(center, {status: 200});
  } catch (error) {
    console.error('error getid', error)
    return NextResponse.json({error: "error"}, {status:500})
  }
}

export async function DELETE(request:Request,{params}: {params: {centerId: string}}){
  try {
    const centerId = Number(params.centerId);
    if(isNaN(centerId)) {
      return NextResponse.json({ error: "invalid Id"}, {status: 400});
    }
    await prisma.center.delete({where: {centerId: centerId}});
    return NextResponse.json({message: "center Deleted"});
  }
    catch(error) {
      if(error instanceof Error)
      return NextResponse.json({ error: 'center not found'});
    }
}

export async function PUT(request: Request, {params}: {params: {centerId: string}}) {
  const {centerId} = params;
  const {city} = await request.json();
  if(isNaN(Number(centerId))) {
    return NextResponse.json({error:'invalid centerId'},{status: 400});
  }
  try {
    const uc = await prisma.center.update({
      where: {centerId: Number(centerId)},
      data: {city}
    });
    return NextResponse.json(uc, {status: 200})
  } catch(error) {
    console.error('error update', error);
    return NextResponse.json({ error: 'updated center  failed'}, {status: 500})
  }
}