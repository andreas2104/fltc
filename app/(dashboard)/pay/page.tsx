'use client';

import React, { useState, useEffect } from 'react';

export default function PayPage() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddPayModalOpen, setIsAddPayModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);
  const [newPay, setNewPay] = useState({ amount: '', month: '', studentId: '', feesId: '' });

  const fetchData = async () => {
    try {
      const [paymentsRes, studentsRes, feesRes] = await Promise.all([
        fetch('/api/pay'),
        fetch('/api/student'),
        fetch('/api/fees'),
      ]);

      if (!paymentsRes.ok || !studentsRes.ok || !feesRes.ok) {
        throw new Error('Échec du chargement des données.');
      }

      const paymentsData = await paymentsRes.json();
      const studentsData = await studentsRes.json();
      const feesData = await feesRes.json();

      setPayments(paymentsData);
      setStudents(studentsData);
      setFees(feesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStudentName = (studentId) => {
    const student = students.find(s => s.studentId === studentId);
    return student ? `${student.firstName} ${student.name}` : 'Inconnu';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPay(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPay = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPay,
          amount: Number(newPay.amount),
          studentId: Number(newPay.studentId),
          feesId: Number(newPay.feesId)
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du paiement.');
      }

      await fetchData();
      setIsAddPayModalOpen(false);
      setNewPay({ amount: '', month: '', studentId: '', feesId: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePay = (payId) => {
    setActionToDelete(() => async () => {
      try {
        const res = await fetch(`/api/pay/${payId}`, { method: 'DELETE' });
        if (!res.ok) {
          throw new Error('Échec de la suppression du paiement.');
        }
        await fetchData();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsConfirmModalOpen(false);
        setActionToDelete(null);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (actionToDelete) {
      actionToDelete();
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-lg text-gray-600 dark:text-gray-400">
        Chargement de la liste des paiements...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-lg text-red-500">
        Erreur : {error}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Gestion des paiements
        </h1>
        <button
          onClick={() => setIsAddPayModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md transition-transform transform hover:scale-105"
        >
          Ajouter un paiement
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                ID
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Mois
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Étudiant
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((pay) => (
              <tr key={pay.payId} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {pay.payId}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {pay.amount}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {pay.month}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {getStudentName(pay.studentId)}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-right">
                  <button
                    onClick={() => handleDeletePay(pay.payId)}
                    className="px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal pour ajouter un paiement */}
      {isAddPayModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Ajouter un paiement</h2>
            <form onSubmit={handleAddPay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Montant</label>
                <input
                  type="number"
                  name="amount"
                  value={newPay.amount}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Mois</label>
                <input
                  type="text"
                  name="month"
                  value={newPay.month}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Étudiant</label>
                <select
                  name="studentId"
                  value={newPay.studentId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="" disabled>Sélectionner un étudiant</option>
                  {students.map(student => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.firstName} {student.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Frais</label>
                <select
                  name="feesId"
                  value={newPay.feesId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="" disabled>Sélectionner des frais</option>
                  {fees.map(fee => (
                    <option key={fee.feesId} value={fee.feesId}>Frais ID: {fee.feesId} (pour {getStudentName(fee.studentId)})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddPayModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Confirmer la suppression</h2>
            <p className="mb-4">Êtes-vous sûr de vouloir supprimer cet élément ?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
