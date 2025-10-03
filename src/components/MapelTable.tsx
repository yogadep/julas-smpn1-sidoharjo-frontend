// src/components/UserTable.tsx
import { Link } from 'react-router-dom';
import Table from './Table';

interface Subject {
  _id: string;
  kodeMapel: string;
  namaMapel: string;
  description?: string;
}

interface MapelTableProps {
  subjects: Subject[];
  // onDelete: (id: string) => void;
  // onUpdate: (user: User) => void;
}


const MapelTable = ({ 
    subjects,
    // onDelete,
    // onUpdate
  } : MapelTableProps) => {
  return (
    <Table headers={['Kode Mata Pelajaran', 'Nama Mata Pelajaran', 'Deskripsi', 'Actions']}>
      {subjects.map((subject) => (
        <tr key={subject._id}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {subject.kodeMapel}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {subject.namaMapel}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {subject.description}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <Link
              to={`/subject/${subject._id}`}
              className="text-blue-500 hover:text-blue-700 mr-3"
            >
              Detail
            </Link>
          </td>
        </tr>
      ))}
    </Table>
  );
};

export default MapelTable;