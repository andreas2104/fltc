'use client';
import React, { useState, useEffect } from 'react';

// --- Types ---
type Promotion = {
  id: number;
  name: string;
  totalFee: number;
};

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    totalFee: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // --- Notification Helper ---
  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  // --- Fetch Data ---
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/promotions');
      
      if (!res.ok) {
        throw new Error('Failed to load promotions.');
      }
      
      const data = await res.json();
      setPromotions(data);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingPromo) {
        setEditingPromo(prev => prev ? { ...prev, [name]: name === 'totalFee' ? Number(value) : value } : null);
    } else {
        setNewPromotion(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/promotions/${editingPromo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingPromo.name,
          totalFee: Number(editingPromo.totalFee),
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error updating promotion.');
      
      await fetchPromotions();
      setIsModalOpen(false);
      setEditingPromo(null);
      setIsEditMode(false);
      addNotification('success', 'Promotion updated successfully!');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromotion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    try {
      const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error deleting promotion.');
      
      await fetchPromotions();
      addNotification('success', 'Promotion deleted successfully');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Error deleting promotion');
    }
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
     setEditingPromo(null);
     setIsEditMode(false);
     setIsModalOpen(true);
  };

  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPromotion.name,
          totalFee: Number(newPromotion.totalFee),
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error adding promotion.');
      }
      
      await fetchPromotions();
      setIsModalOpen(false);
      setNewPromotion({ name: '', totalFee: '' });
      addNotification('success', 'Promotion added successfully!');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="p-8 text-center text-lg text-gray-600 dark:text-gray-400">
        Loading promotions...
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
            Promotions Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
             Total Promotions: <span className="font-semibold text-purple-600 dark:text-purple-400">{promotions.length}</span>
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors"
          disabled={submitting}
        >
          {submitting ? 'Adding...' : 'Add Promotion'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">{promotions.length}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Total Promotions</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">
            {promotions.reduce((acc, curr) => acc + curr.totalFee, 0).toLocaleString()} Ar
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Total Fee Volume</div>
        </div>
      </div>      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md flex-1 min-h-0 overflow-hidden flex flex-col w-full">
        <div className="overflow-y-auto flex-1">
         <table className="min-w-full leading-normal table-fixed">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 sticky top-0 z-10">
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider w-1/3">Name</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider w-1/3">Total Fee</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider w-1/3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => (
              <tr key={promo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium break-words">{promo.name}</td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    {promo.totalFee.toLocaleString()} Ar
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                   <button onClick={() => openEditModal(promo)} className="px-3 py-1 bg-green-600 text-white rounded mr-2 hover:bg-green-700">Edit</button>
                   <button onClick={() => handleDeletePromotion(promo.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                </td>
              </tr>
            ))}
             {promotions.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center text-gray-500">
                  No promotions found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Promotion' : 'Add New Promotion'}</h2>
            <form onSubmit={isEditMode ? handleEditPromotion : handleAddPromotion} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={isEditMode && editingPromo ? editingPromo.name : newPromotion.name} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="e.g. Batch 2024" 
                  className="w-full p-2 border rounded" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Fee (Ar)</label>
                <input 
                  type="number" 
                  name="totalFee" 
                  value={isEditMode && editingPromo ? editingPromo.totalFee : newPromotion.totalFee} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="e.g. 500000" 
                  className="w-full p-2 border rounded" 
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 text-white rounded">{submitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Promotion')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
