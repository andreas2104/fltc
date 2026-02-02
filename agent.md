# Agent Guide for FLTC Project

This document provides context and guidelines for AI agents working on the FLTC repository.

## Project Overview
FLTC is a Student Management System built with Next.js. It manages students, their promotions (classes/groups), and payment tracking.

## Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Package Manager**: npm/pnpm/yarn (Check lockfile, currently `pnpm-lock.yaml` exists, so use `pnpm` if available, otherwise `npm` is fine but be consistent)

## Core Data Models (Prisma)
- **User**: System administrators/users with authentication.
- **Student**: The primary entity, belongs to a Promotion.
- **Promotion**: Represents a class or group of students with a specific total fee.
- **Payment**: Records of payments made by students.

## Common Workflows

### Database Updates
When modifying `prisma/schema.prisma`:
1. Edit the schema file.
2. Run `npx prisma migrate dev --name <descriptive_name>` to create and apply options.
3. **DO NOT** manually edit `migrations` folder contents unless necessary.

### Component Styling
- Use Tailwind CSS utility classes.
- Avoid inline styles where possible.
- Ensure dark mode compatibility (`dark:` modifiers) if the app supports it (it seems to, based on `app/page.tsx` having `dark:` classes).

### API Routes
- Located in `app/api/`.
- Use Next.js App Router route handlers (`GET`, `POST`, `PUT`, `DELETE`).
- Ensure proper error handling and status codes.

## Code Style
- Use TypeScript for all new code.
- Prefer functional components.
- Use `lucide-react` for icons.

now on the student page create a fonction while on click to the student we can see the student details and payments with identity and contact information

now add a fonction to delete and update promotions like student 
now add a fonction delete and update also on payements and  keeps list and total students only on payementes remove total paiemet from payements page only research date or student name or promotion name to find student with payments and add next page while list atempt 20 student keep payements can show on the page
now add a fonction to delete and update payments and keep list and total students only on payementes remove total paiemet from payements page only research date or student name or promotion name to find student with payments and add next page while list atempt 20 student keep payements can show on the page


now one student can't do payement more than promotion total fee and update more the payement promotion verify api paiement and payement page add notification you've attempt the amout more than promotion total fee

great now add notification on the user page  transform the error on page add payment notification to a message for theeeeee user so let return on the payment while the user try to add payment more than promotion total fee and add fees rest if the user try to add payment more than promotion total fee and update more the payement promotion verify api paiement and payement page add notification you've attempt the amout more than promotion total fee
so for the statut does same check cause evene we change the payment  above the status is completed 


for your final step lest build this app to production and deploy it from electron js cause 