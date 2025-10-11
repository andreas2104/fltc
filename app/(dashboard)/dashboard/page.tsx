'use client';

import React, { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [studentCount, setStudentCount] = useState(0);
  const [feesCount, setFeesCount] = useState(0);
  const [payCount, setPayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, feesRes, payRes] = await Promise.all([
          fetch('/api/student'),
          fetch('/api/fees'),
          fetch('/api/pay'),
        ]);

        if (!studentsRes.ok || !feesRes.ok || !payRes.ok) {
          throw new Error('Échec du chargement des données du tableau de bord.');
        }

        const studentsData = await studentsRes.json();
        const feesData = await feesRes.json();
        const payData = await payRes.json();

        setStudentCount(studentsData.length);
        setFeesCount(feesData.length);
        setPayCount(payData.length);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const userName = 'Nom de l\'utilisateur'; // Remplacez par le nom de l'utilisateur de l'authentification

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Welcome on dashboard !
      </h1>
      <p className="text-xl text-gray-700 dark:text-gray-300">
        Hello, {userName}. You can  navigate with the left sidebar.
      </p>

      {loading ? (
        <div className="text-center text-lg text-gray-600 dark:text-gray-400">Loading data...</div>
      ) : error ? (
        <div className="text-center text-lg text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
            <h3 className="text-2xl font-semibold mb-2 text-blue-600">Total students</h3>
            <p className="text-4xl font-bold">{studentCount}</p>
            <p className="text-sm text-gray-500">Frequency update</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
            <h3 className="text-2xl font-semibold mb-2 text-green-600">Paiements</h3>
            <p className="text-4xl font-bold">{payCount}</p>
            <p className="text-sm text-gray-500">Total  paiements</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
            <h3 className="text-2xl font-semibold mb-2 text-red-600">Fees</h3>
            <p className="text-4xl font-bold">{feesCount}</p>
            <p className="text-sm text-gray-500">Total of fees</p>
          </div>
        </div>
      )}
    </div>
  );
}
