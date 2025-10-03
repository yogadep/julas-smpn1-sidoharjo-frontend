import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MapelTable from '../components/MapelTable';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { UsersIcon } from 'lucide-react';


interface Mapel {
  _id: string;
  kodeMapel: string;
  namaMapel: string;
  description?: string;
}

// const [mapels, setMapels] = useState<Mapel[]>([]);

const UserListingPage = () => {
  // const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const [mapels, setMapels] = useState<Mapel[]>([]);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/getmapels');
        setMapels(response.data.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const [formData, setFormData] = useState({
    kodeMapel: '',
    namaMapel: '',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value 
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token tidak ditemukan');
        // Tambahkan feedback ke user
        alert('Anda harus login terlebih dahulu');
        return;
      }
  
      // Format data sesuai dengan yang diharapkan backend
      const requestData = {
        ...formData,
      };
  
      console.log('Data yang akan dikirim:', requestData); 
  
      const response = await axios.post('http://localhost:3000/api/addmapel', requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
  
      console.log('Response:', response.data); 
  
      if (response.data.success) {
        setMapels([...mapels, response.data.data]);
        setIsCreateModalOpen(false);
        setFormData({ 
          kodeMapel: '',
          namaMapel: '',
          description: ''
        });
        // Tambahkan notifikasi sukses
        alert('Mata Pelajaran berhasil dibuat');
      } else {
        // Tampilkan pesan error dari backend
        alert(`Gagal membuat Mata Pelajaran: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      // Tampilkan error ke user
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat membuat user');
      }
    }
  };

  const [selectedMapel, setSelectedMapel] = useState<Mapel | null>(null);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token tidak ditemukan');
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
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.success) {
        setMapels(mapels.map(mapel => 
          mapel._id === selectedMapel._id ? response.data.data : mapel
        ));
        setIsUpdateModalOpen(false);
        setSelectedMapel(null);
        alert('Mata Pelajaran berhasil diupdate');
      } else {
        alert(`Gagal mengupdate Maata Pelajaran: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error updating Maata Pelajaran:', error);
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat mengupdate Mata Pelajaran');
      }
    }
  };

  // ====== DATA YANG DITAMPILKAN DI TABEL ======
  const viewMapels = mapels;

  // ====== PAGINATION COMPUTATION ======
  const totalItems = viewMapels.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const pageItems = useMemo(
    () => viewMapels.slice(startIndex, endIndex),
    [viewMapels, startIndex, endIndex]
  );

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


  const fetchMapels = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/getmapels');
      setMapels(response.data.data);
    } catch (error) {
      console.error('Error fetching mapels:', error);
      alert('Gagal mengambil data mata pelajaran');
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchMapels();
    };
    loadInitialData();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - responsive */}
      {sidebarOpen && (
        <div className="lg:block hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar pageTitle="Users" onToggleSidebar={toggleSidebar} />

        {/* Konten Halaman */}
        <main className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <UsersIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Mapel Listing</h1>
          </div>

          <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Mapel
            </button>
            <br />

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* <UserTable 
                mapels={mapels}
                onDelete={handleDeleteData}
                onUpdate={handleOpenUpdateModal}
              /> */}
              <MapelTable 
                subjects={pageItems}
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

        {/* Footer */}
        <Footer />

        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
              <div className="p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Create New Mapel</h2>
                  <form onSubmit={handleCreateSubmit}>
                        {/* Form fields tetap sama seperti sebelumnya */}
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
                          <label className="block text-gray-700 mb-2">Description*</label>
                          <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
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
                            Create Mapel
                          </button>
                      </div>
                    </div>
                  </form>
              </div>  
            </div>
          </div>
        )}

        {isUpdateModalOpen && selectedMapel && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
              <div className="p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Update User</h2>
                <form onSubmit={handleUpdateSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Kode Mapel</label>
                    <input
                      type="text"
                      name="kodemapel"
                      value={formData.kodeMapel}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                      disabled
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Nama Mapel</label>
                    <input
                      type="text"
                      name="namamapel"
                      value={formData.namaMapel}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Description*</label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled
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
                        Update User
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

export default UserListingPage;