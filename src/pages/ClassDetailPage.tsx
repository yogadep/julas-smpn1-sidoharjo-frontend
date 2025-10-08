import { useEffect, useMemo, useState } from 'react'; 
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { UsersIcon, ArrowLeftIcon } from 'lucide-react';

interface StudentLite {
  _id: string;
  nis: string;
  nama: string;
  jenisKelamin: 'laki-laki' | 'perempuan';
}

interface ClassWithSiswa {
  _id: string;
  namaKelas: string;
  description?: string;
  siswa: StudentLite[];
  createdAt?: string;
  updatedAt?: string;
}

const ClassDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [kelas, setKelas] = useState<ClassWithSiswa | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState('');

  // NEW: state & config pagination untuk daftar siswa
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`https://julas-smpn1-sidoharjo-backend.vercel.app/api/withsiswa/${id}`);
        setKelas(res.data.data);
        setCurrentPage(1); // NEW: reset ke page 1 saat data kelas di-load
      } catch (e) {
        console.error(e);
        setError('Gagal memuat detail kelas');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  // NEW: hitung data pagination dari kelas.siswa
  const totalItems = kelas?.siswa?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const pageItems = useMemo(
    () => (kelas?.siswa ?? []).slice(startIndex, endIndex),
    [kelas, startIndex, endIndex]
  );

  // NEW: clamp currentPage kalau totalPages mengecil (mis. data berubah)
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && <div className="lg:block hidden md:block"><Sidebar /></div>}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="Class Details" onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !kelas) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && <div className="lg:block hidden md:block"><Sidebar /></div>}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="Class Details" onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-red-500">{error || 'Class not found'}</p>
              <Link to="/classes" className="text-blue-500 hover:underline mt-4 inline-block">
                Back to Classes
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && <div className="lg:block hidden md:block"><Sidebar /></div>}

      <div className="flex-1 flex flex-col">
        <Navbar pageTitle="Class Details" onToggleSidebar={toggleSidebar} />

        <main className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <Link to="/classes" className="mr-3 text-blue-500 hover:text-blue-700">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <UsersIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Detail Kelas</h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Nama Kelas</label>
                    <p className="mt-1 text-sm text-gray-900">{kelas.namaKelas}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{kelas.description || '-'}</p>
                  </div>
                </div>

                {/* System Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">System Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(kelas.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(kelas.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Students List (nama, NIS, jenis kelamin) */}
              <div className="mt-8 pt-4 border-t">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Siswa di Kelas Ini</h2>

                {totalItems === 0 ? (
                  <p className="text-sm text-gray-600">Belum ada siswa.</p>
                ) : (
                  <>
                    <ul className="divide-y divide-gray-100">
                      {pageItems.map((s) => (
                        <li key={s._id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{s.nama}</p>
                            <p className="text-xs text-gray-500">NIS: {s.nis} • {s.jenisKelamin}</p>
                          </div>
                          <Link to={`/student/${s._id}`} className="text-blue-500 hover:text-blue-700 text-sm">
                            Detail
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {/* NEW: pagination controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Showing <span className="font-medium">{startIndex + 1}</span>–
                        <span className="font-medium">{endIndex}</span> of{' '}
                        <span className="font-medium">{totalItems}</span> students
                      </div>

                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50 bg-white hover:bg-gray-50"
                        >
                          Prev
                        </button>

                        <span className="px-3 py-1.5 text-sm text-gray-600">
                          Page {currentPage} / {totalPages}
                        </span>

                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50 bg-white hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default ClassDetailPage;
