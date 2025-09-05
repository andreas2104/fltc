'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', firstName: '', contact: '', identity: '', centerId: '' });
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [studentsRes, centersRes] = await Promise.all([
        fetch('/api/student'),
        fetch('/api/center'),
      ]);

      if (!studentsRes.ok || !centersRes.ok) {
        throw new Error('Échec du chargement des données.');
      }

      const studentsData = await studentsRes.json();
      const centersData = await centersRes.json();

      setStudents(studentsData);
      setCenters(centersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStudent,
          centerId: Number(newStudent.centerId) // Assurer que l'ID est un nombre
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout de l\'étudiant.');
      }

      // Recharger les données après l'ajout
      await fetchData();
      setIsModalOpen(false);
      setNewStudent({ name: '', firstName: '', contact: '', identity: '', centerId: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet étudiant ?')) {
      try {
        const res = await fetch(`/api/student/${studentId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Échec de la suppression de l\'étudiant.');
        }
        await fetchData(); // Recharger les données
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEditStudent = (studentId) => {
    router.push(`/students/${studentId}`);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-lg text-gray-600 dark:text-gray-400">
        Chargement de la liste des étudiants...
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
          Gestion des étudiants
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md transition-transform transform hover:scale-105"
        >
          Ajouter un étudiant
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                ID
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Prénom
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                Centre
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-300 dark:border-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.studentId} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {student.studentId}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {student.name}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {student.firstName}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {student.contact}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  {student.center?.city || 'N/A'}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-right">
                  <button
                    onClick={() => handleEditStudent(student.studentId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600 mr-2"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(student.studentId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Ajouter un nouvel étudiant</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nom</label>
                <input
                  type="text"
                  name="name"
                  value={newStudent.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={newStudent.firstName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={newStudent.contact}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Identité</label>
                <input
                  type="text"
                  name="identity"
                  value={newStudent.identity}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Centre</label>
                <select
                  name="centerId"
                  value={newStudent.centerId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="" disabled>Sélectionner un centre</option>
                  {centers.map(center => (
                    <option key={center.centerId} value={center.centerId}>
                      {center.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
