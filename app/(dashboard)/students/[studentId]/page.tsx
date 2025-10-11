'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function StudentDetailsPage() {
  const { studentId } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddFeesModalOpen, setIsAddFeesModalOpen] = useState(false);
  const [isAddPayModalOpen, setIsAddPayModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);
  
  const [newFees, setNewFees] = useState({ price: '', studentId: Number(studentId) });
  const [newPay, setNewPay] = useState({ amount: '', month: '', studentId: Number(studentId), feesId: '' });

  const fetchData = async () => {
    try {
      const [studentRes, feesRes, payRes, centersRes] = await Promise.all([
        fetch(`/api/student/${studentId}`),
        fetch(`/api/fees?studentId=${studentId}`),
        fetch(`/api/pay?studentId=${studentId}`),
        fetch('/api/center'),
      ]);

      if (!studentRes.ok || !feesRes.ok || !payRes.ok || !centersRes.ok) {
        throw new Error('Échec du chargement des données de l\'étudiant.');
      }

      const studentData = await studentRes.json();
      const feesData = await feesRes.json();
      const payData = await payRes.json();
      const centersData = await centersRes.json();

      setStudent(studentData);
      setFees(feesData);
      setPayments(payData);
      setCenters(centersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/student/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de l\'étudiant.');
      }

      await fetchData();
      setIsEditMode(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddFees = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newFees, price: Number(newFees.price) }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout des frais.');
      }

      await fetchData();
      setIsAddFeesModalOpen(false);
      setNewFees({ price: '', studentId: Number(studentId) });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddPay = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPay, amount: Number(newPay.amount), feesId: Number(newPay.feesId) }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du paiement.');
      }

      await fetchData();
      setIsAddPayModalOpen(false);
      setNewPay({ amount: '', month: '', studentId: Number(studentId), feesId: '' });
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
        Loading Student Information.
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-8 text-center text-lg text-red-500">
        Erreur : {error || 'Étudiant non trouvé.'}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Détails de {student.name} {student.firstName}
        </h1>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="px-6 py-3 bg-yellow-500 text-white rounded-xl shadow-md transition-transform transform hover:scale-105"
        >
          {isEditMode ? 'Annuler' : 'Modifier les informations'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">General Information</h2>
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={student.name}
                onChange={(e) => setStudent({ ...student, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                disabled={!isEditMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">LastName</label>
              <input
                type="text"
                name="firstName"
                value={student.firstName}
                onChange={(e) => setStudent({ ...student, firstName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                disabled={!isEditMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Contact</label>
              <input
                type="text"
                name="contact"
                value={student.contact}
                onChange={(e) => setStudent({ ...student, contact: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                disabled={!isEditMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Identity</label>
              <input
                type="text"
                name="identity"
                value={student.identity}
                onChange={(e) => setStudent({ ...student, identity: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                disabled={!isEditMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Center</label>
              <select
                name="centerId"
                value={student.centerId}
                onChange={(e) => setStudent({ ...student, centerId: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                disabled={!isEditMode}
              >
                {centers.map(center => (
                  <option key={center.centerId} value={center.centerId}>
                    {center.city}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {isEditMode && (
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section Frais */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Frais</h2>
            <button
              onClick={() => setIsAddFeesModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm"
            >
              Add fees
            </button>
          </div>
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Montant</th>
                <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.feesId} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm">{fee.price}</td>
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm text-right">
                    <button
                      onClick={() => handleDeleteFees(fee.feesId)}
                      className="px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section Paiements */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Payement</h2>
            <button
              onClick={() => setIsAddPayModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm"
            >
              Add payement
            </button>
          </div>
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Montant</th>
                <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Mois</th>
                <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Frais associés</th>
                <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.payId} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm">{pay.amount}</td>
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm">{pay.month}</td>
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm">{pay.feesId}</td>
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm text-right">
                    <button
                      onClick={() => handleDeletePay(pay.payId)}
                      className="px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal pour ajouter des frais */}
      {isAddFeesModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Add Fees</h2>
            <form onSubmit={handleAddFees} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Amount</label>
                <input
                  type="number"
                  name="price"
                  value={newFees.price}
                  onChange={(e) => setNewFees({ ...newFees, price: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddFeesModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour ajouter un paiement */}
      {isAddPayModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Add a payement</h2>
            <form onSubmit={handleAddPay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={newPay.amount}
                  onChange={(e) => setNewPay({ ...newPay, amount: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Mounth</label>
                <input
                  type="text"
                  name="month"
                  value={newPay.month}
                  onChange={(e) => setNewPay({ ...newPay, month: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Fees</label>
                <select
                  name="feesId"
                  value={newPay.feesId}
                  onChange={(e) => setNewPay({ ...newPay, feesId: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="" disabled>Select Fees</option>
                  {fees.map(fee => (
                    <option key={fee.feesId} value={fee.feesId}>{fee.feesId}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddPayModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add
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
            <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4">Are you sure to delete this element ?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
