import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import JournalTable from '../components/JournalTable';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { BookOpenIcon } from 'lucide-react';

// === Export/Print deps ===
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
} from 'docx';
import { saveAs } from 'file-saver';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';

interface UserLite {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
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
  kodeMapel?: string;
}

interface SiswaLite {
  _id: string;
  nis: string;
  nama: string;
  kelas: string | KelasLite;
  jenisKelamin: 'laki-laki' | 'perempuan';
}

interface Journal {
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

// ====== helpers label & format ======
const labelGuru = (g: Journal['guru']) => {
  if (!g) return '—';
  if (typeof g === 'string') return g;
  return g.namaLengkap || g.name || g.username || g.email || g._id;
};
const labelKelas = (k: Journal['kelas']) => (k ? (typeof k === 'string' ? k : (k.namaKelas || k._id)) : '—');
const labelMapel = (m: Journal['mapel']) => (m ? (typeof m === 'string' ? m : (m.namaMapel || m._id)) : '—');
const labelSiswaArr = (arr?: Array<string | SiswaLite>) =>
  !arr || arr.length === 0 ? '—' : arr.map(s => (typeof s === 'string' ? s : (s.nama || s._id))).join(', ');
const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const opts: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  };
  return new Date(iso).toLocaleDateString('id-ID', opts);
};

// ====== komponen detail untuk print full ======
const DetailPrintView = ({ items }: { items: Journal[] }) => (
  <div className="p-6">
    {items.map((j, idx) => (
      <div key={j._id} className="mb-6 border-b pb-6" style={{ pageBreakInside: 'avoid' }}>
        <h2 className="text-lg font-semibold mb-2">Jurnal {idx + 1}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><h3 className="font-medium text-gray-700 mb-1">Guru</h3><p>{labelGuru(j.guru)}</p></div>
          <div><h3 className="font-medium text-gray-700 mb-1">Kelas</h3><p>{labelKelas(j.kelas)}</p></div>
          <div><h3 className="font-medium text-gray-700 mb-1">Mapel</h3><p>{labelMapel(j.mapel)}</p></div>
          <div><h3 className="font-medium text-gray-700 mb-1">Jam Pelajaran</h3><p>{j.jamPelajaran}</p></div>

          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-700 mb-1">Materi</h3>
            <p className="whitespace-pre-wrap">{j.materi || '—'}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-700 mb-1">Catatan</h3>
            <p className="whitespace-pre-wrap">{j.catatan || '—'}</p>
          </div>

          <div><h3 className="font-medium text-gray-700 mb-1">Tidak Hadir</h3><p>{labelSiswaArr(j.siswaTidakHadir)}</p></div>
          <div><h3 className="font-medium text-gray-700 mb-1">Izin</h3><p>{labelSiswaArr(j.siswaIzin)}</p></div>
          <div><h3 className="font-medium text-gray-700 mb-1">Sakit</h3><p>{labelSiswaArr(j.siswaSakit)}</p></div>

          <div><h3 className="font-medium text-gray-700 mb-1">Created At</h3><p>{fmtDate(j.createdAt)}</p></div>
          <div><h3 className="font-medium text-gray-700 mb-1">Last Updated</h3><p>{fmtDate(j.updatedAt)}</p></div>
        </div>
      </div>
    ))}
  </div>
);

const JournalListingPage = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [classes, setClasses] = useState<KelasLite[]>([]);
  const [mapels, setMapels] = useState<MapelLite[]>([]);
  const [students, setStudents] = useState<SiswaLite[]>([]);
  const [gurus, setGurus] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [selectedGuru, setSelectedGuru] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

  // print
  const [printMode, setPrintMode] = useState<'table' | 'detail'>('table');
  const printRef = useRef<HTMLDivElement>(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);       // NEW: akan direfresh saat filter guru berubah
  const pageSize = 10;

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

  // siswa sesuai kelas yg dipilih
  const filteredStudents = useMemo(() => {
    if (!formData.kelas) return [];
    const kelas = classes.find(k => k._id === formData.kelas);
    if (!kelas || !kelas.siswa || kelas.siswa.length === 0) return [];
    const allowed = new Set(kelas.siswa);
    return students.filter(s => allowed.has(s._id));
  }, [formData.kelas, classes, students]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [clsRes, mpRes, jrRes, stdRes, guruRes] = await Promise.all([
        axios.get('http://localhost:3000/api/getkelas'),
        axios.get('http://localhost:3000/api/getmapels'),
        axios.get('http://localhost:3000/api/getjurnal'),
        axios.get('http://localhost:3000/api/getstudents'),
        axios.get('http://localhost:3000/api/getusers?role=guru').catch(() => ({ data: { data: [] } })),
      ]);

      setClasses(clsRes.data.data || []);
      setMapels(mpRes.data.data || []);
      setJournals(jrRes.data.data || []);
      setStudents(stdRes.data.data || []);
      setGurus(guruRes.data.data || []);
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil data jurnal/kelas/mapel/siswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'kelas') {
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Anda harus login terlebih dahulu');

      const payload = {
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

      const res = await axios.post('http://localhost:3000/api/addjurnal', payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (res.data.success) {
        setJournals(prev => [...prev, res.data.data]);
        setIsCreateModalOpen(false);
        setFormData({
          guru: '',
          kelas: '',
          mapel: '',
          jamPelajaran: 1,
          materi: '',
          siswaTidakHadir: [],
          siswaIzin: [],
          siswaSakit: [],
          catatan: '',
        });
        // NEW: setelah create, auto set filter ke guru yang dipilih biar langsung kelihatan
        if (payload.guru) {
          setSelectedGuru(payload.guru);
          setCurrentPage(1);
        }
        alert('Jurnal berhasil dibuat');
      } else {
        alert(`Gagal membuat jurnal: ${res.data.message}`);
      }
    } catch (error) {
      console.error('Error creating jurnal:', error);
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message || error.message;
        alert(`Error: ${msg}`);
      } else {
        alert('Terjadi kesalahan saat membuat jurnal');
      }
    }
  };

  const handleOpenUpdateModal = (j: Journal) => {
    setSelectedJournal(j);
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
      if (!token) return alert('Anda harus login terlebih dahulu');
      if (!selectedJournal) return;

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

      const res = await axios.put(
        `http://localhost:3000/api/updatejurnal/${selectedJournal._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (res.data.success) {
        setJournals(prev => prev.map(j => j._id === selectedJournal._id ? res.data.data : j));
        setIsUpdateModalOpen(false);
        setSelectedJournal(null);
        setFormData({
          guru: '',
          kelas: '',
          mapel: '',
          jamPelajaran: 1,
          materi: '',
          siswaTidakHadir: [],
          siswaIzin: [],
          siswaSakit: [],
          catatan: '',
        });
        alert('Jurnal berhasil diperbarui');
      } else {
        alert(`Gagal memperbarui jurnal: ${res.data.message}`);
      }
    } catch (error) {
      console.error('Error updating jurnal:', error);
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message || error.message;
        alert(`Error: ${msg}`);
      } else {
        alert('Terjadi kesalahan saat memperbarui jurnal');
      }
    }
  };

// helper untuk mendapatkan nama guru
const guruLabel = (u?: UserLite | null) =>
  u ? (u.namaLengkap || u.name || u.username || u.email || u._id) : '';

const guruOptions = useMemo(() => {
  // Kumpulkan ID guru yang memang muncul di journals
  const ids = new Set<string>();
  const labelFromJournal = new Map<string, string>(); // kalau kebetulan populated
  for (const j of journals) {
    const id = typeof j.guru === 'string' ? j.guru : j.guru?._id;
    if (!id) continue;
    ids.add(id);
    if (typeof j.guru !== 'string') {
      labelFromJournal.set(id, guruLabel(j.guru));
    }
  }

  // Buat index id → label dari daftar 'gurus'
  const labelById = new Map<string, string>();
  for (const g of gurus) {
    labelById.set(g._id, guruLabel(g));
  }

  const opts = Array.from(ids).map((id) => ({
    id,
    label: labelFromJournal.get(id) || labelById.get(id) || id,
  }));

  return opts.sort((a, b) =>
    a.label.localeCompare(b.label, 'id', { sensitivity: 'base' })
  );
}, [journals, gurus]);


  // sort: guru ASC → kelas ASC → jamPelajaran ASC
  const sortedJournals = useMemo(() => {
    const lg = (g: Journal['guru']) =>
      typeof g === 'string' ? g : (g?.name || g?.username || g?.email || g?._id || '');
    const lk = (k: Journal['kelas']) =>
      typeof k === 'string' ? k : (k?.namaKelas || k?._id || '');

    return [...journals].sort((a, b) => {
      const ga = lg(a.guru).toLowerCase();
      const gb = lg(b.guru).toLowerCase();
      if (ga < gb) return -1;
      if (ga > gb) return 1;

      const ka = lk(a.kelas).toLowerCase();
      const kb = lk(b.kelas).toLowerCase();
      if (ka < kb) return -1;
      if (ka > kb) return 1;

      return a.jamPelajaran - b.jamPelajaran;
    });
  }, [journals]);

  // filter by selectedGuru — PENTING: ini yang dipakai untuk pagination (lihat dataSource di bawah)
  const viewJournals = useMemo(() => {
    if (!selectedGuru) return sortedJournals;
    return sortedJournals.filter(j => {
      const id = typeof j.guru === 'string' ? j.guru : j.guru?._id;
      return id === selectedGuru;
    });
  }, [sortedJournals, selectedGuru]);

  // >>> NEW: reset page ke 1 kalau filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGuru]);

  // ===== EXPORT / PRINT (FULL dari DB, abaikan filter) =====
  const handlePrintFull = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Jurnal Detail',
    onBeforePrint: () => setPrintMode('detail'),
    onAfterPrint: () => setPrintMode('table'),
  });

  const handleExportPDFFull = () => {
    // CHANGED: kalau user sedang filter, kasih opsi export yang terfilter juga (seperti jadwal code-mu)
    const data = selectedGuru ? viewJournals : journals;
    if (!data.length) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    data.forEach((j, idx) => {
      const rows = [
        ['Guru', labelGuru(j.guru)],
        ['Kelas', labelKelas(j.kelas)],
        ['Mapel', labelMapel(j.mapel)],
        ['Jam Pelajaran', String(j.jamPelajaran)],
        ['Materi', j.materi || '—'],
        ['Catatan', j.catatan || '—'],
        ['Tidak Hadir', labelSiswaArr(j.siswaTidakHadir)],
        ['Izin', labelSiswaArr(j.siswaIzin)],
        ['Sakit', labelSiswaArr(j.siswaSakit)],
        ['Created At', fmtDate(j.createdAt)],
        ['Last Updated', fmtDate(j.updatedAt)],
      ];
      doc.setFontSize(14);
      doc.text(`Jurnal ${idx + 1}`, 40, 40);
      autoTable(doc, {
        startY: 60,
        head: [['Field', 'Value']],
        body: rows,
        styles: { fontSize: 10, cellPadding: 4 },
        theme: 'grid',
        columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 'auto' } },
        margin: { left: 40, right: 40 },
      });
      if (idx < data.length - 1) doc.addPage();
    });

    const suffix = selectedGuru ? `_filtered_${selectedGuru}` : '';
    doc.save(`jurnal_detail${suffix}.pdf`);
  };

  const handleExportWordFull = async () => {
    const data = selectedGuru ? viewJournals : journals;
    if (!data.length) return;

    const sectionsChildren = data.map((j, idx) => {
      const pairs: [string, string][] = [
        ['Guru', labelGuru(j.guru)],
        ['Kelas', labelKelas(j.kelas)],
        ['Mapel', labelMapel(j.mapel)],
        ['Jam Pelajaran', String(j.jamPelajaran)],
        ['Materi', j.materi || '—'],
        ['Catatan', j.catatan || '—'],
        ['Tidak Hadir', labelSiswaArr(j.siswaTidakHadir)],
        ['Izin', labelSiswaArr(j.siswaIzin)],
        ['Sakit', labelSiswaArr(j.siswaSakit)],
        ['Created At', fmtDate(j.createdAt)],
        ['Last Updated', fmtDate(j.updatedAt)],
      ];
      const header = new Paragraph({ children: [new TextRun({ text: `Jurnal ${idx + 1}`, bold: true, size: 28 })] });
      const table = new DocxTable({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: pairs.map(([k, v]) => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k, bold: true })] })] }),
            new TableCell({ children: [new Paragraph(v)] }),
          ],
        })),
      });
      return [header, new Paragraph(' '), table, new Paragraph(' ')];
    }).flat();

    const doc = new Document({ sections: [{ properties: {}, children: sectionsChildren }] });
    const blob = await Packer.toBlob(doc);
    const suffix = selectedGuru ? `_filtered_${selectedGuru}` : '';
    saveAs(blob, `jurnal_detail${suffix}.docx`);
  };

  const handleExportExcelFull = () => {
    const data = selectedGuru ? viewJournals : journals;
    if (!data.length) return;

    const header = [
      'Guru','Kelas','Mapel','Jam Pelajaran',
      'Materi','Catatan','Tidak Hadir','Izin','Sakit',
      'Created At','Last Updated'
    ];

    const rows = data.map(j => ([
      labelGuru(j.guru),
      labelKelas(j.kelas),
      labelMapel(j.mapel),
      j.jamPelajaran,
      j.materi || '—',
      j.catatan || '—',
      labelSiswaArr(j.siswaTidakHadir),
      labelSiswaArr(j.siswaIzin),
      labelSiswaArr(j.siswaSakit),
      fmtDate(j.createdAt),
      fmtDate(j.updatedAt),
    ]));

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jurnal');
    const suffix = selectedGuru ? `_filtered_${selectedGuru}` : '';
    XLSX.writeFile(wb, `jurnal_detail${suffix}.xlsx`);
  };

  // ====== PAGINATION (MENGIKUTI FILTER) — seperti di Jadwal ======
  const dataSource = viewJournals;                                  // NEW: paginasi berdasarkan data yg sudah difilter
  const totalItems = dataSource.length;                              // CHANGED: sebelumnya pakai semua journals
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const pageItems = useMemo(
    () => dataSource.slice(startIndex, endIndex),                    // NEW: slice dari dataSource (filtered)
    [dataSource, startIndex, endIndex]
  );

  // >>> NEW: clamp current page kalau totalPages mengecil (misal setelah filter)
  useEffect(() => {
    setCurrentPage(p => Math.min(p, totalPages));
  }, [totalPages]);

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

    near.forEach(p => { if (p !== 1 && p !== totalPages) add(p); });
    if (near[near.length - 1] && near[near.length - 1] < totalPages - 1) add('…');
    add(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="lg:block hidden md:block">
          <Sidebar />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <Navbar pageTitle="Jurnal" onToggleSidebar={toggleSidebar} />

        <main className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <BookOpenIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Daftar Jurnal</h1>

            {/* Tombol Export/Print */}
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                onClick={handleExportExcelFull}
                disabled={loading || !journals.length}
                className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                title="Export Excel (Full/Filtered)"
              >
                Excel
              </button>
              <button
                onClick={handleExportPDFFull}
                disabled={loading || !journals.length}
                className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                title="Export PDF (Full/Filtered)"
              >
                PDF
              </button>
              <button
                onClick={handleExportWordFull}
                disabled={loading || !journals.length}
                className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                title="Export Word (Full/Filtered)"
              >
                Word
              </button>
              <button
                onClick={handlePrintFull}
                disabled={loading || !journals.length}
                className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                title="Print (Full Detail)"
              >
                Print Full
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Buat Jurnal Baru
          </button>

          {/* Filter Guru */}
          <div className="flex items-center gap-2 mb-4">
            <label htmlFor="guruFilter" className="text-sm text-gray-600">Filter Guru:</label>
            <select
              id="guruFilter"
              value={selectedGuru ?? ''}
              onChange={(e) => setSelectedGuru(e.target.value || null)}
              className="px-3 py-2 border rounded-md text-sm min-w-[220px] max-w-xs"
            >
              <option value="">Semua</option>
              {guruOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            // area yang diprint — saat Print Full akan switch ke DetailPrintView (pakai semua journals)
            <div ref={printRef}>
              {printMode === 'table' ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <JournalTable
                    jurnalList={pageItems}                  
                    onUpdate={handleOpenUpdateModal}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <DetailPrintView items={journals} />
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Buat Jurnal Baru</h2>
                <form onSubmit={handleCreateSubmit}>
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

                    {/* Multi select siswa */}
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

                  <div className="border-t p-4 bg-gray-50 mt-4">
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
                        Create Jurnal
                      </button>
                    </div>
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}

        {/* UPDATE MODAL */}
        {isUpdateModalOpen && selectedJournal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Update Jurnal</h2>
                <form onSubmit={handleUpdateSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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

                    {/* Multi select siswa */}
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

                  <div className="border-t p-4 bg-gray-50 mt-4">
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
    </div>
  );
};

export default JournalListingPage;
