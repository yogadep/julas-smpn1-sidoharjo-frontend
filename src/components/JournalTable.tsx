// src/components/JurnalTable.tsx
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import Table from './Table';

interface KelasLite {
  _id: string;
  namaKelas: string;
}

interface MapelLite {
  _id: string;
  namaMapel: string;
}

interface UserLite {
  _id: string;
  namaLengkap?: string;
  username?: string;
  email?: string;
}

interface SiswaLite {
  _id: string;
  nama: string;
}

interface Jurnal {
  _id: string;
  guru: string | UserLite;                 // ref User (guru)
  kelas: string | KelasLite;               // ref Kelas
  mapel: string | MapelLite;               // ref Mapel
  jamPelajaran: number;
  materi?: string;
  siswaTidakHadir?: Array<string | SiswaLite>;
  siswaIzin?: Array<string | SiswaLite>;
  siswaSakit?: Array<string | SiswaLite>;
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface JurnalTableProps {
  jurnalList: Jurnal[];
  classes?: KelasLite[];     // buat resolve label kalau backend kirim ID
  mapels?: MapelLite[];      // idem
  gurus?: UserLite[];        // optional, kalau mau resolve guru dari cache
  students?: SiswaLite[];    // optional, fallback nama siswa dari cache
  onUpdate?: (jurnal: Jurnal) => void; // optional
}

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('id-ID') : '—');

const JurnalTable = ({
  jurnalList,
  classes = [],
  mapels = [],
  gurus = [],
  students = [],
  onUpdate,
}: JurnalTableProps) => {
 
  const classNameById = useMemo(() => {
    const m = new Map<string, string>();
    classes.forEach(c => m.set(c._id, c.namaKelas));
    return m;
  }, [classes]);

  const mapelNameById = useMemo(() => {
    const m = new Map<string, string>();
    mapels.forEach(mp => m.set(mp._id, mp.namaMapel));
    return m;
  }, [mapels]);

  const guruNameById = useMemo(() => {
    const m = new Map<string, string>();
    gurus.forEach(g => m.set(g._id, g.namaLengkap || g.username || g.email || g._id));
    return m;
  }, [gurus]);

  const siswaNameById = useMemo(() => {
    const m = new Map<string, string>();
    students.forEach(s => m.set(s._id, s.nama));
    return m;
  }, [students]);

  // helpers label (tanpa any)
  const guruLabel = (guru: Jurnal['guru']) => {
    if (!guru) return '—';
    if (typeof guru === 'string') return guruNameById.get(guru) ?? guru;
    return guru.namaLengkap|| guru.username || guru.email || guru._id;
  };

  const kelasLabel = (kelas: Jurnal['kelas']) => {
    if (!kelas) return '—';
    if (typeof kelas === 'string') return classNameById.get(kelas) ?? kelas;
    return kelas.namaKelas || kelas._id;
  };

  const mapelLabel = (mapel: Jurnal['mapel']) => {
    if (!mapel) return '—';
    if (typeof mapel === 'string') return mapelNameById.get(mapel) ?? mapel;
    return mapel.namaMapel || mapel._id;
  };

  const siswaArrayLabel = (arr?: Jurnal['siswaTidakHadir']) => {
    if (!arr || arr.length === 0) return '—';
    return arr
      .map(item =>
        typeof item === 'string'
          ? (siswaNameById.get(item) ?? item)
          : (item.nama || item._id)
      )
      .join(', ');
  };

  return (
    <Table headers={['Guru', 'Kelas', 'Mapel', 'Jam', 'Materi', 'Created', 'Updated', 'Actions']}>
      {jurnalList.map((j) => (
        <tr key={j._id}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{guruLabel(j.guru)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kelasLabel(j.kelas)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mapelLabel(j.mapel)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{j.jamPelajaran}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{j.materi || '—'}</td>
          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{siswaArrayLabel(j.siswaTidakHadir)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{siswaArrayLabel(j.siswaIzin)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{siswaArrayLabel(j.siswaSakit)}</td> */}
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmt(j.createdAt)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmt(j.updatedAt)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <Link to={`/journal/${j._id}`} className="text-blue-500 hover:text-blue-700 mr-3">
              Detail
            </Link>
            {onUpdate && (
              <button
                onClick={() => onUpdate(j)}
                className="text-green-500 hover:text-green-700"
              >
                Update
              </button>
            )}
          </td>
        </tr>
      ))}
    </Table>
  );
};

export default JurnalTable;
