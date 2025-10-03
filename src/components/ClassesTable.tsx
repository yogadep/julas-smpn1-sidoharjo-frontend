// src/components/UserTable.tsx
import { Link } from 'react-router-dom';
import Table from './Table';

interface Classes {
  _id: string;
  namaKelas: string;
  description?: string;
  siswa?: string[];
}

interface ClassesTableProps {
  classes: Classes[];
  // onDelete: (id: string) => void;
  // onUpdate: (user: User) => void;
}


const ClassesTable = ({ 
    classes,
    // onDelete,
    // onUpdate
  } : ClassesTableProps) => {
  return (
    <Table headers={['Nama Kelas', 'Deskripsi', 'Actions']}>
      {classes.map((c) => (
        <tr key={c._id}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {c.namaKelas}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {c.description}
          </td>
          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {c.description}
          </td> */}
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <Link
              to={`/class/${c._id}`}
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

export default ClassesTable;