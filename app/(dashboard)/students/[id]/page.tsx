'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

type Promotion = {
  id: number;
  name: string;
  totalFee: number;
};

type Payment = {
  id: number;
  amount: number;
  month: string;
  date: string; // ISO string
};

type Student = {
  id: number;
  name: string;
  firstName: string | null;
  phone: string | null;
  image: string | null;
  promotion: Promotion;
  promotionId: number;
  status: string;
  payments: Payment[];
};

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

export default function StudentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  
  const [newPayment, setNewPayment] = useState({
    amount: '',
    month: ''
  });

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const notifId = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id: notifId, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== notifId));
    }, 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/${id}`);
      if (!res.ok) throw new Error('Failed to load student.');
      const data = await res.json();
      setStudent(data);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', student.name);
      formData.append('firstName', student.firstName || '');
      formData.append('phone', student.phone || '');
      formData.append('promotionId', String(student.promotionId));
      
      if (newImage) {
        formData.append('image', newImage);
      }

      const res = await fetch(`/api/student/${student.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) throw new Error('Error updating student');
      
      await fetchData();
      setIsEditMode(false);
      addNotification('success', 'Student updated successfully');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Error updating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: newPayment.amount,
          month: newPayment.month,
          studentId: student.id
        })
      });

      if (!res.ok) throw new Error('Error adding payment');
      
      await fetchData(); // Status will update automatically
      setIsPayModalOpen(false);
      setNewPayment({ amount: '', month: '' });
      addNotification('success', 'Payment added successfully');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Error adding payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!student) return <div className="p-8 text-center text-red-500">Student not found</div>;

  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalFee = student.promotion.totalFee;
  const remaining = totalFee - totalPaid;

  return (
    <div className="p-8 space-y-8">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((n) => (
           <div key={n.id} className={`p-4 rounded shadow bg-white border-l-4 ${n.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
             {n.message}
           </div>
        ))}
      </div>

      <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800">← Back</button>

      {/* Header */}
      <div className="flex justify-between items-start">
         <div className="flex items-center space-x-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg border-4 border-white">
              {student.image ? (
                <img src={student.image} alt={student.name} className="h-full w-full object-cover" />
              ) : (
                <span>{student.name.charAt(0)}{student.firstName ? student.firstName.charAt(0) : ''}</span>
              )}
            </div>
            
            <div>
               <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{student.name} {student.firstName || ''}</h1>
               <div className="flex flex-wrap items-center mt-3 gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${student.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {student.status}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">ID: {student.id}</span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">Promo: {student.promotion.name}</span>
                  {student.phone && (
                    <span className="flex items-center text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                      {student.phone}
                    </span>
                  )}
               </div>
            </div>
         </div>
         <button onClick={() => setIsEditMode(!isEditMode)} className="px-6 py-3 bg-yellow-500 text-white rounded-xl shadow hover:bg-yellow-600">
            {isEditMode ? 'Cancel' : 'Edit Info'}
         </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">{totalFee.toLocaleString()} Ar</div>
            <div className="text-gray-500">Total Tuition (Promo)</div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()} Ar</div>
            <div className="text-gray-500">Total Paid</div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow border-l-4 border-red-500">
            <div className={`text-2xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>{remaining.toLocaleString()} Ar</div>
            <div className="text-gray-500">Remaining Balance</div>
         </div>
      </div>

      {/* General Info Form */}
      <div className="bg-white p-6 rounded-xl shadow">
         <h2 className="text-2xl font-semibold mb-4">General Information</h2>
         <form onSubmit={handleUpdateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium mb-1">Name</label>
               <input type="text" value={student.name} onChange={e => setStudent({...student, name: e.target.value})} disabled={!isEditMode} className="w-full p-2 border rounded" />
            </div>
            <div>
               <label className="block text-sm font-medium mb-1">First Name</label>
               <input type="text" value={student.firstName || ''} onChange={e => setStudent({...student, firstName: e.target.value})} disabled={!isEditMode} className="w-full p-2 border rounded" />
            </div>
            <div>
               <label className="block text-sm font-medium mb-1">Promotion</label>
               <div className="p-2 bg-gray-50 border rounded text-gray-700">{student.promotion.name} ({student.promotion.totalFee.toLocaleString()} Ar)</div>
            </div>
            <div>
               <label className="block text-sm font-medium mb-1">Phone</label>
               <input type="text" value={student.phone || ''} onChange={e => setStudent({...student, phone: e.target.value})} disabled={!isEditMode} placeholder="+261..." className="w-full p-2 border rounded" />
            </div>
            {isEditMode && (
              <div className="col-span-1 md:col-span-2">
                 <label className="block text-sm font-medium mb-1">Profile Image</label>
                 <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setNewImage(e.target.files?.[0] || null)} 
                    className="w-full p-2 border rounded text-sm"
                 />
                 <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>
              </div>
            )}
            
            {isEditMode && (
               <div className="col-span-2 flex justify-end">
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded">Save Changes</button>
               </div>
            )}
         </form>
      </div>

      {/* Payments History */}
      <div className="bg-white p-6 rounded-xl shadow">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Payment History</h2>
            {remaining > 0 && (
               <button onClick={() => setIsPayModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700">
                  New Payment
               </button>
            )}
         </div>
         <table className="min-w-full leading-normal">
            <thead>
               <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Month</th>
                  <th className="px-4 py-3 text-left">Amount</th>
               </tr>
            </thead>
            <tbody>
               {student.payments.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                     <td className="px-4 py-3">{new Date(p.date).toLocaleDateString()}</td>
                     <td className="px-4 py-3">{p.month}</td>
                     <td className="px-4 py-3 font-medium">{p.amount.toLocaleString()} Ar</td>
                  </tr>
               ))}
               {student.payments.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No payments verified</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {/* Add Payment Modal */}
      {isPayModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
               <h2 className="text-xl font-bold mb-4">Add Payment</h2>
               <form onSubmit={handleAddPayment} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium mb-1">Month</label>
                     <input type="text" value={newPayment.month} onChange={e => setNewPayment({...newPayment, month: e.target.value})} required placeholder="e.g. January 2024" className="w-full p-2 border rounded" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Amount (Ar)</label>
                     <input type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} required placeholder="0" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                     <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                     <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded">Add Payment</button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
}