import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { UsersIcon, ArrowLeftIcon, PencilIcon, TrashIcon } from 'lucide-react';

interface ClassItem {
  _id: string;
  namaKelas: string;
  description?: string;
}

interface Student {
  _id: string;
  nis: string;
  nama: string;
  // backend bisa kirim id string atau populated object:
  kelas: string | { _id: string; namaKelas: string };
  jenisKelamin: 'laki-laki' | 'perempuan';
  createdAt?: string;
  updatedAt?: string;
}

const StudentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modal + form
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas: '', // _id kelas dari dropdown
    jenisKelamin: 'laki-laki' as 'laki-laki' | 'perempuan',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [studentRes, classesRes] = await Promise.all([
          axios.get(`http://localhost:3000/api/getstudent/${id}`),
          axios.get('http://localhost:3000/api/getkelas'),
        ]);

        setStudent(studentRes.data.data);
        setClasses(classesRes.data.data || []);
      } catch (err) {
        console.error('Error fetching student:', err);
        setError('Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getClassName = (kelas: Student['kelas']) => {
    if (kelas && typeof kelas === 'object' && 'namaKelas' in kelas) return kelas.namaKelas;
    if (typeof kelas === 'string') {
      const found = classes.find(c => c._id === kelas);
      return found ? found.namaKelas : kelas; // fallback ID kalau gak ketemu
    }
    return '-';
  };

  const handleOpenUpdateModal = (s: Student) => {
    setSelectedStudent(s);
    setFormData({
      nis: s.nis,
      nama: s.nama,
      kelas: typeof s.kelas === 'string' ? s.kelas : s.kelas?._id || '',
      jenisKelamin: s.jenisKelamin,
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login terlebih dahulu');
        return;
      }
      if (!selectedStudent) return;

      const updateData = {
        ...formData,
        kelas: formData.kelas, // kirim _id kelas
      };

      const response = await axios.put(
        `http://localhost:3000/api/updatestudent/${selectedStudent._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setStudent(response.data.data); // perbarui detail di halaman
        setIsUpdateModalOpen(false);
        setSelectedStudent(null);
        alert('Student berhasil diupdate');
      } else {
        alert(`Gagal mengupdate student: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat mengupdate student');
      }
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login terlebih dahulu');
        return;
      }

      const response = await axios.delete(
        `http://localhost:3000/api/deletestudent/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('Student berhasil dihapus');
        // Redirect manual: balik ke list student
        window.location.href = '/students';
      } else {
        alert(`Gagal menghapus student: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat menghapus student');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && <div className="lg:block hidden md:block"><Sidebar /></div>}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="Student Details" onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && <div className="lg:block hidden md:block"><Sidebar /></div>}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="Student Details" onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-red-500">{error || 'Student not found'}</p>
              <Link to="/students" className="text-blue-500 hover:underline mt-4 inline-block">
                Back to Student List
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
      {/* Sidebar */}
      {sidebarOpen && <div className="lg:block hidden md:block"><Sidebar /></div>}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar pageTitle="Student Details" onToggleSidebar={toggleSidebar} />

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <Link to="/students" className="mr-3 text-blue-500 hover:text-blue-700">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <UsersIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Student Details</h1>

            <button
              onClick={() => handleOpenUpdateModal(student)}
              className="ml-auto flex items-center text-green-500 hover:text-green-700"
            >
              <PencilIcon className="h-5 w-5 mr-1" />
              Update
            </button>

            <button
              onClick={() => handleDeleteStudent(student._id)}
              className="ml-3 flex items-center text-red-500 hover:text-red-700"
            >
              <TrashIcon className="h-5 w-5 mr-1" />
              Delete
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Basic Information
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">NIS</label>
                    <p className="mt-1 text-sm text-gray-900">{student.nis}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Nama</label>
                    <p className="mt-1 text-sm text-gray-900">{student.nama}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Kelas</label>
                    <p className="mt-1 text-sm text-gray-900">{getClassName(student.kelas)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Jenis Kelamin</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{student.jenisKelamin}</p>
                  </div>
                </div>

                {/* Additional Information (kosongin/expand sesuai kebutuhan) */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Additional Information
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Catatan</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">-</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 pt-4 border-t">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">System Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(student.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(student.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Update Modal */}
      {isUpdateModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Update Student</h2>
              <form onSubmit={handleUpdateSubmit}>
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
                        {k.namaKelas}
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
                      onClick={() => setIsUpdateModalOpen(false)}
                      className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Update Student
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetailPage;
