// src/components/StudentsTable.tsx
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import Table from './Table';

interface Student {
  _id: string;
  nis: string;
  nama: string;
  kelas: string | { _id: string; namaKelas: string };
  jenisKelamin: 'laki-laki' | 'perempuan';
  createdAt?: string;
  updatedAt?: string;
}

interface ClassesLite {
  _id: string;
  namaKelas: string;
}

interface StudentsTableProps {
  students: Student[];
  classes?: ClassesLite[]; 
}

const StudentsTable = ({ students, classes = [] }: StudentsTableProps) => {
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    classes.forEach(c => m.set(c._id, c.namaKelas));
    return m;
  }, [classes]);

  const kelasLabel = (kelas: Student['kelas']) => {
    if (kelas && typeof kelas === 'object' && 'namaKelas' in kelas) {
      return kelas.namaKelas; 
    }
    if (typeof kelas === 'string') {
      return nameById.get(kelas) ?? kelas; 
    }
    return '-';
  };

  return (
    <Table headers={['NIS', 'Nama', 'Kelas', 'Jenis Kelamin', 'Actions']}>
      {students.map((s) => (
        <tr key={s._id}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.nis}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.nama}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kelasLabel(s.kelas)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.jenisKelamin}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <Link to={`/student/${s._id}`} className="text-blue-500 hover:text-blue-700 mr-3">Detail</Link>
          </td>
        </tr>
      ))}
    </Table>
  );
};

export default StudentsTable;
