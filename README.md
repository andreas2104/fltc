# FLTC - Student Management System

FLTC is a comprehensive Student Management System designed to handle student records, class promotions, and tuition payments. Built with [Next.js](https://nextjs.org), [Prisma](https://www.prisma.io/), and [Tailwind CSS](https://tailwindcss.com/).

## Features

- **Student Management**: Add, update, and track students.
- **Promotion/Class Management**: Organize students into promotions (classes) with associated fees.
- **Payment Tracking**: Record and monitor student payments per month/year.
- **Dashboard**: Visual overview of key metrics.
- **Authentication**: Secure login and role-based access (admin/user).

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm, pnpm, or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd FLTC
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your database connection string:
   ```env
   DATABASE_URL="file:./dev.db"
   ```
   *(Note: Adjust the URL if you are using a different database provider)*

4. **Database Setup:**
   Run Prisma migrations to set up your database schema:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Next.js App Router pages and API routes.
  - `(auth)`: Authentication related pages (login).
  - `(dashboard)`: Protected dashboard pages.
  - `api/`: Backend API endpoints.
- `prisma/`: Database schema and migrations.
- `lib/`: Utility functions and shared logic.
- `public/`: Static assets.

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Database**: SQLite (dev) / Compatible with Postgres/MySQL (prod)
- **ORM**: Prisma
- **Styling**: Tailwind CSS, Lucide React (Icons)

## Learn More

To learn more about the tools used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
