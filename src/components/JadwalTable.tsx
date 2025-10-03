import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import Table from './Table';

type Hari = 'senin'|'selasa'|'rabu'|'kamis'|'jumat'|'sabtu';

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
  username?: string;
  name?: string;
  email?: string;
  role?: string;
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

interface JadwalTableProps {
  jadwals: Jadwal[];
  classes?: KelasLite[]; 
  mapels?: MapelLite[]; 
  onUpdate: (jadwal: Jadwal) => void;
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const JadwalTable = ({ jadwals, classes = [], mapels = [], onUpdate }: JadwalTableProps) => {
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

  // helper function to find class name, mapel name, and user name
  const kelasLabel = (kelas: Jadwal['kelas']) => {
    if (kelas && typeof kelas === 'object' && 'namaKelas' in kelas) return kelas.namaKelas;
    if (typeof kelas === 'string') return classNameById.get(kelas) ?? kelas;
    return '—';
  };

  const mapelLabel = (mapel: Jadwal['mapel']) => {
    if (mapel == null) return '—';
    if (typeof mapel === 'object' && 'namaMapel' in mapel) return mapel.namaMapel;
    if (typeof mapel === 'string') return mapelNameById.get(mapel) ?? mapel;
    return '—';
  };

  const userLabel = (u?: Jadwal['createdBy'] | Jadwal['updatedBy']) => {
    if (!u) return '—';
    if (typeof u === 'string') return u; 
    return u.name || u.username || u.email || u._id;
  };

  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('id-ID') : '—');

  return (
    <Table headers={['Kelas', 'Hari', 'Jam Ke', 'Mapel', 'Created By', 'Created At', 'Updated At', 'Actions']}>
      {jadwals.map((j) => (
        <tr key={j._id}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {kelasLabel(j.kelas)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
            {capitalize(j.hari)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {j.jamKe}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {mapelLabel(j.mapel)}
          </td>

          {/* NEW: Created/Updated By + timestamps */}
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {userLabel(j.createdBy)}
          </td>
          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {userLabel(j.updatedBy)}
          </td> */}
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {fmt(j.createdAt)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {fmt(j.updatedAt)}
          </td>

          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <Link to={`/jadwal/${j._id}`} className="text-blue-500 hover:text-blue-700 mr-3">
              Detail
            </Link>
            <Link 
              to="#"
              onClick={() => onUpdate(j)}
              className="text-green-500 hover:text-green-700 mr-3"
            >
              Update
            </Link>
          </td>
        </tr>
      ))}
    </Table>
  );
};

export default JadwalTable;
