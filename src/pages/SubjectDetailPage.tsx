import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { UsersIcon, ArrowLeftIcon, PencilIcon, TrashIcon } from 'lucide-react';

interface Mapel {
  _id: string;
  kodeMapel: string;
  namaMapel: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

const MapelDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [mapel, setMapel] = useState<Mapel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modal + form
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMapel, setSelectedMapel] = useState<Mapel | null>(null);
  const [formData, setFormData] = useState({
    kodeMapel: '',
    namaMapel: '',
    description: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // asumsi endpoint mengembalikan 1 mapel berdasarkan id
        const subjectResponse = await axios.get(`http://localhost:3000/api/getmapel/${id}`);
        setMapel(subjectResponse.data.data);
      } catch (err) {
        console.error('Error fetching mapel:', err);
        setError('Failed to load subject data');
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenUpdateModal = (m: Mapel) => {
    setSelectedMapel(m);
    setFormData({
      kodeMapel: m.kodeMapel,
      namaMapel: m.namaMapel,
      description: m.description || '',
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
      if (!selectedMapel) return;

      const updateData = {
        ...formData,
        _id: selectedMapel._id,
      };

      const response = await axios.put(
        `http://localhost:3000/api/updatemapel/${selectedMapel._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setMapel(response.data.data); // perbarui detail di halaman
        setIsUpdateModalOpen(false);
        setSelectedMapel(null);
        alert('Mapel berhasil diupdate');
      } else {
        alert(`Gagal mengupdate mapel: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error updating mapel:', error);
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat mengupdate mapel');
      }
    }
  };

  const handleDeleteMapel = async (mapelId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login terlebih dahulu');
        return;
      }

      const response = await axios.delete(
        `http://localhost:3000/api/deletemapel/${mapelId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('Mapel berhasil dihapus');
        // Redirect manual: balik ke list mapel
        window.location.href = '/subjects';
      } else {
        alert(`Gagal menghapus mapel: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error deleting mapel:', error);
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat menghapus mapel');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && (
          <div className="lg:block hidden md:block">
            <Sidebar />
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="Mapel Details" onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !mapel) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && (
          <div className="lg:block hidden md:block">
            <Sidebar />
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="Mapel Details" onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-red-500">{error || 'Mapel not found'}</p>
              <Link to="/mapels" className="text-blue-500 hover:underline mt-4 inline-block">
                Back to Mapel List
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
      {sidebarOpen && (
        <div className="lg:block hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar pageTitle="Mapel Details" onToggleSidebar={toggleSidebar} />

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <Link to="/subjects" className="mr-3 text-blue-500 hover:text-blue-700">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <UsersIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Detail Mata Pelajaran</h1>

            <button
              onClick={() => handleOpenUpdateModal(mapel)}
              className="ml-auto flex items-center text-green-500 hover:text-green-700"
            >
              <PencilIcon className="h-5 w-5 mr-1" />
              Update
            </button>

            <button
              onClick={() => handleDeleteMapel(mapel._id)}
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
                    <label className="block text-sm font-medium text-gray-500">Kode Mapel</label>
                    <p className="mt-1 text-sm text-gray-900">{mapel.kodeMapel}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Nama Mapel</label>
                    <p className="mt-1 text-sm text-gray-900">{mapel.namaMapel}</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Additional Information
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                      {mapel.description || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 pt-4 border-t">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">System Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(mapel.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(mapel.updatedAt)}</p>
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
      {isUpdateModalOpen && selectedMapel && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Update Mapel</h2>
              <form onSubmit={handleUpdateSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Kode Mapel*</label>
                  <input
                    type="text"
                    name="kodeMapel"
                    value={formData.kodeMapel}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Nama Mapel*</label>
                  <input
                    type="text"
                    name="namaMapel"
                    value={formData.namaMapel}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
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
                      Update Mapel
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

export default MapelDetailPage;
