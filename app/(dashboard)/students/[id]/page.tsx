'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// TypeScript Types
type Student = {
  studentId: number;
  name: string;
  firstName: string;
  contact: string;
  identity: string;
  promotion: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
};

type Fee = {
  feesId: number;
  price: number;
  feeType: 'DROITS_ANNUELS' | 'ECOLAGE_MENSUEL';
  month?: string;
  studentId: number;
  pay?: Payment[];
};

type Payment = {
  payId: number;
  amount: number;
  month: string;
  studentId: number;
  feesId: number;
};

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

export default function StudentDetailsPage() {
  const { studentId } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddFeesModalOpen, setIsAddFeesModalOpen] = useState(false);
  const [isAddPayModalOpen, setIsAddPayModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<(() => Promise<void>) | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [newFees, setNewFees] = useState({ 
    price: '', 
    feeType: 'DROITS_ANNUELS' as 'DROITS_ANNUELS' | 'ECOLAGE_MENSUEL', 
    month: '', 
    studentId: Number(studentId) 
  });
  
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  
  const [newPay, setNewPay] = useState({ 
    amount: '', 
    month: '', 
    studentId: Number(studentId), 
    feesId: '' 
  });

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentRes, feesRes, payRes] = await Promise.all([
        fetch(`/api/student/${studentId}`),
        fetch(`/api/fees?studentId=${studentId}`),
        fetch(`/api/pay?studentId=${studentId}`),
      ]);

      if (!studentRes.ok) {
        throw new Error('Failed to load student data.');
      }

      const studentData = await studentRes.json();
      const feesData = await feesRes.json();
      const payData = await payRes.json();

      setStudent(studentData);
      setFees(feesData);
      setPayments(payData);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', student.name);
      formData.append('firstName', student.firstName);
      formData.append('contact', student.contact);
      formData.append('promotion', student.promotion);
      
      // If we have a new file, append it
      if (identityFile) {
        formData.append('identity', identityFile);
      } else {
        // If no new file, we don't append identity, so backend keeps the old one.
        // Unless we want to support deleting it? For now assume keep old.
        // But if we want to confirm the existing image is kept, we do nothing.
        // If we want to send the existing URL... backend handles file or null.
        if (student.identity) {
             formData.append('identity', student.identity);
        }
      }

      const res = await fetch(`/api/student/${studentId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error updating student.');
      }

      await fetchData();
      setIsEditMode(false);
      addNotification('success', 'Student updated successfully!');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newFees, 
          price: Number(newFees.price),
          studentId: Number(studentId)
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error adding fees.');
      }

      await fetchData();
      setIsAddFeesModalOpen(false);
      setNewFees({ price: '', feeType: 'DROITS_ANNUELS', month: '', studentId: Number(studentId) });
      addNotification('success', 'Fees added successfully!');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newPay, 
          amount: Number(newPay.amount), 
          feesId: Number(newPay.feesId),
          studentId: Number(studentId)
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error adding payment.');
      }

      await fetchData();
      setIsAddPayModalOpen(false);
      setNewPay({ amount: '', month: '', studentId: Number(studentId), feesId: '' });
      addNotification('success', 'Payment added successfully!');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFees = (feesId: number) => {
    setActionToDelete(() => async () => {
      try {
        // Note: You need to create this DELETE route in your API
        addNotification('info', 'Delete fees functionality is not yet implemented. Please create the DELETE /api/fees/[id] route');
        
        // If you have the DELETE route, uncomment this code:
        /*
        const res = await fetch(`/api/fees/${feesId}`, { method: 'DELETE' });
        if (!res.ok) {
          throw new Error('Failed to delete fees.');
        }
        await fetchData();
        addNotification('success', 'Fees deleted successfully!');
        */
      } catch (err) {
        addNotification('error', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsConfirmModalOpen(false);
        setActionToDelete(null);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleDeletePay = (payId: number) => {
    setActionToDelete(() => async () => {
      try {
        // Note: You need to create this DELETE route in your API
        addNotification('info', 'Delete payment functionality is not yet implemented. Please create the DELETE /api/pay/[id] route');
        
        // If you have the DELETE route, uncomment this code:
        /*
        const res = await fetch(`/api/pay/${payId}`, { method: 'DELETE' });
        if (!res.ok) {
          throw new Error('Failed to delete payment.');
        }
        await fetchData();
        addNotification('success', 'Payment deleted successfully!');
        */
      } catch (err) {
        addNotification('error', err instanceof Error ? err.message : 'An error occurred');
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

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'OVERDUE': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  // Function to translate status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Paid';
      case 'OVERDUE': return 'Overdue';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  };

  // Function to translate fee type
  const getFeeTypeText = (feeType: string) => {
    switch (feeType) {
      case 'DROITS_ANNUELS': return 'Annual Fees';
      case 'ECOLAGE_MENSUEL': return 'Monthly Tuition';
      default: return feeType;
    }
  };

  // Calculate total paid for specific fees
  const getTotalPaidForFee = (feeId: number) => {
    return payments
      .filter(payment => payment.feesId === feeId)
      .reduce((total, payment) => total + payment.amount, 0);
  };

  // Calculate general totals
  const totalFees = fees.reduce((sum, fee) => sum + fee.price, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRemaining = totalFees - totalPaid;

  if (loading) {
    return (
      <div className="p-8 text-center text-lg text-gray-600 dark:text-gray-400">
        Loading student information...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center text-lg text-red-500">
        Error: Student not found.
        <button 
          onClick={() => router.back()}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
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

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        ← Back to list
      </button>

      {/* Header with statistics */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-4">
             {student.identity && (
                 <img 
                   src={student.identity} 
                   alt="Identity"
                   className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                 />
             )}
             <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {student.name} {student.firstName}
                </h1>
                <div className="flex items-center mt-2 space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(student.status)}`}>
                    {getStatusText(student.status)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ID: {student.studentId}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
                    Promo: {student.promotion}
                  </span>
                </div>
             </div>
          </div>
        </div>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          disabled={submitting}
          className="px-6 py-3 bg-yellow-500 text-white rounded-xl shadow-md transition-colors hover:bg-yellow-600 disabled:bg-yellow-400"
        >
          {isEditMode ? 'Cancel' : 'Edit Information'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{totalFees.toLocaleString()} Ar</div>
          <div className="text-gray-600 dark:text-gray-400">Total Fees</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()} Ar</div>
          <div className="text-gray-600 dark:text-gray-400">Total Paid</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-red-500">
          <div className={`text-2xl font-bold ${totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {totalRemaining.toLocaleString()} Ar
          </div>
          <div className="text-gray-600 dark:text-gray-400">Remaining Balance</div>
        </div>
      </div>

      {/* General Information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">General Information</h2>
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={student.name}
                onChange={(e) => setStudent({ ...student, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                disabled={!isEditMode || submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={student.firstName}
                onChange={(e) => setStudent({ ...student, firstName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                disabled={!isEditMode || submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact</label>
              <input
                type="text"
                name="contact"
                value={student.contact}
                onChange={(e) => setStudent({ ...student, contact: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                disabled={!isEditMode || submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Promotion</label>
              <input
                type="text"
                name="promotion"
                value={student.promotion}
                onChange={(e) => setStudent({ ...student, promotion: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                disabled={!isEditMode || submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Identity (Image)</label>
              <div className="space-y-2">
                 {isEditMode ? (
                    <input
                      type="file"
                      name="identity"
                      accept="image/*"
                      onChange={(e) => {
                         if (e.target.files && e.target.files[0]) {
                            setIdentityFile(e.target.files[0]);
                         }
                      }}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200"
                      disabled={submitting}
                    />
                 ) : (
                    <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700">
                       {student.identity ? 'Image uploaded' : 'No image'}
                    </div>
                 )}
              </div>
            </div>
          </div>
          {isEditMode && (
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fees Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Fees</h2>
            <button
              onClick={() => setIsAddFeesModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors"
            >
              Add Fees
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Month</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Paid</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Remaining</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => {
                  const totalPaid = getTotalPaidForFee(fee.feesId);
                  const remaining = fee.price - totalPaid;
                  const paymentStatus = remaining === 0 ? 'COMPLETED' : remaining > 0 ? 'PENDING' : 'OVERDUE';
                  
                  return (
                    <tr key={fee.feesId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm">
                        {getFeeTypeText(fee.feeType)}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm">
                        {fee.month || '-'}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium">
                        {fee.price.toLocaleString()} Ar
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm">
                        {totalPaid.toLocaleString()} Ar
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(paymentStatus)}`}>
                          {remaining.toLocaleString()} Ar
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm text-right">
                        <button
                          onClick={() => handleDeleteFees(fee.feesId)}
                          className="px-3 py-1 text-xs text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {fees.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No fees recorded
              </div>
            )}
          </div>
        </div>

        {/* Payments Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Payments</h2>
            <button
              onClick={() => setIsAddPayModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Add Payment
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Month</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Fee Type</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => {
                  const relatedFee = fees.find(fee => fee.feesId === pay.feesId);
                  return (
                    <tr key={pay.payId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium">
                        {pay.amount.toLocaleString()} Ar
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm">
                        {pay.month}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm">
                        {relatedFee ? getFeeTypeText(relatedFee.feeType) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm text-right">
                        <button
                          onClick={() => handleDeletePay(pay.payId)}
                          className="px-3 py-1 text-xs text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No payments recorded
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal to add fees */}
      {isAddFeesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Fees</h2>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fee Type
                </label>
                <select
                  name="feeType"
                  value={newFees.feeType}
                  onChange={(e) => setNewFees({ ...newFees, feeType: e.target.value as 'DROITS_ANNUELS' | 'ECOLAGE_MENSUEL', month: e.target.value === 'DROITS_ANNUELS' ? '' : newFees.month })}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="DROITS_ANNUELS">Annual Fees</option>
                  <option value="ECOLAGE_MENSUEL">Monthly Tuition</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (Ar)
                </label>
                <input
                  type="number"
                  name="price"
                  value={newFees.price}
                  onChange={(e) => setNewFees({ ...newFees, price: e.target.value })}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              {newFees.feeType === 'ECOLAGE_MENSUEL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Month (ex: january-2024)
                  </label>
                  <input
                    type="text"
                    name="month"
                    value={newFees.month}
                    onChange={(e) => setNewFees({ ...newFees, month: e.target.value })}
                    required={newFees.feeType === 'ECOLAGE_MENSUEL'}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="january-2024"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddFeesModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400 transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add Fees'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal to add payment */}
      {isAddPayModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Payment</h2>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Associated Fees
                </label>
                <select
                  name="feesId"
                  value={newPay.feesId}
                  onChange={(e) => setNewPay({ ...newPay, feesId: e.target.value })}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="" disabled>Select fees</option>
                  {fees.map(fee => (
                    <option key={fee.feesId} value={fee.feesId}>
                      {getFeeTypeText(fee.feeType)} - {fee.price.toLocaleString()} Ar
                      {fee.month && ` (${fee.month})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (Ar)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={newPay.amount}
                  onChange={(e) => setNewPay({ ...newPay, amount: e.target.value })}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Month (ex: january-2024)
                </label>
                <input
                  type="text"
                  name="month"
                  value={newPay.month}
                  onChange={(e) => setNewPay({ ...newPay, month: e.target.value })}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="january-2024"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddPayModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400 transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
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