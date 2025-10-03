import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import JadwalTable from '../components/JadwalTableGuru';
import Navbar from '../components/Navbar';
import Sidebar from '../components/SidebarGuru';
import Footer from '../components/Footer';
import { UsersIcon } from 'lucide-react';

type Hari = 'senin'|'selasa'|'rabu'|'kamis'|'jumat'|'sabtu';

interface UserLite {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface KelasLite {
  _id: string;
  namaKelas: string;
}

interface MapelLite {
  _id: string;
  namaMapel: string;
  kodeMapel?: string;
}

interface Jadwal {
  _id: string;
  kelas: string | { _id: string; namaKelas: string };
  hari: Hari;
  jamKe: number;
  mapel?: string | { _id: string; namaMapel: string } | null;
  createdBy?: string | UserLite;        
  updatedBy?: string | UserLite | null; 
  createdAt?: string;
  updatedAt?: string;
}

const hariOpts: Hari[] = ['senin','selasa','rabu','kamis','jumat','sabtu'];

const JadwalListingPage = () => {
  const [jadwals, setJadwals] = useState<Jadwal[]>([]);
  const [classes, setClasses] = useState<KelasLite[]>([]);
  const [mapels, setMapels] = useState<MapelLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    kelas: '',
    hari: 'senin' as Hari,
    jamKe: 1,
    mapel: '', 
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getCurrentUser = (): UserLite | null => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      // const token = localStorage.getItem('token');
      const me = getCurrentUser();
  
      // if (!token || !me?._id) {
      //   // kalau belum login atau user kosong, arahkan ke login
      //   window.location.href = '/login';
      //   return;
      // }
  
      const [clsRes, mpRes, jdRes] = await Promise.all([
        axios.get('http://localhost:3000/api/getkelas'),
        axios.get('http://localhost:3000/api/getmapels'),
        axios.get(`http://localhost:3000/api/getjadwalbyguru/${me._id}`, {
          // headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
  
      setClasses(clsRes.data.data || []);
      setMapels(mpRes.data.data || []);
      setJadwals(jdRes.data.data || []);
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil data jadwal/kelas/mapel');
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
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jamKe' ? Number(value) : (value),
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Anda harus login terlebih dahulu');

      const payload = {
        kelas: formData.kelas,
        hari: formData.hari,
        jamKe: Number(formData.jamKe),
        mapel: formData.mapel ? formData.mapel : null, 
      };

      const res = await axios.post('http://localhost:3000/api/addjadwal', payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (res.data.success) {
        setJadwals(prev => [...prev, res.data.data]);
        setIsCreateModalOpen(false);
        setFormData({ kelas: '', hari: 'senin', jamKe: 1, mapel: '' });
        alert('Jadwal berhasil dibuat');
      } else {
        alert(`Gagal membuat jadwal: ${res.data.message}`);
      }
    } catch (error) {
      console.error('Error creating jadwal:', error);
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message || error.message;
        alert(`Error: ${msg}`);
      } else {
        alert('Terjadi kesalahan saat membuat jadwal');
      }
    }
  };

  const handleOpenUpdateModal = (j: Jadwal) => {
    setSelectedJadwal(j);
    setFormData({
      kelas: typeof j.kelas === 'string' ? j.kelas : j.kelas?._id || '',
      hari: j.hari,
      jamKe: j.jamKe,
      mapel: typeof j.mapel === 'string' ? j.mapel : j.mapel?._id || '',
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Anda harus login terlebih dahulu');

      if(!selectedJadwal) return;

      const updateData = {
        ...formData,
        _id: selectedJadwal._id,
      };

      const res = await axios.put(`http://localhost:3000/api/updatejadwal/${selectedJadwal._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (res.data.success) {
        setJadwals(prev => prev.map(j => j._id === selectedJadwal._id ? res.data.data : j));
        setIsUpdateModalOpen(false);
        setSelectedJadwal(null)
        setFormData({ kelas: '', hari: 'senin', jamKe: 1, mapel: '' });
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
  }

   // ====== DATA YANG DITAMPILKAN DI TABEL ======
   const viewJadwal = jadwals;

   // ====== PAGINATION COMPUTATION ======
   const totalItems = viewJadwal.length;
   const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
   const startIndex = (currentPage - 1) * pageSize;
   const endIndex = Math.min(startIndex + pageSize, totalItems);
 
   const pageItems = useMemo(
     () => viewJadwal.slice(startIndex, endIndex),
     [viewJadwal, startIndex, endIndex]
   );
 
   // builder nomor halaman (maks 7 tombol dengan ellipsis)
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

  const sortKeyHari = (h: Hari) => hariOpts.indexOf(h);
  
  const sortedJadwals = useMemo(() => {
    return [...jadwals].sort((a, b) => {
      const ca = typeof a.createdBy === 'string' 
        ? a.createdBy 
        : a.createdBy?.username || a.createdBy?.name || a.createdBy?.email || '';
      const cb = typeof b.createdBy === 'string' 
        ? b.createdBy 
        : b.createdBy?.username || b.createdBy?.name || b.createdBy?.email || '';
  
      //  createdBy (ASC)
      if (ca.toLowerCase() < cb.toLowerCase()) return -1;
      if (ca.toLowerCase() > cb.toLowerCase()) return 1;
  
      // sort by hariOpts
      const ha = sortKeyHari(a.hari);
      const hb = sortKeyHari(b.hari);
      if (ha !== hb) return ha - hb;
  
      // jam (ASC)
      return a.jamKe - b.jamKe;
    });
  }, [jadwals]);

  const creatorOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const j of jadwals) {
      const id = typeof j.createdBy === 'string' ? j.createdBy : j.createdBy?._id;
      if (!id) continue;
      const label =
        (typeof j.createdBy === 'string')
          ? j.createdBy
          : (j.createdBy?.name || j.createdBy?.username || j.createdBy?.email || j.createdBy?._id);
      if (label) m.set(id, label);
    }
    return Array.from(m, ([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'id', { sensitivity: 'base' }));
  }, [jadwals]);

  const viewJadwals = useMemo(() => {
    if (!selectedCreator) return sortedJadwals;
    return sortedJadwals.filter(j => {
      const id = typeof j.createdBy === 'string' ? j.createdBy : j.createdBy?._id;
      return id === selectedCreator;
    });
  }, [sortedJadwals, selectedCreator]);
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="lg:block hidden md:block">
          <Sidebar />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <Navbar pageTitle="Jadwal" onToggleSidebar={toggleSidebar} />

        <main className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <UsersIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Jadwal Listing</h1>
          </div>

          {/* <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Jadwal
          </button> */}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* <JadwalTable jadwals={sortedJadwals} classes={classes} mapels={mapels} /> */}
              <JadwalTable 
                jadwals={pageItems}
                classes={classes}
                mapels={mapels}
                onUpdate={handleOpenUpdateModal}
              />
            </div>
            
          
          )}
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
                <h2 className="text-xl font-bold mb-4">Create New Jadwal</h2>
                <form onSubmit={handleCreateSubmit}>
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
                        <option key={h} value={h}>{h.charAt(0).toUpperCase()+h.slice(1)}</option>
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
                      {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
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
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Create Jadwal
                      </button>
                    </div>
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}

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
                        <option key={h} value={h}>{h.charAt(0).toUpperCase()+h.slice(1)}</option>
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
                      {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
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
    </div>
  );
};

export default JadwalListingPage;
