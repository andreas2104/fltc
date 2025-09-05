'use client';

import React, { useState, useEffect } from 'react';

export default function FeesPage() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFeesModalOpen, setIsAddFeesModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);
  const [newFees, setNewFees] = useState({ price: '', studentId: '' });

  const fetchData = async () => {
    try {
      const [feesRes, studentsRes] = await Promise.all([
        fetch('/api/fees'),
        fetch('/api/student'),
      ]);

      if (!feesRes.ok || !studentsRes.ok) {
        throw new Error('Échec du chargement des données.');
      }

      const feesData = await feesRes.json();
      const studentsData = await studentsRes.json();

      setFees(feesData);
      setStudents(studentsData);
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
    setNewFees(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFees = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newFees,
          price: Number(newFees.price),
          studentId: Number(newFees.studentId)
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout des frais.');
      }

      await fetchData();
      setIsAddFeesModalOpen(false);
      setNewFees({ price: '', studentId: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteFees = (feesId) => {
    setActionToDelete(() => async () => {
      try {
        const res = await fetch(`/api/fees/${feesId}`, { method: 'DELETE' });
        if (!res.ok) {
          throw new Error('Échec de la suppression des frais.');
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
        Chargement de la liste des frais...
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
          Gestion des frais
        </h1>
        <button
          onClick={() => setIsAddFeesModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md transition-transform transform hover:scale-105"
        >
          Ajouter des frais
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
                Étudiant
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => (
              <tr key={fee.feesId} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {fee.feesId}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {fee.price}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {getStudentName(fee.studentId)}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-right">
                  <button
                    onClick={() => handleDeleteFees(fee.feesId)}
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

      {/* Modal pour ajouter des frais */}
      {isAddFeesModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Ajouter des frais</h2>
            <form onSubmit={handleAddFees} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Montant</label>
                <input
                  type="number"
                  name="price"
                  value={newFees.price}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Étudiant</label>
                <select
                  name="studentId"
                  value={newFees.studentId}
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
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddFeesModalOpen(false)}
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
