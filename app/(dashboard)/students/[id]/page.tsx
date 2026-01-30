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
          amount: Number(newPayment.amount),
          month: newPayment.month,
          studentId: student.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error adding payment');
      
      await fetchData(); 
      setIsPayModalOpen(false);
      setNewPayment({ amount: '', month: '' });
      addNotification('success', 'Payment added successfully');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Error adding payment');
    } finally {
      setSubmitting(false);
    }
  };

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Loading student details...</div>;
  if (!student) return <div className="p-8 text-center text-red-500 font-semibold">Student not found</div>;

  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalFee = student.promotion.totalFee;
  const remaining = totalFee - totalPaid;

  return (
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((n) => (
           <div key={n.id} className={`p-4 rounded-lg shadow-lg border-l-4 ${n.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
             <div className="flex justify-between items-center">
                <span>{n.message}</span>
                <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="ml-4 text-gray-400 hover:text-gray-600">×</button>
             </div>
           </div>
        ))}
      </div>

      <button onClick={() => router.back()} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to list
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md gap-4">
         <div className="flex items-center space-x-6">
            <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-xl ring-4 ring-white dark:ring-gray-700">
              {student.image ? (
                <img src={student.image} alt={student.name} className="h-full w-full object-cover" />
              ) : (
                <span>{student.name.charAt(0)}{student.firstName ? student.firstName.charAt(0) : ''}</span>
              )}
            </div>
            
            <div>
               <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{student.name} {student.firstName || ''}</h1>
               <div className="flex flex-wrap items-center mt-3 gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${student.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {student.status}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">ID: #{student.id}</span>
                  <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold">Promo: {student.promotion.name}</span>
               </div>
            </div>
         </div>
         <button onClick={() => setIsEditMode(!isEditMode)} className="px-6 py-3 bg-yellow-500 text-white rounded-xl shadow-lg hover:bg-yellow-600 transition-all font-bold">
            {isEditMode ? 'Cancel Editing' : 'Edit Profile'}
         </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-t-4 border-blue-500">
            <div className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Total Tuition Fee</div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{totalFee.toLocaleString()} Ar</div>
         </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-t-4 border-green-500">
            <div className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Total Paid to Date</div>
            <div className="text-3xl font-black text-green-600 dark:text-green-400 mt-1">{totalPaid.toLocaleString()} Ar</div>
         </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-t-4 border-red-500">
            <div className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Fees Rest (Remaining)</div>
            <div className={`text-3xl font-black mt-1 ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>{remaining.toLocaleString()} Ar</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* General Info Form */}
         <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
               <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
               Identity Information
            </h2>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                  <input type="text" value={student.name} onChange={e => setStudent({...student, name: e.target.value})} disabled={!isEditMode} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-50 disabled:text-gray-500" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                  <input type="text" value={student.firstName || ''} onChange={e => setStudent({...student, firstName: e.target.value})} disabled={!isEditMode} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-50 disabled:text-gray-500" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Phone</label>
                  <input type="text" value={student.phone || ''} onChange={e => setStudent({...student, phone: e.target.value})} disabled={!isEditMode} placeholder="+261..." className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-50 disabled:text-gray-500" />
               </div>
               
               {isEditMode && (
                  <div className="pt-2">
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Change Profile Photo</label>
                     <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setNewImage(e.target.files?.[0] || null)} 
                        className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                     />
                  </div>
               )}
               
               {isEditMode && (
                  <button type="submit" disabled={submitting} className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                     {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
               )}
            </form>
         </div>

         {/* Payments History */}
         <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Payment History
               </h2>
               {remaining > 0 && (
                  <button onClick={() => setIsPayModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all font-bold text-sm">
                     + New Payment
                  </button>
               )}
            </div>
            
            <div className="overflow-x-auto">
               <table className="min-w-full leading-normal">
                  <thead>
                     <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                        <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                     </tr>
                  </thead>
                  <tbody>
                     {student.payments.map((p) => (
                        <tr key={p.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                           <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{new Date(p.date).toLocaleDateString()}</td>
                           <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{p.month}</td>
                           <td className="px-5 py-4 text-sm text-right font-black text-green-600 dark:text-green-400">{p.amount.toLocaleString()} Ar</td>
                        </tr>
                     ))}
                     {student.payments.length === 0 && (
                        <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400 italic">No payments recorded for this student.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* Add Payment Modal */}
      {isPayModalOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
               <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Add New Payment</h2>
               <p className="text-gray-500 text-sm mb-6 font-medium">Recording payment for {student.name}</p>
               
               <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">Total Fee:</span>
                     <span className="text-gray-900 dark:text-white font-bold">{totalFee.toLocaleString()} Ar</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">Already Paid:</span>
                     <span className="text-green-600 dark:text-green-400 font-bold">{totalPaid.toLocaleString()} Ar</span>
                  </div>
                  <div className="flex justify-between text-lg mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-700">
                     <span className="text-indigo-700 dark:text-indigo-300 font-black uppercase tracking-tighter">Fees Rest:</span>
                     <span className="text-red-600 dark:text-red-400 font-black">{remaining.toLocaleString()} Ar</span>
                  </div>
               </div>

               <form onSubmit={handleAddPayment} className="space-y-5">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Month</label>
                     <select 
                        value={newPayment.month} 
                        onChange={e => setNewPayment({...newPayment, month: e.target.value})} 
                        required 
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                     >
                        <option value="">Choose Month...</option>
                        {monthOptions.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount to Pay (Ar)</label>
                     <input 
                        type="number" 
                        value={newPayment.amount} 
                        onChange={e => setNewPayment({...newPayment, amount: e.target.value})} 
                        required 
                        placeholder="0" 
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                     />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                     <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold">Cancel</button>
                     <button type="submit" disabled={submitting} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
                        {submitting ? 'Processing...' : 'Confirm Payment'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
}