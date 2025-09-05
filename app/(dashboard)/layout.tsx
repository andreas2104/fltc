'use client';

import Link from 'next/link';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <aside className="w-64 bg-white dark:bg-gray-800 p-6 shadow-md transition-all duration-300">
        <nav className="space-y-4">
          <h2 className="text-xl font-bold">Tableau de Bord</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="font-medium">Accueil</span>
              </Link>
            </li>
            <li>
              <Link href="/students" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="font-medium">Étudiants</span>
              </Link>
            </li>
            <li>
              <Link href="/fees" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="font-medium">Frais</span>
              </Link>
            </li>
            <li>
              <Link href="/pay" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="font-medium">Paiements</span>
              </Link>
            </li>
            <li>
              <Link href="/center" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="font-medium">Centre</span>
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
