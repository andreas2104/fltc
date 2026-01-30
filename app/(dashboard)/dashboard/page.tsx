'use client';

import React, { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    overdueStudents: 0,
    promotionStats: [] as { name: string; studentCount: number; totalFee: number }[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Failed to load dashboard stats');
        const data = await res.json();
        setStats(data);
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
        Dashboard Overview
      </h1>
      <p className="text-xl text-gray-700 dark:text-gray-300">
        Welcome back! Here is what's happening today.
      </p>

      {loading ? (
        <div className="text-center text-lg text-gray-600 dark:text-gray-400">Loading stats...</div>
      ) : error ? (
        <div className="text-center text-lg text-red-500">{error}</div>
      ) : (
        <div className="space-y-8">
            {/* Main Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-blue-500 transition-transform transform hover:scale-105">
                <h3 className="text-lg font-semibold mb-1 text-gray-500 dark:text-gray-400">Total Students</h3>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{stats.totalStudents}</p>
                <p className="text-sm text-blue-500 mt-2">Active learners</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-green-500 transition-transform transform hover:scale-105">
                <h3 className="text-lg font-semibold mb-1 text-gray-500 dark:text-gray-400">Total Revenue</h3>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{stats.totalRevenue.toLocaleString()} Ar</p>
                <p className="text-sm text-green-500 mt-2">All time collection</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-red-500 transition-transform transform hover:scale-105">
                <h3 className="text-lg font-semibold mb-1 text-gray-500 dark:text-gray-400">Overdue Students</h3>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{stats.overdueStudents}</p>
                <p className="text-sm text-red-500 mt-2">Need attention</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-purple-500 transition-transform transform hover:scale-105">
                <h3 className="text-lg font-semibold mb-1 text-gray-500 dark:text-gray-400">Active Promotions</h3>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{stats.promotionStats.length}</p>
                <p className="text-sm text-purple-500 mt-2">Running batches</p>
            </div>
            </div>

            {/* Students per Promotion Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Students per Promotion</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.promotionStats.map((promo) => (
                        <div key={promo.name} className="flex flex-col bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-lg font-medium text-gray-800 dark:text-gray-200">{promo.name}</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                    {promo.studentCount} Students
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600 mt-2">
                                <div 
                                    className="bg-blue-600 h-2.5 rounded-full" 
                                    style={{ width: `${stats.totalStudents > 0 ? (promo.studentCount / stats.totalStudents) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <div className="mt-2 text-right text-xs text-gray-500 dark:text-gray-400">
                                {stats.totalStudents > 0 ? Math.round((promo.studentCount / stats.totalStudents) * 100) : 0}% of total
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
