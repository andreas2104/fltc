'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSearch } from '../../context/searchContext'; 

// --- Types ---
type Promotion = {
  id: number;
  name: string;
  totalFee: number;
};

type Student = {
  id: number;
  name: string;
  firstName: string | null;
  phone: string | null;
  image: string | null;
  promotionId: number;
  promotion: Promotion;
  status: string; // 'PENDING' | 'COMPLETED'
};

type AppNotification = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

export default function StudentsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-lg text-gray-600 dark:text-gray-400">Loading students...</div>}>
      <StudentsContent />
    </React.Suspense>
  );
}

function StudentsContent() {
  const { searchQuery, setSearchQuery } = useSearch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [students, setStudents] = useState<Student[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [newStudent, setNewStudent] = useState<{
    name: string;
    firstName: string;
    phone: string;
    promotionId: string;
  }>({
    name: '',
    firstName: '',
    phone: '',
    promotionId: '',
  });
  const [newStudentImage, setNewStudentImage] = useState<File | null>(null);
  const [editStudentImage, setEditStudentImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  
  // URL-synced variables
  const currentPage = Number(searchParams.get('page')) || 1;
  const filterPromotionId = searchParams.get('promotionId') || '';
  const [limit] = useState(20);
  
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  const updateQueryParams = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search: searchQuery || '',
        promotionId: filterPromotionId || ''
      });

      const [studentsRes, promoRes] = await Promise.all([
        fetch(`/api/student?${queryParams}`),
        fetch('/api/promotions')
      ]);

      if (!studentsRes.ok || !promoRes.ok) {
        throw new Error('Failed to load data.');
      }
      
      const studentsData = await studentsRes.json();
      const promoData = await promoRes.json();
      
      setStudents(studentsData.data);
      setTotalPages(studentsData.meta.totalPages);
      setStats({
          total: studentsData.meta.total,
          completed: studentsData.meta.completed,
          pending: studentsData.meta.pending,
          overdue: studentsData.meta.overdue
      });
      setPromotions(promoData);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Sync searchQuery from URL if it exists (e.g. on direct landing)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams, setSearchQuery, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [currentPage, searchQuery, filterPromotionId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingStudent) {
      setEditingStudent(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('name', newStudent.name);
      formData.append('firstName', newStudent.firstName);
      formData.append('promotionId', newStudent.promotionId);
      formData.append('phone', newStudent.phone);
      if (newStudentImage) {
        formData.append('image', newStudentImage);
      }

      const res = await fetch('/api/student', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error adding student.');
      }
      
      await fetchData();
      setIsModalOpen(false);
      setNewStudent({ name: '', firstName: '', phone: '', promotionId: '' });
      setNewStudentImage(null);
      addNotification('success', 'Student added successfully!');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('name', editingStudent.name);
      formData.append('firstName', editingStudent.firstName || '');
      formData.append('promotionId', String(editingStudent.promotionId));
      formData.append('phone', editingStudent.phone || '');
      if (editStudentImage) {
        formData.append('image', editStudentImage);
      }

      const res = await fetch(`/api/student/${editingStudent.id}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error updating student.');
      }
      
      await fetchData();
      setIsEditModalOpen(false);
      setEditingStudent(null);
      setEditStudentImage(null);
      addNotification('success', 'Student updated successfully!');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const res = await fetch(`/api/student/${studentId}`, {
          method: 'DELETE',
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to delete student.');
        }
        
        await fetchData();
        addNotification('success', 'Student deleted successfully!');
      } catch (err) {
        addNotification('error', err instanceof Error ? err.message : 'An error occurred');
      }
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (studentId: number) => {
    router.push(`/students/${studentId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  // --- Filtre et Statistiques ---
  // Client-side filter replaced by Server-side search/filter
  
  const filteredStudents = students; // Pass through directly as filtering is done on server

  if (loading) {
    return (
      <div className="p-8 text-center text-lg text-gray-600 dark:text-gray-400">
        Loading student list...
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

      {/* Tête de page */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Student Management
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors"
          disabled={submitting}
        >
          {submitting ? 'Adding...' : 'Add Student'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Total Students</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Pending</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-end space-x-4">
        <select 
          value={filterPromotionId} 
          onChange={(e) => {
             updateQueryParams({ promotionId: e.target.value, page: 1 });
          }} 
          className="p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300"
        >
          <option value="">All Promotions</option>
          {promotions.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md flex-1 min-h-0 overflow-y-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 sticky top-0 z-10">
              {/* <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">ID</th> */}
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">First Name</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Promotion</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Phone</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {/* <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">{student.id}</td> */}
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium">{student.name}</td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">{student.firstName || '-'}</td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">

                  {student.promotion?.name || 'N/A'}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {student.phone || '-'}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>{student.status}</span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-right space-x-2">
                  <button onClick={() => handleViewDetails(student.id)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Details</button>
                  <button onClick={() => openEditModal(student)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">Edit</button>
                  <button onClick={() => handleDeleteStudent(student.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow">
          <button 
             onClick={() => updateQueryParams({ page: Math.max(1, currentPage - 1) })} 
             disabled={currentPage === 1}
             className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
          >
             Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
             onClick={() => updateQueryParams({ page: Math.min(totalPages, currentPage + 1) })} 
             disabled={currentPage === totalPages}
             className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
          >
             Next
          </button>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold mb-6">Add New Student</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <input type="text" name="name" value={newStudent.name} onChange={handleInputChange} required placeholder="Name" className="w-full p-2 border rounded" />
              <input type="text" name="firstName" value={newStudent.firstName} onChange={handleInputChange} placeholder="First Name (optional)" className="w-full p-2 border rounded" />
              <input type="text" name="phone" value={newStudent.phone} onChange={handleInputChange} placeholder="Phone Number (optional)" className="w-full p-2 border rounded" />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Photo (optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setNewStudentImage(e.target.files?.[0] || null)} 
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              
              <select name="promotionId" value={newStudent.promotionId} onChange={handleInputChange} required className="w-full p-2 border rounded text-white bg-gray-800">
                 <option value="" className="text-black">Select Promotion</option>
                 {promotions.map(p => (
                   <option key={p.id} value={p.id} className="text-black">{p.name} ({p.totalFee.toLocaleString()} Ar)</option>
                 ))}
              </select>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-500 rounded">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded">{submitting ? 'Adding...' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
            style={{
              backgroundImage: editingStudent.image ? `url(${editingStudent.image})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay to ensure readability when background image is present */}
            {editingStudent.image && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-0"></div>
            )}
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6">Edit Student</h2>
              <form onSubmit={handleEditStudent} className="space-y-4">
              <input type="text" name="name" value={editingStudent.name} onChange={handleEditInputChange} required placeholder="Name" className="w-full p-2 border rounded" />
              <input type="text" name="firstName" value={editingStudent.firstName || ''} onChange={handleEditInputChange} placeholder="First Name (optional)" className="w-full p-2 border rounded" />
              <input type="text" name="phone" value={editingStudent.phone || ''} onChange={handleEditInputChange} placeholder="Phone Number (optional)" className="w-full p-2 border rounded" />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Photo (optional)</label>
                {editingStudent.image && (
                  <div className="mb-2">
                    <img src={editingStudent.image} alt="Current photo" className="w-20 h-20 object-cover rounded" />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setEditStudentImage(e.target.files?.[0] || null)} 
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              
              <select name="promotionId" value={editingStudent.promotionId} onChange={handleEditInputChange} required className="w-full p-2 border rounded text-white bg-gray-800">
                 {promotions.map(p => (
                   <option key={p.id} value={p.id} className="text-black">{p.name} ({p.totalFee.toLocaleString()} Ar)</option>
                 ))}
              </select>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-500 rounded">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded">{submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
             </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}