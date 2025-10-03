// src/pages/ClassDetailPage.tsx
import { useEffect, useState } from 'react';
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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        // LANGSUNG pakai endpoint withsiswa
        const res = await axios.get(`http://localhost:3000/api/withsiswa/${id}`);
        setKelas(res.data.data);
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
            <h1 className="text-2xl font-bold text-gray-800">Class Details</h1>
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

                {kelas.siswa.length === 0 ? (
                  <p className="text-sm text-gray-600">Belum ada siswa.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {kelas.siswa.map((s) => (
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
