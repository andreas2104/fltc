'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearch } from '../../context/searchContext';

// --- Types ---
type Student = {
  id: number;
  name: string;
  firstName: string | null;
  promotion: {
      totalFee: number;
  };
  payments: {
      amount: number;
  }[];
};

type Payment = {
  id: number;
  amount: number;
  month: string;
  date: string;
  studentId: number;
  student: Student;
};

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

// --- Month Options ---
const monthOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PaymentsPage() {
  const { searchQuery } = useSearch();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newPayment, setNewPayment] = useState({
    studentId: '',
    amount: '',
    month: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search: searchQuery || ''
      });

      const [paymentsRes, studentsRes] = await Promise.all([
        fetch(`/api/payment?${queryParams}`),
        fetch('/api/student')
      ]);

      if (!paymentsRes.ok || !studentsRes.ok) {
        throw new Error('Failed to load data.');
      }
      
      const paymentsData = await paymentsRes.json();
      const studentsData = await studentsRes.json();
      
      setPayments(paymentsData.data);
      setTotalPages(paymentsData.meta.totalPages);
      setTotalRevenue(paymentsData.meta.totalRevenue);
      setTotalPayments(paymentsData.meta.total);
      setStudents(studentsData.data);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingPayment) {
        setEditingPayment(prev => prev ? { ...prev, [name]: name === 'amount' ? Number(value) : value } : null);
    } else {
        setNewPayment(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/payment/${editingPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: editingPayment.amount,
          month: editingPayment.month,
          // studentId updates excluded for simplicity unless requested
        }),
      });
      
      if (!res.ok) throw new Error('Error updating payment.');
      
      await fetchData();
      setIsModalOpen(false);
      setEditingPayment(null);
      setIsEditMode(false);
      addNotification('success', 'Payment updated successfully!');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      const res = await fetch(`/api/payment/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error deleting payment.');
      
      await fetchData();
      addNotification('success', 'Payment deleted successfully');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Error deleting payment');
    }
  };

  const openEditModal = (payment: Payment) => {
    setEditingPayment(payment);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
     setEditingPayment(null);
     setIsEditMode(false);
     setIsModalOpen(true);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: Number(newPayment.studentId),
          amount: Number(newPayment.amount),
          month: newPayment.month,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error adding payment.');
      }
      
      await fetchData();
      setIsModalOpen(false);
      setNewPayment({ studentId: '', amount: '', month: '' });
      addNotification('success', 'Payment added successfully!');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Filter and Statistics ---
  // Client-side filter removed in favor of Server-side search implemented in fetchData
  
  const getTotalRevenue = () => {
    return payments.reduce((sum, p) => sum + p.amount, 0); 
    // Note: This only sums visible payments now due to pagination. 
    // If exact total needed, API should return it. 
    // User requested removing Total Revenue card anyway.
  };

  if (loading && payments.length === 0) {
    return (
      <div className="p-8 text-center text-lg text-gray-600 dark:text-gray-400">
        Loading payments...
      </div>
    );
  }

  return (
    <div className="h-full space-y-8 flex flex-col">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border-l-4 ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-500 text-green-700'
                : notification.type === 'error'
                ? 'bg-red-50 border-red-500 text-red-700'
                : 'bg-blue-50 border-blue-500 text-blue-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{notification.message}</span>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="ml-4 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Payment Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
             Total Students: <span className="font-semibold text-purple-600 dark:text-purple-400">{students.length}</span>
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors"
          disabled={submitting}
        >
          {submitting ? 'Adding...' : 'Add Payment'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{totalPayments}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Total Transactions</div>
        </div>
         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">{students.length}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Active Students ( Page )</div>
        </div>
      </div>


      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md flex-1 min-h-0 overflow-hidden flex flex-col w-full">
        <div className="overflow-y-auto flex-1">
         <table className="min-w-full leading-normal table-fixed">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 sticky top-0 z-10">
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider w-1/4">Student</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider w-1/6">Amount</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider w-1/6">Month</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider w-1/6">Date</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider w-1/4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium break-words">
                  {payment.student?.name} {payment.student?.firstName || ''}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    {payment.amount.toLocaleString()} Ar
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">{payment.month}</td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {new Date(payment.date).toLocaleDateString()}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                   <button onClick={() => openEditModal(payment)} className="px-3 py-1 bg-green-600 text-white rounded mr-2 hover:bg-green-700">Edit</button>
                   <button onClick={() => handleDeletePayment(payment.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow">
          <button 
             onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
             disabled={currentPage === 1}
             className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
          >
             Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
             disabled={currentPage === totalPages}
             className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
          >
             Next
          </button>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Payment' : 'Add New Payment'}</h2>
            <form onSubmit={isEditMode ? handleEditPayment : handleAddPayment} className="space-y-4">
              {isEditMode && editingPayment && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          Editing payment for: {editingPayment.student?.name} {editingPayment.student?.firstName || ''}
                      </p>
                      {(() => {
                          const student = students.find(s => s.id === editingPayment.studentId);
                          if (student) {
                              const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
                              const remaining = student.promotion.totalFee - totalPaid;
                              return (
                                  <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                      <p>Total Fee: {student.promotion.totalFee.toLocaleString()} Ar</p>
                                      <p>Total Paid: {totalPaid.toLocaleString()} Ar</p>
                                      <p className="font-bold">Fees Rest: {(remaining + editingPayment.amount).toLocaleString()} Ar (before this edit)</p>
                                  </div>
                              );
                          }
                          return null;
                      })()}
                  </div>
              )}

              {!isEditMode && (
                <div>
                   <select name="studentId" value={newPayment.studentId} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option value="">Select Student</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} {s.firstName || ''}</option>
                      ))}
                   </select>
                   {newPayment.studentId && (() => {
                       const selectedStudent = students.find(s => s.id === Number(newPayment.studentId));
                       if (selectedStudent && selectedStudent.promotion) {
                           const totalPaid = selectedStudent.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
                           const remaining = selectedStudent.promotion.totalFee - totalPaid;
                           return (
                               <div className={`mt-2 p-3 rounded-lg text-sm font-medium ${remaining <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                   <div className="flex justify-between">
                                       <span>Total Fee:</span>
                                       <span>{selectedStudent.promotion.totalFee.toLocaleString()} Ar</span>
                                   </div>
                                   <div className="flex justify-between">
                                       <span>Total Paid:</span>
                                       <span>{totalPaid.toLocaleString()} Ar</span>
                                   </div>
                                   <div className="flex justify-between font-bold border-t border-current mt-1 pt-1">
                                       <span>Fees Rest:</span>
                                       <span>{remaining.toLocaleString()} Ar</span>
                                   </div>
                               </div>
                           )
                       }
                       return null;
                   })()}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount (Ar)</label>
                <input 
                  type="number" 
                  name="amount" 
                  value={isEditMode && editingPayment ? editingPayment.amount : newPayment.amount} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Amount (Ar)" 
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
                <select name="month" value={isEditMode && editingPayment ? editingPayment.month : newPayment.month} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                   <option value="">Select Month</option>
                   {monthOptions.map(m => (
                     <option key={m} value={m}>{m}</option>
                   ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded">{submitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Payment')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
