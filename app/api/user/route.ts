import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Récupère tous les utilisateurs
export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// Crée un nouvel utilisateur (enregistrement)
export async function POST(request: Request) {
  try {
    const { name, firstName, email, contact, password, role } = await request.json();
    if (!name || !firstName || !email || !contact || !password || role === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        firstName,
        email,
        contact,
        password: hashedPassword,
        role,
      },
    });

    // Éviter de renvoyer le mot de passe haché au client
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Violation de la contrainte unique
        return NextResponse.json({ error: "A user with this email or contact already exists" }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
