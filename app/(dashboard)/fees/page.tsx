'use client';

import React, { useState, useEffect, useMemo } from 'react';
// 1. Importer useSearch depuis le contexte (assurez-vous que le chemin est correct)
import { useSearch } from '../../context/searchContext'; 

// --- Types ---
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
  pay: Array<{
    payId: number;
    amount: number;
    month: string;
  }>;
};

type Student = {
  studentId: number;
  name: string;
  firstName: string;
  contact: string;
  identity: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
};

type FeesResponse = {
  studentFees: Fee[];
  totals: {
    annuel: number;
    mensuel: number;
    totalAttendu: number;
    totalPaye: number;
    resteAPayer: number;
  };
};

export default function FeesPage() {
  // 2. Utiliser le contexte de recherche globale
  const { searchQuery } = useSearch(); 

  const [allFees, setAllFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentFees, setStudentFees] = useState<FeesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFeesModalOpen, setIsAddFeesModalOpen] = useState(false);
  const [isEditFeesModalOpen, setIsEditFeesModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<(() => Promise<void>) | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  
  const [newFees, setNewFees] = useState({ 
    price: '', 
    studentId: '',
    feeType: 'DROITS_ANNUELS' as 'DROITS_ANNUELS' | 'ECOLAGE_MENSUEL',
    month: ''
  });
  const [editFees, setEditFees] = useState<Partial<Fee> | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [feesRes, studentsRes] = await Promise.all([
        fetch('/api/fees'),
        fetch('/api/student'), 
      ]);

      if (!feesRes.ok) {
        throw new Error('Failed to load fees.');
      }

      if (!studentsRes.ok) {
        throw new Error('Failed to load students.');
      }

      const feesData = await feesRes.json();
      const studentsData = await studentsRes.json();

      setAllFees(feesData);
      setStudents(studentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentFees = async (studentId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/fees?studentId=${studentId}`);
      if (!res.ok) {
        throw new Error('Failed to load student fees.');
      }
      const data = await res.json() as FeesResponse;
      setStudentFees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStudentFees(null); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.name}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.contact.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.identity.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch(''); 
    fetchStudentFees(student.studentId);
  };

  const handleClearSelection = () => {
    setSelectedStudent(null);
    setStudentFees(null);
  };

  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.studentId === studentId);
    return student ? `${student.firstName} ${student.name}` : 'Unknown';
  };

  const getFeeTypeText = (feeType: string) => {
    switch (feeType) {
      case 'DROITS_ANNUELS': return 'Annual Rights';
      case 'ECOLAGE_MENSUEL': return 'Monthly Tuition';
      default: return feeType;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewFees(prev => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'feeType' && value === 'DROITS_ANNUELS' ? { month: '' } : {})
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFees(prev => ({ 
      ...prev!,
      [name]: name === 'price' ? Number(value) : value,
      ...(name === 'feeType' && value === 'DROITS_ANNUELS' ? { month: undefined } : {})
    }));
  };

  const handleAddFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

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
        throw new Error(errorData.error || 'Error adding fee.');
      }

      await fetchData(); 
      if (selectedStudent && Number(newFees.studentId) === selectedStudent.studentId) {
        fetchStudentFees(selectedStudent.studentId); 
      }
      setIsAddFeesModalOpen(false);
      setNewFees({ price: '', studentId: '', feeType: 'DROITS_ANNUELS', month: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFees) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/fees/${editFees.feesId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFees),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error updating fee.');
      }

      await fetchData(); 
      if (selectedStudent && editFees.studentId === selectedStudent.studentId) {
        fetchStudentFees(selectedStudent.studentId); 
      }
      setIsEditFeesModalOpen(false);
      setEditFees(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (fee: Fee) => {
    setEditFees({
      feesId: fee.feesId,
      price: fee.price,
      feeType: fee.feeType,
      month: fee.month,
      studentId: fee.studentId,
    });
    setIsEditFeesModalOpen(true);
  };

  const handleDeleteFees = (feesId: number) => {
    setActionToDelete(() => async () => {
      try {
        const res = await fetch(`/api/fees/${feesId}`, { method: 'DELETE' });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to delete fee.');
        }
        await fetchData();  
        if (selectedStudent) {
          fetchStudentFees(selectedStudent.studentId);  
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
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
  
  // 3. Filtrage combiné (Recherche Globale OU Sélection Étudiant)
  const feesToDisplay = useMemo(() => {
    // Si un étudiant est sélectionné, on affiche uniquement ses frais
    if (selectedStudent && studentFees) {
      return studentFees.studentFees;
    }

    // Si pas d'étudiant sélectionné ET qu'il y a une requête de recherche globale
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return allFees.filter(fee => {
        const student = students.find(s => s.studentId === fee.studentId);
        const studentFullName = student ? `${student.firstName} ${student.name}`.toLowerCase() : '';
        
        return (
          studentFullName.includes(query) ||
          fee.feesId.toString().includes(query) ||
          fee.price.toString().includes(query) ||
          fee.feeType.toLowerCase().includes(query) ||
          (fee.month && fee.month.toLowerCase().includes(query))
        );
      });
    }

    // Par défaut, afficher tous les frais (quand pas de sélection et pas de recherche)
    return allFees;
  }, [allFees, selectedStudent, studentFees, searchQuery, students]);


  const getFeesStats = () => {
    // Les statistiques initiales (dans les cartes) sont calculées sur TOUS les frais (allFees)
    // Sauf si un étudiant est sélectionné, auquel cas on affiche les stats spécifiques à l'étudiant.
    const feesToUse = selectedStudent ? studentFees?.studentFees || [] : allFees;
    const total = feesToUse.length;
    const totalAmount = feesToUse.reduce((sum, fee) => sum + fee.price, 0);
    const monthlyFees = feesToUse.filter(fee => fee.feeType === 'ECOLAGE_MENSUEL').length;
    const annualFees = feesToUse.filter(fee => fee.feeType === 'DROITS_ANNUELS').length;

    return { total, totalAmount, monthlyFees, annualFees };
  };

  const stats = getFeesStats();

  if (loading && !selectedStudent) {
    return (
      <div className="p-8 text-center text-lg text-gray-600 dark:text-gray-400">
        Loading fees list...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-lg text-red-500">
        Error: {error}
      </div>
    );
  }

  // Application de la mise en page pour le défilement
  return (
    <div className="h-full space-y-8 flex flex-col"> {/* Utilisation de flex-col et h-full */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          {selectedStudent ? `Fees for ${selectedStudent.firstName} ${selectedStudent.name}` : 'Fee Management'}
        </h1>
        {!selectedStudent && (
          <button
            onClick={() => setIsAddFeesModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors"
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Fee'}
          </button>
        )}
      </div>

      {/* Recherche d'étudiant si pas sélectionné (Immobile) */}
      {!selectedStudent && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <label className="block text-sm font-medium mb-2">Search for a student to view their fees</label>
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Name, first name, contact or ID..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filteredStudents.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
              {filteredStudents.map(student => (
                <button
                  key={student.studentId}
                  onClick={() => handleStudentSelect(student)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0 dark:border-gray-600"
                >
                  {student.firstName} {student.name} ({student.identity}) - {student.contact}
                </button>
              ))}
            </div>
          )}
          {filteredStudents.length === 0 && studentSearch && (
            <p className="mt-2 text-sm text-gray-500">No student found.</p>
          )}
        </div>
      )}

      {selectedStudent && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">Status: <span className={`font-medium ${selectedStudent.status === 'COMPLETED' ? 'text-green-600' : selectedStudent.status === 'OVERDUE' ? 'text-red-600' : 'text-yellow-600'}`}>{selectedStudent.status}</span></p>
          <button
            onClick={handleClearSelection}
            className="px-4 py-2 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-700 transition-colors"
          >
            View All Fees
          </button>
        </div>
      )}

      {/* Statistics Cards (Immobile) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Total Fees</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{stats.totalAmount.toLocaleString()} Ar</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Total Amount</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">{stats.monthlyFees}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Monthly Fees</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="text-2xl font-bold text-orange-600">{stats.annualFees}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Annual Rights</div>
        </div>
      </div>

      {/* Totals for Selected Student (Immobile) */}
      {selectedStudent && studentFees && studentFees.totals && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="font-semibold mb-2">Totals for {selectedStudent.firstName} {selectedStudent.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div><strong>Annual:</strong> {studentFees.totals.annuel.toLocaleString()} Ar</div>
            <div><strong>Monthly:</strong> {studentFees.totals.mensuel.toLocaleString()} Ar</div>
            <div><strong>Total Expected:</strong> {studentFees.totals.totalAttendu.toLocaleString()} Ar</div>
            <div><strong>Total Paid:</strong> {studentFees.totals.totalPaye.toLocaleString()} Ar</div>
            <div className={`font-semibold ${studentFees.totals.resteAPayer > 0 ? 'text-red-600' : 'text-green-600'}`}>
              <strong>Remaining to Pay:</strong> {studentFees.totals.resteAPayer.toLocaleString()} Ar
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 right-0 px-4 py-3"
          >
            ×
          </button>
        </div>
      )}

      {/* Conteneur de tableau défilant */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md flex-1 min-h-0 overflow-y-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 sticky top-0 z-10"> 
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                ID
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Type
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Month
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Student
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {feesToDisplay.map((fee) => (
              <tr key={fee.feesId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {fee.feesId}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    fee.feeType === 'DROITS_ANNUELS' 
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                  }`}>
                    {getFeeTypeText(fee.feeType)}
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium">
                  {fee.price.toLocaleString()} Ar
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {fee.month || '-'}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.name}` : getStudentName(fee.studentId)}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-right space-x-2">
                  <button
                    onClick={() => handleEditClick(fee)}
                    className="px-3 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFees(fee.feesId)}
                    className="px-3 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {feesToDisplay.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {selectedStudent 
             ? "No fees found for this student." 
             : searchQuery.trim() 
               ? `No fees found matching "${searchQuery}".`
               : "No fees found."
            }
          </div>
        )}
      </div>

      {/* Les Modals restent inchangés et sont exclus du défilement principal */}
      {/* ... Add Fee Modal ... */}
      {isAddFeesModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add Fee</h2>
              <button
                onClick={() => setIsAddFeesModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddFees} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Fee Type</label>
                <select
                  name="feeType"
                  value={newFees.feeType}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                >
                  <option value="DROITS_ANNUELS">Annual Rights</option>
                  <option value="ECOLAGE_MENSUEL">Monthly Tuition</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount (Ar)</label>
                <input
                  type="number"
                  name="price"
                  value={newFees.price}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="0"
                />
              </div>
              {newFees.feeType === 'ECOLAGE_MENSUEL' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Month (ex: 2024-01)</label>
                  <input
                    type="month"
                    value={newFees.month}
                    onChange={(e) => setNewFees(prev => ({ ...prev, month: e.target.value }))}
                    required={newFees.feeType === 'ECOLAGE_MENSUEL'}
                    disabled={submitting}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Student</label>
                <select
                  name="studentId"
                  value={newFees.studentId}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                >
                  <option value="" disabled>Select a student</option>
                  {students.map(student => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.firstName} {student.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddFeesModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ... Edit Fee Modal ... */}
      {isEditFeesModalOpen && editFees && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Fee</h2>
              <button
                onClick={() => {
                  setIsEditFeesModalOpen(false);
                  setEditFees(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditFees} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Fee Type</label>
                <select
                  name="feeType"
                  value={editFees.feeType}
                  onChange={handleEditInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                >
                  <option value="DROITS_ANNUELS">Annual Rights</option>
                  <option value="ECOLAGE_MENSUEL">Monthly Tuition</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount (Ar)</label>
                <input
                  type="number"
                  name="price"
                  value={editFees.price}
                  onChange={handleEditInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="0"
                />
              </div>
              {editFees.feeType === 'ECOLAGE_MENSUEL' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Month (ex: 2024-01)</label>
                  <input
                    type="month"
                    value={editFees.month || ''}
                    onChange={handleEditInputChange}
                    name="month"
                    required={editFees.feeType === 'ECOLAGE_MENSUEL'}
                    disabled={submitting}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Student</label>
                <select
                  name="studentId"
                  value={editFees.studentId}
                  onChange={handleEditInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                >
                  <option value="" disabled>Select a student</option>
                  {students.map(student => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.firstName} {student.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditFeesModalOpen(false);
                    setEditFees(null);
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {submitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ... Confirmation Modal ... */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this fee? This action is irreversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
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