import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { BookOpenIcon, ArrowLeftIcon, PencilIcon, TrashIcon } from 'lucide-react';

interface UserLite {
  _id: string;
  namaLengkap?: string;
}
interface KelasLite {
  _id: string;
  namaKelas: string;
  siswa?: string[];
}
interface MapelLite {
  _id: string;
  namaMapel: string;
}
interface SiswaLite {
  _id: string;
  nis: string;
  nama: string;
}

interface Jurnal {
  _id: string;
  guru: string | UserLite;
  kelas: string | KelasLite;
  mapel: string | MapelLite;
  jamPelajaran: number;
  materi?: string;
  siswaTidakHadir?: Array<string | SiswaLite>;
  siswaIzin?: Array<string | SiswaLite>;
  siswaSakit?: Array<string | SiswaLite>;
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

const labelUser = (u?: Jurnal['guru']) => {
  if (!u) return '—';
  return typeof u === 'string' ? u : ( u.namaLengkap ||u._id);
};
const labelKelas = (k?: Jurnal['kelas']) => {
  if (!k) return '—';
  return typeof k === 'string' ? k : (k.namaKelas || k._id);
};
const labelMapel = (m?: Jurnal['mapel']) => {
  if (!m) return '—';
  return typeof m === 'string' ? m : (m.namaMapel || m._id);
};
const labelSiswaArr = (arr?: Array<string | SiswaLite>) => {
  if (!arr || arr.length === 0) return '—';
  return arr.map(s => (typeof s === 'string' ? s : (s.nama || s._id))).join(', ');
};
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const JurnalDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [jurnal, setJurnal] = useState<Jurnal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modal + form
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedJurnal, setSelectedJurnal] = useState<Jurnal | null>(null);

  // dropdown data for update form
  const [gurus, setGurus] = useState<UserLite[]>([]);
  const [classes, setClasses] = useState<KelasLite[]>([]);
  const [mapels, setMapels] = useState<MapelLite[]>([]);
  const [students, setStudents] = useState<SiswaLite[]>([]);

  const [formData, setFormData] = useState({
    guru: '',
    kelas: '',
    mapel: '',
    jamPelajaran: 1,
    materi: '',
    siswaTidakHadir: [] as string[],
    siswaIzin: [] as string[],
    siswaSakit: [] as string[],
    catatan: '',
  });

   // siswa yang boleh dipilih sesuai kelas yang dipilih di form
   const filteredStudents = useMemo(() => {
    if (!formData.kelas) return [];
    const kelas = classes.find(k => k._id === formData.kelas);
    if (!kelas || !kelas.siswa || kelas.siswa.length === 0) return [];
    const allowed = new Set(kelas.siswa);
    return students.filter(s => allowed.has(s._id));
  }, [formData.kelas, classes, students]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // detail jurnal
        const jr = await axios.get(`http://localhost:3000/api/getjurnal/${id}`);

        // dropdowns (kalau endpoint guru khusus ga ada, sesuaikan)
        const [clsRes, mpRes, stdRes, guruRes] = await Promise.all([
          axios.get('http://localhost:3000/api/getkelas'),
          axios.get('http://localhost:3000/api/getmapels'),
          axios.get('http://localhost:3000/api/getstudents'),
          axios.get('http://localhost:3000/api/getusers?role=guru').catch(() => ({ data: { data: [] } })),
        ]);

        setJurnal(jr.data.data);
        setClasses(clsRes.data.data || []);
        setMapels(mpRes.data.data || []);
        setStudents(stdRes.data.data || []);
        setGurus(guruRes.data.data || []);
      } catch (err) {
        console.error('Error fetching jurnal:', err);
        setError('Failed to load journal data');
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
    if(name === 'kelas') {
      const kelasBaru = value;
      const kelasObj = classes.find(k => k._id === kelasBaru);
      const allowed = new Set(kelasObj?.siswa || []);
      const keepIfAllowed = (arr: string[]) => arr.filter(id => allowed.has(id));
      setFormData(prev => ({
        ...prev,
        kelas: kelasBaru,
        siswaTidakHadir: keepIfAllowed(prev.siswaTidakHadir),
        siswaIzin: keepIfAllowed(prev.siswaIzin),
        siswaSakit: keepIfAllowed(prev.siswaSakit),
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jamPelajaran' ? Number(value) : value,
    }));
  };

  const handleMultiChange = (name: 'siswaTidakHadir' | 'siswaIzin' | 'siswaSakit', values: string[]) => {
    setFormData(prev => ({ ...prev, [name]: values }));
  };

  const handleOpenUpdateModal = (j: Jurnal) => {
    setSelectedJurnal(j);
    setFormData({
      guru: typeof j.guru === 'string' ? j.guru : j.guru?._id || '',
      kelas: typeof j.kelas === 'string' ? j.kelas : j.kelas?._id || '',
      mapel: typeof j.mapel === 'string' ? j.mapel : j.mapel?._id || '',
      jamPelajaran: j.jamPelajaran,
      materi: j.materi || '',
      siswaTidakHadir: (j.siswaTidakHadir || []).map(s => (typeof s === 'string' ? s : s._id)),
      siswaIzin: (j.siswaIzin || []).map(s => (typeof s === 'string' ? s : s._id)),
      siswaSakit: (j.siswaSakit || []).map(s => (typeof s === 'string' ? s : s._id)),
      catatan: j.catatan || '',
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
      if (!selectedJurnal) return;

      const updateData = {
        guru: formData.guru,
        kelas: formData.kelas,
        mapel: formData.mapel,
        jamPelajaran: Number(formData.jamPelajaran),
        materi: formData.materi || undefined,
        siswaTidakHadir: formData.siswaTidakHadir,
        siswaIzin: formData.siswaIzin,
        siswaSakit: formData.siswaSakit,
        catatan: formData.catatan || undefined,
      };

      const response = await axios.put(
        `http://localhost:3000/api/updatejurnal/${selectedJurnal._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setJurnal(response.data.data); // perbarui detail di halaman
        setIsUpdateModalOpen(false);
        setSelectedJurnal(null);
        alert('Jurnal berhasil diupdate');
      } else {
        alert(`Gagal mengupdate jurnal: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error updating jurnal:', error);
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat mengupdate jurnal');
      }
    }
  };

  const handleDeleteJurnal = async (jurnalId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login terlebih dahulu');
        return;
      }

      const response = await axios.delete(
        `http://localhost:3000/api/deletejurnal/${jurnalId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Jurnal berhasil dihapus');
        window.location.href = '/journal';
      } else {
        alert(`Gagal menghapus jurnal: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error deleting jurnal:', error);
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Terjadi kesalahan saat menghapus jurnal');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && <div className="lg:block hidden md:block"><Sidebar /></div>}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="Jurnal Details" onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !jurnal) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebarOpen && <div className="lg:block hidden md:block"><Sidebar /></div>}
        <div className="flex-1 flex flex-col">
          <Navbar pageTitle="Jurnal Details" onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-red-500">{error || 'Jurnal not found'}</p>
              <Link to="/journal" className="text-blue-500 hover:underline mt-4 inline-block">
                Back to Jurnal List
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
        <Navbar pageTitle="Jurnal Details" onToggleSidebar={toggleSidebar} />

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <Link to="/journal" className="mr-3 text-blue-500 hover:text-blue-700">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <BookOpenIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Jurnal Details</h1>

            <button
              onClick={() => handleOpenUpdateModal(jurnal)}
              className="ml-auto flex items-center text-green-500 hover:text-green-700"
            >
              <PencilIcon className="h-5 w-5 mr-1" />
              Update
            </button>

            <button
              onClick={() => handleDeleteJurnal(jurnal._id)}
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
                    <label className="block text-sm font-medium text-gray-500">Guru</label>
                    <p className="mt-1 text-sm text-gray-900">{labelUser(jurnal.guru)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Kelas</label>
                    <p className="mt-1 text-sm text-gray-900">{labelKelas(jurnal.kelas)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mapel</label>
                    <p className="mt-1 text-sm text-gray-900">{labelMapel(jurnal.mapel)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Jam Pelajaran</label>
                    <p className="mt-1 text-sm text-gray-900">{jurnal.jamPelajaran}</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Additional Information
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Materi</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                      {jurnal.materi || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Catatan</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                      {jurnal.catatan || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Kehadiran */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Kehadiran</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tidak Hadir</label>
                    <p className="mt-1 text-sm text-gray-900">{labelSiswaArr(jurnal.siswaTidakHadir)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Izin</label>
                    <p className="mt-1 text-sm text-gray-900">{labelSiswaArr(jurnal.siswaIzin)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Sakit</label>
                    <p className="mt-1 text-sm text-gray-900">{labelSiswaArr(jurnal.siswaSakit)}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 pt-4 border-t">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">System Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(jurnal.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(jurnal.updatedAt)}</p>
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
      {isUpdateModalOpen && selectedJurnal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Update Jurnal</h2>
              <form onSubmit={handleUpdateSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Guru*</label>
                    <select
                      name="guru"
                      value={formData.guru}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="" disabled>Pilih guru</option>
                      {gurus.map(g => (
                        <option key={g._id} value={g._id}>
                          {g.name || g.username || g.email || g._id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
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

                  <div>
                    <label className="block text-gray-700 mb-2">Mapel*</label>
                    <select
                      name="mapel"
                      value={formData.mapel}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="" disabled>Pilih mapel</option>
                      {mapels.map(m => (
                        <option key={m._id} value={m._id}>{m.namaMapel}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Jam Pelajaran*</label>
                    <select
                      name="jamPelajaran"
                      value={formData.jamPelajaran}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Materi</label>
                    <input
                      type="text"
                      name="materi"
                      value={formData.materi}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Materi yang diajarkan"
                    />
                  </div>

                  {/* Multiselect Siswa */}
                  <div>
                    <label className="block text-gray-700 mb-2">Siswa Tidak Hadir</label>
                    <select
                      multiple
                      disabled={!formData.kelas}
                      value={formData.siswaTidakHadir}
                      onChange={(e) =>
                        handleMultiChange(
                          'siswaTidakHadir',
                          Array.from(e.target.selectedOptions).map(o => o.value)
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-md min-h-[120px]"
                    >
                      {filteredStudents.map(s => (
                        <option key={s._id} value={s._id}>{s.nama} ({s.nis})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Siswa Izin</label>
                    <select
                      multiple
                      disabled={!formData.kelas}
                      value={formData.siswaIzin}
                      onChange={(e) =>
                        handleMultiChange(
                          'siswaIzin',
                          Array.from(e.target.selectedOptions).map(o => o.value)
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-md min-h-[120px]"
                    >
                      {filteredStudents.map(s => (
                        <option key={s._id} value={s._id}>{s.nama} ({s.nis})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Siswa Sakit</label>
                    <select
                      multiple
                      disabled={!formData.kelas}
                      value={formData.siswaSakit}
                      onChange={(e) =>
                        handleMultiChange(
                          'siswaSakit',
                          Array.from(e.target.selectedOptions).map(o => o.value)
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-md min-h-[120px]"
                    >
                      {filteredStudents.map(s => (
                        <option key={s._id} value={s._id}>{s.nama} ({s.nis})</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Catatan</label>
                    <textarea
                      name="catatan"
                      value={formData.catatan}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Catatan tambahan"
                    />
                  </div>
                </div>

                <div className="border-t p-4 bg-gray-50 sticky bottom-0 mt-4">
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
                      Update Jurnal
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

export default JurnalDetailPage;
