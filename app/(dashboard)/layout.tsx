'use client';

import Link from 'next/link';

export default function DashboardLayout({ children }:{children: React.ReactNode}) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <aside className="w-64 bg-white dark:bg-gray-800 p-6 shadow-md transition-all duration-300">
        <nav className="space-y-4">
          <h2 className="text-xl font-bold">Table Bord</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="font-medium">Home</span>
              </Link>
            </li>
            <li>
              <Link href="/students" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="font-medium">Student</span>
              </Link>
            </li>
            <li>
              <Link href="/fees" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="font-medium">Fees</span>
              </Link>
            </li>
            <li>
              <Link href="/pay" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="font-medium">Payements</span>
              </Link>
            </li>
            <li>
              <Link href="/center" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="font-medium">Center</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
