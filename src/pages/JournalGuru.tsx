import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import JournalTable from '../components/JournalTableGuru';
import Navbar from '../components/Navbar';
import Sidebar from '../components/SidebarGuru';
import Footer from '../components/Footer';
import { BookOpenIcon } from 'lucide-react';

// Export/Print deps
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

const getMe = (): UserLite | null => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
};
const getToken = () => localStorage.getItem('token') || '';

// ===== Helpers =====
const labelGuru = (g: Journal['guru']) => {
  if (!g) return '—';
  if (typeof g === 'string') return g;
  return g.namaLengkap || g.name || g.username || g.email || g._id;
};
const labelKelas = (k: Journal['kelas']) => {
  if (!k) return '—';
  return typeof k === 'string' ? k : (k.namaKelas || k._id);
};
const labelMapel = (m: Journal['mapel']) => {
  if (!m) return '—';
  return typeof m === 'string' ? m : (m.namaMapel || m._id);
};
const labelSiswaArr = (arr?: Array<string | SiswaLite>) => {
  if (!arr || arr.length === 0) return '—';
  return arr.map(s => (typeof s === 'string' ? s : (s.nama || s._id))).join(', ');
};
const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const opts: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  };
  return new Date(iso).toLocaleDateString('id-ID', opts);
};

// ===== View detail (untuk Print Full) =====
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

  // print
  const [printMode, setPrintMode] = useState<'table' | 'detail'>('table');
  const printRef = useRef<HTMLDivElement>(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

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

  const filteredStudents = useMemo(() => {
    if (!formData.kelas) return [];
    const kelas = classes.find(k => k._id === formData.kelas);
    if (!kelas || !kelas.siswa || kelas.siswa.length === 0) return [];
    const allowed = new Set(kelas.siswa);
    return students.filter(s => allowed.has(s._id));
  }, [formData.kelas, classes, students]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const fetchAll = async (userId: string) => {
    setLoading(true);
    try {
      const [clsRes, mpRes, jrRes, stdRes] = await Promise.all([
        axios.get('https://julas-smpn1-sidoharjo-backend.vercel.app/api/getkelas'),
        axios.get('https://julas-smpn1-sidoharjo-backend.vercel.app/api/getmapels'),
        axios.get(`https://julas-smpn1-sidoharjo-backend.vercel.app/api/getjurnalbyguru/${userId}`),
        axios.get('https://julas-smpn1-sidoharjo-backend.vercel.app/api/getstudents'),
      ]);

      setClasses(clsRes.data.data || []);
      setMapels(mpRes.data.data || []);
      setJournals(jrRes.data.data || []);
      setStudents(stdRes.data.data || []);
      setGurus([]);
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil data jurnal/kelas/mapel/siswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const me = getMe();
    const token = getToken();
    if (!me || !me._id || !token) {
      window.location.href = '/login';
      return;
    }
    setFormData(prev => ({ ...prev, guru: me._id }));
    fetchAll(me._id);

    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // reset ke halaman 1 kalau dataset berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [journals]);

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
      const token = getToken();
      const me = getMe();
      if (!token || !me?._id) return alert('Anda harus login terlebih dahulu');

      const payload = {
        guru: me._id,
        kelas: formData.kelas,
        mapel: formData.mapel,
        jamPelajaran: Number(formData.jamPelajaran),
        materi: formData.materi || undefined,
        siswaTidakHadir: formData.siswaTidakHadir,
        siswaIzin: formData.siswaIzin,
        siswaSakit: formData.siswaSakit,
        catatan: formData.catatan || undefined,
      };

      const res = await axios.post('https://julas-smpn1-sidoharjo-backend.vercel.app/api/addjurnal', payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (res.data.success) {
        setJournals(prev => [...prev, res.data.data]);
        setIsCreateModalOpen(false);
        setFormData({
          guru: me._id,
          kelas: '',
          mapel: '',
          jamPelajaran: 1,
          materi: '',
          siswaTidakHadir: [],
          siswaIzin: [],
          siswaSakit: [],
          catatan: '',
        });
        alert('Jurnal berhasil dibuat');
      } else {
        alert(`Gagal membuat jurnal: ${res.data.message}`);
      }
    } catch (error) {
      console.error('Error creating jurnal:', error);
      alert('Terjadi kesalahan saat membuat jurnal');
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
      const token = getToken();
      const me = getMe();
      if (!token || !me?._id) return alert('Anda harus login terlebih dahulu');
      if (!selectedJournal) return;

      const updateData = {
        guru: me._id,
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
        `https://julas-smpn1-sidoharjo-backend.vercel.app/api/updatejurnal/${selectedJournal._id}`,
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
      alert('Terjadi kesalahan saat memperbarui jurnal');
    }
  };

  // ====== DATA YANG DITAMPILKAN DI TABEL ======
  const viewJournals = journals;

  // ====== PAGINATION COMPUTATION ======
  const totalItems = viewJournals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const pageItems = useMemo(
    () => viewJournals.slice(startIndex, endIndex),
    [viewJournals, startIndex, endIndex]
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

  // ===== PRINT/EXPORT FULL =====
  const handlePrintFull = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Jurnal Detail',
    onBeforePrint: () => setPrintMode('detail'),
    onAfterPrint: () => setPrintMode('table'),
  });

  const handleExportPDFFull = () => {
    if (!viewJournals.length) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    viewJournals.forEach((j, idx) => {
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
      if (idx < viewJournals.length - 1) doc.addPage();
    });

    doc.save('jurnal_detail.pdf');
  };

  const handleExportWordFull = async () => {
    if (!viewJournals.length) return;

    const sectionsChildren = viewJournals.map((j, idx) => {
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

      const header = new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: `Jurnal ${idx + 1}`, bold: true, size: 28 })],
      });

      const table = new DocxTable({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: pairs.map(([k, v]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: k, bold: true })] })],
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [new Paragraph(v)],
              }),
            ],
          })
        ),
      });

      return [header, new Paragraph(' '), table, new Paragraph(' ')];
    }).flat();

    const doc = new Document({ sections: [{ properties: {}, children: sectionsChildren }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'jurnal_detail.docx');
  };

  const handleExportExcelFull = () => {
    if (!viewJournals.length) return;

    const rows = viewJournals.map((j) => ({
      'Guru': labelGuru(j.guru),
      'Kelas': labelKelas(j.kelas),
      'Mapel': labelMapel(j.mapel),
      'Jam Pelajaran': j.jamPelajaran,
      'Materi': j.materi || '—',
      'Catatan': j.catatan || '—',
      'Tidak Hadir': labelSiswaArr(j.siswaTidakHadir),
      'Izin': labelSiswaArr(j.siswaIzin),
      'Sakit': labelSiswaArr(j.siswaSakit),
      'Created At': fmtDate(j.createdAt),
      'Last Updated': fmtDate(j.updatedAt),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    const headers = Object.keys(rows[0] || {});
    const colWidths = headers.map(h => ({
      wch: Math.min(
        50,
        Math.max(h.length, ...rows.map(r => (r as any)[h] ? String((r as any)[h]).length : 0)) + 2
      )
    }));
    (ws as any)['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Jurnal');
    XLSX.writeFile(wb, 'jurnal_detail.xlsx');
  };

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
            <h1 className="text-2xl font-bold text-gray-800">Jurnal Listing</h1>

            {/* Export/Print */}
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                onClick={handleExportExcelFull}
                disabled={loading || !viewJournals.length}
                className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 text-gray-700 disabled:opacity-50"
              >
                Excel Full
              </button>
              <button
                onClick={handleExportPDFFull}
                disabled={loading || !viewJournals.length}
                className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 text-gray-700 disabled:opacity-50"
              >
                PDF Full
              </button>
              <button
                onClick={handleExportWordFull}
                disabled={loading || !viewJournals.length}
                className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 text-gray-700 disabled:opacity-50"
              >
                Word Full
              </button>
              <button
                onClick={handlePrintFull}
                disabled={loading || !viewJournals.length}
                className="px-3 py-2 rounded-md bg-white border hover:bg-gray-50 text-gray-700 disabled:opacity-50"
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
            Create New Journal
          </button>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Area yang akan diprint */}
              <div ref={printRef}>
                {printMode === 'table' ? (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <JournalTable
                      jurnalList={pageItems}      // <<<< PAGINATED ITEMS
                      classes={classes}
                      mapels={mapels}
                      gurus={gurus}
                      students={students}
                      onUpdate={handleOpenUpdateModal}
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <DetailPrintView items={viewJournals} />
                  </div>
                )}
              </div>

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
            </>
          )}
        </main>

        <Footer />

        {/* CREATE MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Create New Jurnal</h2>
                <form onSubmit={handleCreateSubmit}>
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
                          handleMultiChange('siswaTidakHadir', Array.from(e.target.selectedOptions).map(o => o.value))
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
                          handleMultiChange('siswaIzin', Array.from(e.target.selectedOptions).map(o => o.value))
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
                          handleMultiChange('siswaSakit', Array.from(e.target.selectedOptions).map(o => o.value))
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
                      <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">
                        Cancel
                      </button>
                      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
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
                          handleMultiChange('siswaTidakHadir', Array.from(e.target.selectedOptions).map(o => o.value))
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
                          handleMultiChange('siswaIzin', Array.from(e.target.selectedOptions).map(o => o.value))
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
                          handleMultiChange('siswaSakit', Array.from(e.target.selectedOptions).map(o => o.value))
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
                      <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">
                        Cancel
                      </button>
                      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
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
