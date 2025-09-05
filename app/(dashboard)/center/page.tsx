'use client';

import React, { useState, useEffect } from 'react';

export default function CenterPage() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddCenterModalOpen, setIsAddCenterModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);
  const [newCenter, setNewCenter] = useState({ city: '' });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/center');
      if (!res.ok) {
        throw new Error('Échec du chargement des centres.');
      }
      const data = await res.json();
      setCenters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setNewCenter({ city: e.target.value });
  };

  const handleAddCenter = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCenter),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du centre.');
      }

      await fetchData();
      setIsAddCenterModalOpen(false);
      setNewCenter({ city: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCenter = (centerId) => {
    setActionToDelete(() => async () => {
      try {
        const res = await fetch(`/api/center/${centerId}`, { method: 'DELETE' });
        if (!res.ok) {
          throw new Error('Échec de la suppression du centre.');
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
        Chargement de la liste des centres...
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
          Gestion des centres
        </h1>
        <button
          onClick={() => setIsAddCenterModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md transition-transform transform hover:scale-105"
        >
          Ajouter un centre
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
                Ville
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {centers.map((center) => (
              <tr key={center.centerId} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {center.centerId}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {center.city}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-right">
                  <button
                    onClick={() => handleDeleteCenter(center.centerId)}
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

      {/* Modal pour ajouter un centre */}
      {isAddCenterModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Ajouter un nouveau centre</h2>
            <form onSubmit={handleAddCenter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Ville</label>
                <input
                  type="text"
                  name="city"
                  value={newCenter.city}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCenterModalOpen(false)}
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
