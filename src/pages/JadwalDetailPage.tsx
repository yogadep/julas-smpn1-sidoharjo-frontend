import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { CalendarDaysIcon, ArrowLeftIcon, PencilIcon, TrashIcon } from 'lucide-react';

// ==== Types ====

type Hari = 'senin'|'selasa'|'rabu'|'kamis'|'jumat'|'sabtu';

interface UserLite {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
}

interface KelasLite {
  _id: string;
  namaKelas: string;
}

interface MapelLite {
  _id: string;
  namaMapel: string;
}

interface Jadwal {
  _id: string;
  // kelas: string | { _id: string; namaKelas: string };
  kelas: string | KelasLite;
  hari: Hari;
  jamKe: number;
  mapel?: string | { _id: string; namaMapel: string } | null;
  createdBy?: string | UserLite;
  updatedBy?: string | UserLite | null;
  createdAt?: string;
  updatedAt?: string;
}

// ==== Utils ====

const hariOpts: Hari[] = ['senin','selasa','rabu','kamis','jumat','sabtu'];
const uc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const labelKelas = (k?: Jadwal['kelas']) => {
  if (!k) return '—';
  return typeof k === 'string' ? k : (k.namaKelas || k._id);
};

const labelMapel = (m?: Jadwal['mapel']) => {
  if (!m) return '—';
  return typeof m === 'string' ? m : (m.namaMapel || m._id);
};

const labelUser = (u?: string | UserLite | null) => {
  if (!u) return '—';
  if (typeof u === 'string') return u;
  return u.name || u.username || u.email || u._id;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// ==== Component ====

const JadwalDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const [jadwal, setJadwal] = useState<Jadwal | null>(null);
  const [classes, setClasses] = useState<KelasLite[]>([]);
  const [mapels, setMapels] = useState<MapelLite[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modal + form
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [formData, setFormData] = useState({
    kelas: '',
    hari: 'senin' as Hari,
    jamKe: 1,
    mapel: '',
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // detail jadwal
        const jd = await axios.get(`http://localhost:3000/api/getjadwal/${id}`);

        // dropdowns
        const [clsRes, mpRes] = await Promise.all([
          axios.get('http://localhost:3000/api/getkelas'),
          axios.get('http://localhost:3000/api/getmapels'),
        ]);

        setJadwal(jd.data.data);
        setClasses(clsRes.data.data || []);
        setMapels(mpRes.data.data || []);
      } catch (err) {
        console.error('Error fetching jadwal:', err);
        setError('Failed to load jadwal data');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // ==== Update ====

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jamKe' ? Number(value) : value,
    }));
  };

  const handleOpenUpdateModal = (j: Jadwal) => {
    setSelectedJadwal(j);
    setFormData({
      kelas: typeof j.kelas === 'string' ? j.kelas : j.kelas?._id || '',
      hari: j.hari,
      jamKe: j.jamKe,
      mapel: typeof j.mapel === 'string' ? j.mapel : (j.mapel?._id || ''),
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Anda harus login terlebih dahulu');
      if (!selectedJadwal) return;

      const updateData = {
        kelas: formData.kelas,
        hari: formData.hari,
        jamKe: Number(formData.jamKe),
        mapel: formData.mapel || null,
      };

      const res = await axios.put(
        `http://localhost:3000/api/updatejadwal/${selectedJadwal._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (res.data.success) {
        setJadwal(res.data.data);
        setIsUpdateModalOpen(false);
        setSelectedJadwal(null);
        alert('Jadwal berhasil diperbarui');
      } else {
        alert(`Gagal memperbarui jadwal: ${res.data.message}`);
      }
    } catch (error) {
      console.error('Error updating jadwal:', error);
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message || error.message;
        alert(`Error: ${msg}`);
      } else {
        alert('Terjadi kesalahan saat memperbarui jadwal');
      }
    }
  };

  // ==== Delete ====

  const handleDeleteJadwal = async (jadwalId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Anda harus login terlebih dahulu');

      const res = await axios.delete(
        `http://localhost:3000/api/deletejadwal/${jadwalId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert('Jadwal berhasil dihapus');
        window.location.href = '/jadwal';
      } else {
        alert(`Gagal menghapus jadwal: ${res.data.message}`);
      }
    } catch (error) {
      console.error('Error deleting jadwal:', error);
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message || error.message;
        alert(`Error: ${msg}`);
      } else {
        alert('Terjadi kesalahan saat menghapus jadwal');
      }
    }
  };

  // ==== Render ====

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && <div className="lg:block hidden md:block"><Sidebar /></div>}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="Jadwal Details" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !jadwal) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && <div className="lg:block hidden md:block"><Sidebar /></div>}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="Jadwal Details" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-red-500">{error || 'Jadwal not found'}</p>
              <Link to="/jadwal" className="text-blue-500 hover:underline mt-4 inline-block">
                Back to Jadwal List
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
        <Navbar pageTitle="Jadwal Details" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <Link to="/jadwal" className="mr-3 text-blue-500 hover:text-blue-700">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <CalendarDaysIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Jadwal Details</h1>

            <button
              onClick={() => handleOpenUpdateModal(jadwal)}
              className="ml-auto flex items-center text-green-500 hover:text-green-700"
            >
              <PencilIcon className="h-5 w-5 mr-1" />
              Update
            </button>

            <button
              onClick={() => handleDeleteJadwal(jadwal._id)}
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
                    <label className="block text-sm font-medium text-gray-500">Kelas</label>
                    <p className="mt-1 text-sm text-gray-900">{labelKelas(jadwal.kelas)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Hari</label>
                    <p className="mt-1 text-sm text-gray-900">{uc(jadwal.hari)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Jam Ke</label>
                    <p className="mt-1 text-sm text-gray-900">{jadwal.jamKe}</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Additional Information
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mapel</label>
                    <p className="mt-1 text-sm text-gray-900">{labelMapel(jadwal.mapel)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created By</label>
                      <p className="mt-1 text-sm text-gray-900">{labelUser(jadwal.createdBy || null)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Updated By</label>
                      <p className="mt-1 text-sm text-gray-900">{labelUser(jadwal.updatedBy || null)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 pt-4 border-t">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">System Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(jadwal.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(jadwal.updatedAt)}</p>
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
      {isUpdateModalOpen && selectedJadwal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Update Jadwal</h2>
              <form onSubmit={handleUpdateSubmit}>
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
                      <option key={k._id} value={k._id}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Hari*</label>
                  <select
                    name="hari"
                    value={formData.hari}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    {hariOpts.map(h => (
                      <option key={h} value={h}>{uc(h)}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Jam Ke*</label>
                  <select
                    name="jamKe"
                    value={formData.jamKe}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Mapel (opsional)</label>
                  <select
                    name="mapel"
                    value={formData.mapel}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">— Kosong (tidak ada mapel) —</option>
                    {mapels.map(m => (
                      <option key={m._id} value={m._id}>{m.namaMapel}</option>
                    ))}
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
                      Update Jadwal
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

export default JadwalDetailPage;
