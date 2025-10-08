import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import UserTable from '../components/UserTable';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { UsersIcon } from 'lucide-react';

interface User {
    _id: string;
    username: string;
    namaLengkap: string;
    role: string;
    email: string;
    nip?: string;
    alamat?: string;
    mataPelajaran: string[];
    kelasYangDiampu: string[];
    createdAt: string;
    updatedAt: string;
}

interface Mapel {
  _id: string;
  kodeMapel: string;
  namaMapel: string;
  description?: string;
}

// const [mapels, setMapels] = useState<Mapel[]>([]);

const UserListingPage = () => {
  const [users, setUsers] = useState<User[]>([]);
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
        const response = await axios.get('https://julas-smpn1-sidoharjo-backend.vercel.app/api/getusers');
        setUsers(response.data.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const [formData, setFormData] = useState({
    username: '',
    password: '', // Ditambahkan karena required di schema
    namaLengkap: '',
    role: 'guru', // Default value
    email: '',
    nip: '',
    alamat: '',
    mataPelajaran: [] as string[],
    kelasYangDiampu: [] as string[]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value 
    }));
  };

  const handleMataPelajaranChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setFormData(prev => ({
      ...prev,
      mataPelajaran: selectedValues
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
        // Jika backend mengharapkan ID untuk mataPelajaran, sesuaikan disini
        mataPelajaran: formData.mataPelajaran.map(mp => mp), // atau format lain sesuai kebutuhan
        kelasYangDiampu: [] // tambahkan jika diperlukan
      };
  
      console.log('Data yang akan dikirim:', requestData); // Debug log
  
      const response = await axios.post('https://julas-smpn1-sidoharjo-backend.vercel.app/api/adduser', requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
  
      console.log('Response:', response.data); // Debug log
  
      if (response.data.success) {
        setUsers([...users, response.data.data]);
        setIsCreateModalOpen(false);
        setFormData({ 
          username: '',
          password: '',
          namaLengkap: '',
          role: 'guru',
          email: '',
          nip: '',
          alamat: '',
          mataPelajaran: [],
          kelasYangDiampu: []
        });
        // Tambahkan notifikasi sukses
        alert('User berhasil dibuat');
      } else {
        // Tampilkan pesan error dari backend
        alert(`Gagal membuat user: ${response.data.message}`);
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

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token tidak ditemukan');
        alert('Anda harus login terlebih dahulu');
        return;
      }
  
      if (!selectedUser) return;
  
      // Format data untuk update (password tidak wajib di update)
      const updateData = {
        ...formData,
        _id: selectedUser._id, // Pastikan ID ikut terkirim
        password: formData.password || undefined, // Hanya kirim jika diisi
        mataPelajaran: formData.mataPelajaran,
        kelasYangDiampu: formData.kelasYangDiampu
      };
  
      const response = await axios.put(
        `https://julas-smpn1-sidoharjo-backend.vercel.app/api/updateuser/${selectedUser._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.success) {
        setUsers(users.map(user => 
          user._id === selectedUser._id ? response.data.data : user
        ));
        setIsUpdateModalOpen(false);
        setSelectedUser(null);
        alert('User berhasil diupdate');
      } else {
        alert(`Gagal mengupdate user: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat mengupdate user');
      }
    }
  };

  // ====== DATA YANG DITAMPILKAN DI TABEL ======
  const viewUsers = users;

  // ====== PAGINATION COMPUTATION ======
  const totalItems = viewUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const pageItems = useMemo(
    () => viewUsers.slice(startIndex, endIndex),
    [viewUsers, startIndex, endIndex]
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

  const handleOpenUpdateModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // Biarkan kosong, optional untuk update
      namaLengkap: user.namaLengkap,
      role: user.role,
      email: user.email,
      nip: user.nip || '',
      alamat: user.alamat || '',
      mataPelajaran: user.mataPelajaran,
      kelasYangDiampu: user.kelasYangDiampu
    });
    setIsUpdateModalOpen(true);
  };
  

  const handleDeleteData = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token tidak ditemukan');
        alert('Anda harus login terlebih dahulu');
        return;
      }
  
      const response = await axios.delete(`https://julas-smpn1-sidoharjo-backend.vercel.app/api/deleteuser/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.data.success) {
        setUsers(users.filter(user => user._id !== userId));
        alert('User berhasil dihapus');
      } else {
        alert(`Gagal menghapus user: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat menghapus user');
      }
    }
  };

  const fetchMapels = async () => {
    try {
      const response = await axios.get('https://julas-smpn1-sidoharjo-backend.vercel.app/api/getmapels');
      setMapels(response.data.data);
    } catch (error) {
      console.error('Error fetching mapels:', error);
      alert('Gagal mengambil data mata pelajaran');
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchMapels();
      // Anda bisa tambahkan fetch lainnya di sini
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
            <h1 className="text-2xl font-bold text-gray-800">Daftar Pegawai</h1>
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
              Create New User
            </button>
            <br />

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <UserTable 
                users={pageItems}
                onDelete={handleDeleteData}
                onUpdate={handleOpenUpdateModal}
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
                <h2 className="text-xl font-bold mb-4">Create New User</h2>
                  <form onSubmit={handleCreateSubmit}>
                        {/* Form fields tetap sama seperti sebelumnya */}
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">Username*</label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">Password*</label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">Nama Lengkap*</label>
                          <input
                            type="text"
                            name="namaLengkap"
                            value={formData.namaLengkap}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">Role*</label>
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="guru">Guru</option>
                            <option value="admin">Admin</option>
                            <option value="kepsek">Kepala Sekolah</option>
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">NIP</label>
                          <input
                            type="text"
                            name="nip"
                            value={formData.nip}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">Alamat</label>
                          <textarea
                            name="alamat"
                            value={formData.alamat}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            rows={3}
                          />
                        </div>
                
                      <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Mata Pelajaran</label>
                        <select
                          name="mataPelajaran"
                          multiple
                          value={formData.mataPelajaran}
                          onChange={handleMataPelajaranChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {mapels.map((mapel) => (
                            <option key={mapel._id} value={mapel._id}>
                              {mapel.namaMapel} ({mapel.kodeMapel})
                            </option>
                          ))}
                        </select>
                        <p className="text-sm text-gray-500 mt-1">
                          Gunakan Ctrl untuk memilih multiple
                        </p>
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
                            Create User
                          </button>
                      </div>
                    </div>
                  </form>
              </div>  
            </div>
          </div>
        )}

        {isUpdateModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
              <div className="p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Update User</h2>
                <form onSubmit={handleUpdateSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                      disabled
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Password (Kosongi jika tidak ingin mengubah)</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="********"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Nama Lengkap*</label>
                    <input
                      type="text"
                      name="namaLengkap"
                      value={formData.namaLengkap}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Role*</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="guru">Guru</option>
                      <option value="admin">Admin</option>
                      <option value="kepsek">Kepala Sekolah</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">NIP</label>
                    <input
                      type="text"
                      name="nip"
                      value={formData.nip}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Alamat</label>
                    <textarea
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Kelas Yang Diampu</label>
                    <input
                      type="text"
                      name="kelasYangDiampu"
                      value={formData.kelasYangDiampu.join(', ')}
                      onChange={(e) => setFormData({
                        ...formData,
                        kelasYangDiampu: e.target.value.split(',').map(item => item.trim())
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Pisahkan dengan koma (contoh: X IPA 1, X IPA 2)"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Mata Pelajaran</label>
                    <select
                      name="mataPelajaran"
                      multiple
                      value={formData.mataPelajaran}
                      onChange={handleMataPelajaranChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {mapels.map((mapel) => (
                        <option key={mapel._id} value={mapel._id}>
                          {mapel.namaMapel} ({mapel.kodeMapel})
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Gunakan Ctrl untuk memilih multiple
                    </p>
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