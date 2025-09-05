'use client'
import { ReactNode } from "react";

interface AuthLayoutPropos {
  children: ReactNode;
}

export default function AuthLayout({ children }:AuthLayoutPropos) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      {children}
    </div>
  );
}
