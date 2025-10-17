'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
// Importer useSearch depuis le contexte
import { useSearch } from '../../context/searchContext'; 

// --- Types ---
type Student = {
  studentId: number;
  name: string;
  firstName: string;
  contact: string;
  identity: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  fees: any[];
  pay: any[];
};

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

// --- Composant Principal ---
export default function StudentsPage() {
  const { searchQuery } = useSearch(); // Utiliser le contexte de recherche
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    firstName: '',
    contact: '',
    identity: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

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
      const studentsRes = await fetch('/api/student');
      if (!studentsRes.ok) {
        throw new Error('Failed to load students.');
      }
      const studentsData = await studentsRes.json();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingStudent) {
      setEditingStudent(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error adding student.');
      }
      
      await fetchData();
      setIsModalOpen(false);
      setNewStudent({ name: '', firstName: '', contact: '', identity: '' });
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
      const res = await fetch(`/api/student/${editingStudent.studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingStudent.name,
          firstName: editingStudent.firstName,
          contact: editingStudent.contact,
          identity: editingStudent.identity,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error updating student.');
      }
      
      await fetchData();
      setIsEditModalOpen(false);
      setEditingStudent(null);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'OVERDUE':
        return 'Overdue';
      case 'PENDING':
        return 'Pending';
      default:
        return status;
    }
  };

  // --- Filtre et Statistiques ---
  
  // 1. Filtrer les étudiants en utilisant la requête de recherche du contexte
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;

    const query = searchQuery.toLowerCase().trim();
    return students.filter(student =>
      student.name.toLowerCase().includes(query) ||
      student.firstName.toLowerCase().includes(query) ||
      student.contact.toLowerCase().includes(query) ||
      student.identity.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);
  
  // 2. Calculer les statistiques globales (utilisant la liste complète)
  const getStudentStats = () => {
    const total = students.length;
    const completed = students.filter(s => s.status === 'COMPLETED').length;
    const overdue = students.filter(s => s.status === 'OVERDUE').length;
    const pending = students.filter(s => s.status === 'PENDING').length;
    return { total, completed, overdue, pending };
  };

  const stats = getStudentStats();
  // -----------------------------

  if (loading) {
    return (
      <div className="p-8 text-center text-lg text-gray-600 dark:text-gray-400">
        Loading student list...
      </div>
    );
  }

  return (
    // Utilisez `h-full` sur le conteneur principal pour définir une hauteur flexible
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

      {/* Tête de page (Immobile) */}
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

      {/* Statistics Cards (Immobile) */}
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

      {/* Conteneur de tableau avec défilement vertical */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md flex-1 min-h-0 overflow-y-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 sticky top-0 z-10">
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                ID
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Name
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                First Name
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Identity
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Utiliser filteredStudents pour l'affichage */}
            {filteredStudents.map((student) => (
              <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {student.studentId}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium">
                  {student.name}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {student.firstName}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {student.contact}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {student.identity}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                    {getStatusText(student.status)}
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-right space-x-2">
                  <button
                    onClick={() => handleViewDetails(student.studentId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => openEditModal(student)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(student.studentId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchQuery ? `No students found matching "${searchQuery}".` : 'No students found.'}
          </div>
        )}
      </div>

      {/* Modals remain here... */}
      {/* ... Add Student Modal ... */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add New Student</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={submitting}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newStudent.name}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="Enter name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={newStudent.firstName}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="Enter first name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={newStudent.contact}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="Phone number or email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Identity</label>
                <input
                  type="text"
                  name="identity"
                  value={newStudent.identity}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="Identity number"
                />
              </div>
                    
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ... Edit Student Modal ... */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Student</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={submitting}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editingStudent.name}
                  onChange={handleEditInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="Enter name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={editingStudent.firstName}
                  onChange={handleEditInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="Enter first name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={editingStudent.contact}
                  onChange={handleEditInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="Phone number or email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Identity</label>
                <input
                  type="text"
                  name="identity"
                  value={editingStudent.identity}
                  onChange={handleEditInputChange}
                  required
                  disabled={submitting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2"
                  placeholder="Identity number"
                />
              </div>
                    
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 transition-colors"
                >
                  {submitting ? 'Updating...' : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}