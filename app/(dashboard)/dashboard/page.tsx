'use client';

import React, { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [studentCount, setStudentCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [payCount, setPayCount] = useState(0);
  const [promoCount, setPromoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, paymentsRes, promoRes] = await Promise.all([
          fetch('/api/student'),
          fetch('/api/payment'),
          fetch('/api/promotions'),
        ]);

        if (!studentsRes.ok || !paymentsRes.ok || !promoRes.ok) {
          throw new Error('Échec du chargement des données du tableau de bord.');
        }

        const studentsData = await studentsRes.json();
        const paymentsData = await paymentsRes.json();
        const promoData = await promoRes.json();

        setStudentCount(studentsData.length);
        
        // Calculate total revenue and payment count
        // Ensure p.amount is treated as a number
        const revenue = Array.isArray(paymentsData) ? paymentsData.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) : 0;
        setTotalRevenue(revenue);
        setPayCount(paymentsData.length);
        setPromoCount(promoData.length);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-1 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Welcome on dashboard !
      </h1>
      <p className="text-xl text-gray-700 dark:text-gray-300">
        You can navigate with the left sidebar.
      </p>

      {loading ? (
        <div className="text-center text-lg text-gray-600 dark:text-gray-400">Loading data...</div>
      ) : error ? (
        <div className="text-center text-lg text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
            <h3 className="text-2xl font-semibold mb-2 text-blue-600">Total students</h3>
            <p className="text-4xl font-bold">{studentCount}</p>
            <p className="text-sm text-gray-500">Frequency update</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
            <h3 className="text-2xl font-semibold mb-2 text-purple-600">Promotions</h3>
            <p className="text-4xl font-bold">{promoCount}</p>
            <p className="text-sm text-gray-500">Active classes</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
            <h3 className="text-2xl font-semibold mb-2 text-green-600">Transactions</h3>
            <p className="text-4xl font-bold">{payCount}</p>
            <p className="text-sm text-gray-500">Total payments made</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
            <h3 className="text-2xl font-semibold mb-2 text-red-600">Total Revenue</h3>
            <p className="text-4xl font-bold">{totalRevenue.toLocaleString()} Ar</p>
            <p className="text-sm text-gray-500">Total collected fees</p>
          </div>
        </div>
      )}
    </div>
  );
}
