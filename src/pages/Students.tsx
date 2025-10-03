import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import StudentsTable from '../components/StudentsTable'; 
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { UsersIcon } from 'lucide-react';

interface Classes {
  _id: string;
  namaKelas: string;
  description?: string;
  siswa?: string[];
}

interface Student {
  _id: string;
  nis: string;
  nama: string;
  kelas: string; // simpan ID kelas
  jenisKelamin: 'laki-laki' | 'perempuan';
  createdAt?: string;
  updatedAt?: string;
}

const StudentListingPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classes[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [selectedKelas, setSelectedKelas] = useState<string>(''); 

  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas: '', // _id kelas dari dropdown
    jenisKelamin: 'laki-laki' as 'laki-laki' | 'perempuan',
  });

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [clsRes, stdRes] = await Promise.all([
        axios.get('http://localhost:3000/api/getkelas'),
        axios.get('http://localhost:3000/api/getstudents'),
      ]);
      setClasses(clsRes.data.data || []);
      setStudents(stdRes.data.data || []);
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Anda harus login terlebih dahulu');

      const payload = {
        nis: formData.nis.trim(),
        nama: formData.nama.trim(),
        kelas: formData.kelas, // kirim _id kelas
        jenisKelamin: formData.jenisKelamin,
      };

      const res = await axios.post('http://localhost:3000/api/addstudent', payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (res.data.success) {
        setStudents(prev => [...prev, res.data.data]);
        setIsCreateModalOpen(false);
        setFormData({ nis: '', nama: '', kelas: '', jenisKelamin: 'laki-laki' });
        alert('Student berhasil dibuat');
      } else {
        alert(`Gagal membuat student: ${res.data.message}`);
      }
    } catch (error) {
      console.error('Error creating student:', error);
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat membuat student');
      }
    }
  };

  const classOptions = useMemo(
    () =>
      classes
        .map(k => ({ id: k._id, label: k.namaKelas }))
        .sort((a, b) => a.label.localeCompare(b.label, 'id', { sensitivity: 'base' })),
    [classes]
  );

   // --- reset halaman ke 1 saat filter kelas berubah ---
   useEffect(() => {
    setCurrentPage(1);
  }, [selectedKelas]);

  // ====== DATA YANG DITAMPILKAN DI TABEL ======
   // --- gunakan filter client-side berdasarkan selectedKelas ---
   const viewStudents = useMemo(
    () => (selectedKelas ? students.filter(s => s.kelas === selectedKelas) : students),
    [students, selectedKelas]
  );

  // ====== PAGINATION COMPUTATION (berdasarkan data yang SUDAH DIFILTER) ======
  const totalItems = viewStudents.length; 
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const pageItems = useMemo(
    () => viewStudents.slice(startIndex, endIndex), 
    [viewStudents, startIndex, endIndex]
  );

  // --- clamp currentPage jika totalPages mengecil setelah filter ---
  useEffect(() => {
    setCurrentPage(p => Math.min(p, totalPages));
  }, [totalPages]);

  const pageNumbers = useMemo(() => {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) pages.push(p);
      return pages;
    }
    const add = (x: number | '…') => pages.push(x);
    const near = [currentPage - 1, currentPage, currentPage + 1].filter(
      p => p >= 1 && p <= totalPages
    );

    add(1);
    if (near[0] && near[0] > 2) add('…');

    near.forEach(p => {
      if (p !== 1 && p !== totalPages) add(p);
    });

    if (near[near.length - 1] && near[near.length - 1] < totalPages - 1) add('…');
    add(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="lg:block hidden md:block">
          <Sidebar />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <Navbar pageTitle="Students" onToggleSidebar={toggleSidebar} />

        <main className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <UsersIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Daftar Siswa</h1>
          </div>

          {/* NEW: Filter kelas di atas tabel */}
          <div className="flex items-center gap-2 mb-4">
            <label htmlFor="kelasFilter" className="text-sm text-gray-600">Filter Kelas:</label>
            <select
              id="kelasFilter"
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm min-w-[220px] max-w-xs"
            >
              <option value="">Semua</option>
              {classOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Student
          </button>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <StudentsTable 
                students={pageItems}
                classes={classes} 
              />
            </div>
          )}
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              {totalItems
                ? <>Showing <span className="font-medium">{startIndex + 1}</span>–<span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalItems}</span> entries</>
                : 'No entries'}
            </div>

            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50 bg-white hover:bg-gray-50"
              >
                Prev
              </button>

              {pageNumbers.map((p, i) =>
                p === '…' ? (
                  <span key={`dots-${i}`} className="px-2 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1.5 border rounded-md text-sm ${
                      p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </main>
        <Footer />

        {/* CREATE MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
              <div className="p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Create New Student</h2>
                <form onSubmit={handleCreateSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">NIS*</label>
                    <input
                      type="text"
                      name="nis"
                      value={formData.nis}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Nama*</label>
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Kelas*</label>
                    <select
                      name="kelas"
                      value={formData.kelas}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="" disabled>Pilih kelas</option>
                      {classes.map(k => (
                        <option key={k._id} value={k._id}>
                          {k.namaKelas} {/* label nama, value _id */}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Jenis Kelamin*</label>
                    <select
                      name="jenisKelamin"
                      value={formData.jenisKelamin}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="laki-laki">Laki-laki</option>
                      <option value="perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="border-t p-4 bg-gray-50 sticky bottom-0">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Create Student
                      </button>
                    </div>
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentListingPage;
