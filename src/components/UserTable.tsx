// src/components/UserTable.tsx
import { Link } from 'react-router-dom';
import Table from './Table';

interface User {
  _id: string;
  username: string;
  namaLengkap: string;
  role: string;
  email: string;
  mataPelajaran: string[];
  kelasYangDiampu: string[];
  createdAt: string;
  updatedAt: string;
}

interface UserTableProps {
  users: User[];
  onDelete: (id: string) => void;
  onUpdate: (user: User) => void;
}


const UserTable = ({ users, onDelete, onUpdate} : UserTableProps) => {
  return (
    <Table headers={['Username', 'Nama Lengkap', 'Role', 'Email', 'Actions']}>
      {users.map((user) => (
        <tr key={user._id}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {user.username}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {user.namaLengkap}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {user.role}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {user.email}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <Link
              to={`/users/${user._id}`}
              className="text-blue-500 hover:text-blue-700 mr-3"
            >
              Detail
            </Link>
            <Link 
              to="#"
              onClick={() => onUpdate(user)}
              className="text-green-500 hover:text-green-700 mr-3"
            >
              Update
            </Link>
            <Link
              to="#"
              onClick={() => onDelete(user._id)}
              className="text-red-500 hover:red-yellow-700"
            >
              Delete
            </Link>
          </td>
        </tr>
      ))}
    </Table>
  );
};

export default UserTable;