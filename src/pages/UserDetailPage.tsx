import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { UsersIcon, ArrowLeftIcon, PencilIcon, TrashIcon } from 'lucide-react';

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

interface Kelas {
  _id: string;
  namaKelas: string;
  description?: string;
}


const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapels, setMapels] = useState<Mapel[]>([]);
  const [classes, setClasses ] = useState<Kelas[]>([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userResponse, mapelsResponse, classResponse] = await Promise.all([
          axios.get(`http://localhost:3000/api/getuser/${id}`),
          axios.get('http://localhost:3000/api/getmapels'),
          axios.get('http://localhost:3000/api/getkelas'),
        ]);
        
        setUser(userResponse.data.data);
        setMapels(mapelsResponse.data.data);
        setClasses(classResponse.data.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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

  const handleKelasChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setFormData(prev => ({
      ...prev,
      kelasYangDiampu: selectedValues
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value 
    }));
  };

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
        `http://localhost:3000/api/updateuser/${selectedUser._id}`,
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

  const handleDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token tidak ditemukan');
        alert('Anda harus login terlebih dahulu');
        return;
      }
  
      const response = await axios.delete(`http://localhost:3000/api/deleteuser/${userId}`, {
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


  const getMapelName = (id: string) => {
    const mapel = mapels.find(m => m._id === id);
    return mapel ? `${mapel.namaMapel} (${mapel.kodeMapel})` : 'Unknown';
  };

  const getKelasName = (id: string) => {
    const classe = classes.find(c => c._id === id);
    return classe ? `${classe.namaKelas}` : 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <Navbar pageTitle="User Details" onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && (
          <div className="lg:block hidden md:block">
            <Sidebar />
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="User Details" onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-red-500">{error || 'User not found'}</p>
              <Link to="/users" className="text-blue-500 hover:underline mt-4 inline-block">
                Back to User List
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" >
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="lg:block hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar pageTitle="User Details" onToggleSidebar={toggleSidebar} />

        {/* Konten Halaman */}
        <main className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <Link to="/users" className="mr-3 text-blue-500 hover:text-blue-700">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <UsersIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">User Details</h1>
            <Link 
              to="#"
              onClick={() => handleOpenUpdateModal(user)}
              className="ml-auto flex items-center text-green-500 hover:text-green-700"
            >
              <PencilIcon className="h-5 w-5 mr-1" />
              Update
            </Link>
            <Link
              to="#"
              onClick={() => handleDeleteUser(user._id)}
              className="ml-3 flex items-center text-red-500 hover:text-red-700"
            >
              <TrashIcon className="h-5 w-5 mr-1" />
              Delete
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Username</label>
                    <p className="mt-1 text-sm text-gray-900">{user.username}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.namaLengkap}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Role</label>
                    <p className="mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 
                          user.role === 'kepsek' ? 'bg-purple-100 text-purple-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {user.role}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user.email || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">NIP</label>
                    <p className="mt-1 text-sm text-gray-900">{user.nip || '-'}</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Information</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Alamat</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                      {user.alamat || '-'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Kelas Yang Diampu</label>
                    {user.kelasYangDiampu.length > 0 ? (
                      <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                        {user.kelasYangDiampu.map((kelas, index) => (
                          <li key={index}>{getKelasName(kelas)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">-</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mata Pelajaran</label>
                    {user.mataPelajaran.length > 0 ? (
                      <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                        {user.mataPelajaran.map((mapelId, index) => (
                          <li key={index}>{getMapelName(mapelId)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">-</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 pt-4 border-t">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">System Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

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

                  <div className='mb-4'>
                    <label className="block text-gray-700 mb-2">Kelas Yang Diampu</label>
                    <select
                      name="kelasYangDiampu"
                      multiple
                      value={formData.kelasYangDiampu}
                      onChange={handleKelasChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {classes.map((kelas) => (
                        <option key={kelas._id} value={kelas._id}>  
                          {kelas.namaKelas}
                        </option>
                      ))}
                    </select>
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
  );
};

export default UserDetailPage;