'use client';

import Link from 'next/link';
import { SearchProvider, useSearch } from '../context/searchContext';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import Image from 'next/image';

const Header = () => {
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Recherche globale:', searchQuery);
    }
  };

  const handleClearSearch = () => {
    clearSearch();
  };

  if (!mounted) return null;

  return (
    <header className='bg-white dark:bg-gray-800 shadow p-8 flex justify-between items-center fixed top-0 left-0 right-0 z-50 h-16'>
      <>
        <div className='flex items-center gap-50 flex-1' >
          <div className='flex flex-col items-center justify-center min-w-max'>
          <Image src={'/logoF.png'}
          alt='logo'
          width={80}
          height={50}
          className='mb-0.5 '
          />
          {/* <h1 className='text-xs font-bold min-w-max leading-none'>FLTC MADAGASCAR</h1> */}

          </div>
          <form onSubmit={handleSearch} className='relative flex-1 max-w-2xl'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Rechercher dans toutes les sections...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2 pl-10 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
              <Search 
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' 
                size={20} 
              />
              {searchQuery && (
                <button
                  type='button'
                  onClick={handleClearSearch}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </form>
        </div>
      </>
    </header>
  );
};

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 p-4 shadow-md fixed left-0 top-16 bottom-0 z-40 overflow-y-auto">
      <nav className="space-y-4">
        <ul className="space-y-2">
          {[
            { href: '/dashboard', label: 'Home' },
            { href: '/students', label: 'Students' },
            { href: '/payments', label: 'Payments' },
            { href: '/promotions', label: 'Promotions' },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="font-medium">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div>

        {/* <Image src={'/logoF.png'}
        alt='logo'
        width={200}
        height={100} */}
        {/* /> */}
        <div className='border border-blue-300 shadow rounded-md p-4 max-w-sm w-full mx-auto '>
          <div className='animate-pulse'>
         <Image src={'/logoF.png'}
        alt='logo'
        width={200}
        height={100}
         /> 
        <h1 className='font-medium '>Foreign Language</h1>
        <h1 className='font-medium'>Training Center .....</h1>
          </div>
        </div>
        </div>
        </nav>
    </aside>
  );
};

const Footer = () => {
  return (
    <footer className="mt-8 py-4 text-center text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700">
      <p>Copyright © 2026 Andréas</p>
    </footer>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Header />
        <Sidebar />
        <main className="ml-64 mt-16 p-6 min-h-screen flex flex-col">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </SearchProvider>
  );
}