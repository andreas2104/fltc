'use client';

import React, { useState, useEffect } from 'react';

type Payment = {
  payId: number;
  amount: number;
  month: string;
  studentId: number;
  feesId: number;
  student?: {
    name: string;
    firstName: string;
  };
  fee?: {
    feeType: string;
    price: number;
  };
};

type Student = {
  studentId: number;
  name: string;
  firstName: string;
  contact: string;
  identity: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
};

type Fee = {
  feesId: number;
  price: number;
  feeType: 'DROITS_ANNUELS' | 'ECOLAGE_MENSUEL';
  month?: string;
  studentId: number;
  student?: {
    name: string;
    firstName: string;
  };
};

export default function PayPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPayModalOpen, setIsAddPayModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<(() => Promise<void>) | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [newPay, setNewPay] = useState({ 
    amount: '', 
    month: '', 
    studentId: '', 
    feesId: '' 
  });

  const fetchData = async () => {
    try {
      setError(null);
      const [paymentsRes, studentsRes, feesRes] = await Promise.all([
        fetch('/api/pay'),
        fetch('/api/student'), 
        fetch('/api/fees'),
      ]);

      if (!paymentsRes.ok) {
        throw new Error('Échec du chargement des paiements.');
      }

      if (!studentsRes.ok) {
        throw new Error('Échec du chargement des étudiants.');
      }

      if (!feesRes.ok) {
        throw new Error('Échec du chargement des frais.');
      }

      const paymentsData = await paymentsRes.json();
      const studentsData = await studentsRes.json();
      const feesData = await feesRes.json();

      setPayments(paymentsData);
      setStudents(studentsData);
      setFees(feesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.studentId === studentId);
    return student ? `${student.firstName} ${student.name}` : 'Inconnu';
  };

  const getFeeTypeText = (feeType: string) => {
    switch (feeType) {
      case 'DROITS_ANNUELS': return 'Droits annuels';
      case 'ECOLAGE_MENSUEL': return 'Écolage mensuel';
      default: return feeType;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPay(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

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
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePay = (payId: number) => {
    setActionToDelete(() => async () => {
      try {
        // Note: Vous devez créer cette route DELETE dans votre API
        setError('La fonction de suppression n\'est pas encore implémentée. Veuillez créer la route DELETE /api/pay/[id]');
        
        // Si vous avez la route DELETE, décommentez ce code :
        /*
        const res = await fetch(`/api/pay/${payId}`, { method: 'DELETE' });
        if (!res.ok) {
          throw new Error('Échec de la suppression du paiement.');
        }
        await fetchData();
        */
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
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

  // Filtrer les frais par étudiant sélectionné
  const filteredFees = newPay.studentId 
    ? fees.filter(fee => fee.studentId === Number(newPay.studentId))
    : fees;

  // Calculer les statistiques
  const getPaymentStats = () => {
    const total = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const averageAmount = total > 0 ? totalAmount / total : 0;

    return { total, totalAmount, averageAmount };
  };

  const stats = getPaymentStats();

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
          Gestion des Paiements
        </h1>
        <button
          onClick={() => setIsAddPayModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors"
          disabled={submitting}
        >
          {submitting ? 'Ajout...' : 'Ajouter un paiement'}
        </button>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Total paiements</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{stats.totalAmount.toLocaleString()} Ar</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Montant total</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">{stats.averageAmount.toLocaleString()} Ar</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Moyenne par paiement</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 right-0 px-4 py-3"
          >
            ×
          </button>
        </div>
      )}

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
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Type de frais
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((pay) => {
              const relatedFee = fees.find(fee => fee.feesId === pay.feesId);
              return (
                <tr key={pay.payId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    {pay.payId}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium">
                    {pay.amount.toLocaleString()} Ar
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    {pay.month}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    {getStudentName(pay.studentId)}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    {relatedFee ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        relatedFee.feeType === 'DROITS_ANNUELS' 
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                      }`}>
                        {getFeeTypeText(relatedFee.feeType)}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-right">
                    <button
                      onClick={() => handleDeletePay(pay.payId)}
                      className="px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {payments.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Aucun paiement trouvé.
          </div>
        )}
      </div>

      {/* Modal pour ajouter un paiement */}
      {isAddPayModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Ajouter un paiement</h2>
              <button
                onClick={() => setIsAddPayModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddPay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Étudiant</label>
                <select
                  name="studentId"
                  value={newPay.studentId}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
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
                <label className="block text-sm font-medium mb-2">Frais associés</label>
                <select
                  name="feesId"
                  value={newPay.feesId}
                  onChange={handleInputChange}
                  required
                  disabled={submitting || !newPay.studentId}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                >
                  <option value="" disabled>
                    {newPay.studentId ? 'Sélectionner des frais' : 'Sélectionnez d\'abord un étudiant'}
                  </option>
                  {filteredFees.map(fee => (
                    <option key={fee.feesId} value={fee.feesId}>
                      {getFeeTypeText(fee.feeType)} - {fee.price.toLocaleString()} Ar
                      {fee.month && ` (${fee.month})`}
                    </option>
                  ))}
                </select>
                {!newPay.studentId && (
                  <p className="text-sm text-gray-500 mt-1">
                    Veuillez d'abord sélectionner un étudiant
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Montant (Ar)</label>
                <input
                  type="number"
                  name="amount"
                  value={newPay.amount}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mois (ex: janvier-2024)</label>
                <input
                  type="text"
                  name="month"
                  value={newPay.month}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="janvier-2024"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddPayModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {submitting ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmer la suppression</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
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