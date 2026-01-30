'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearch } from '../../context/searchContext';

// --- Types ---
type Student = {
  id: number;
  name: string;
  firstName: string | null;
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
      const [paymentsRes, studentsRes] = await Promise.all([
        fetch('/api/payment'),
        fetch('/api/student')
      ]);

      if (!paymentsRes.ok || !studentsRes.ok) {
        throw new Error('Failed to load data.');
      }
      
      const paymentsData = await paymentsRes.json();
      const studentsData = await studentsRes.json();
      
      setPayments(paymentsData);
      setStudents(studentsData);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({ ...prev, [name]: value }));
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
  const filteredPayments = useMemo(() => {
    if (!searchQuery) return payments;
    const query = searchQuery.toLowerCase().trim();
    return payments.filter(payment =>
      payment.student.name.toLowerCase().includes(query) ||
      (payment.student.firstName && payment.student.firstName.toLowerCase().includes(query)) ||
      payment.month.toLowerCase().includes(query)
    );
  }, [payments, searchQuery]);
  
  const getTotalRevenue = () => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  };

  if (loading) {
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
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Payment Management
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 transition-colors"
          disabled={submitting}
        >
          {submitting ? 'Adding...' : 'Add Payment'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{payments.length}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Total Payments</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{getTotalRevenue().toLocaleString()} Ar</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Total Revenue</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">{students.length}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Total Students</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md flex-1 min-h-0 overflow-y-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 sticky top-0 z-10">
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">ID</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Student</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Month</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">{payment.id}</td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium">
                  {payment.student.name} {payment.student.firstName || ''}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Add New Payment</h2>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <select name="studentId" value={newPayment.studentId} onChange={handleInputChange} required className="w-full p-2 border rounded">
                 <option value="">Select Student</option>
                 {students.map(s => (
                   <option key={s.id} value={s.id}>{s.name} {s.firstName || ''}</option>
                 ))}
              </select>

              <input 
                type="number" 
                name="amount" 
                value={newPayment.amount} 
                onChange={handleInputChange} 
                required 
                placeholder="Amount (Ar)" 
                className="w-full p-2 border rounded" 
              />

              <select name="month" value={newPayment.month} onChange={handleInputChange} required className="w-full p-2 border rounded">
                 <option value="">Select Month</option>
                 {monthOptions.map(m => (
                   <option key={m} value={m}>{m}</option>
                 ))}
              </select>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded">{submitting ? 'Adding...' : 'Add Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
