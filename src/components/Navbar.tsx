import { BellIcon, SearchIcon } from 'lucide-react';

interface NavbarProps {
  pageTitle: string;
  onToggleSidebar?: () => void; // Opsional untuk toggle sidebar
}

const Navbar = ({ pageTitle, onToggleSidebar }: NavbarProps) => {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
      {/* Pojok Kiri: Toggle Button dan Status Halaman */}
      <div className="flex items-center space-x-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="text-gray-800 hover:bg-gray-100 p-2 rounded-lg transition-colors focus:outline-none lg:hidden"
            aria-label="Toggle Sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        )}
        <div className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="hidden md:inline">Dashboard</span> 
          <span className="mx-2 text-gray-400">→</span> 
          <span className="text-blue-500 font-bold">{pageTitle}</span>
        </div>
      </div>

      {/* Tengah: Search Bar (visible on medium screens and up) */}
      <div className="hidden md:flex relative mx-4 flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Pojok Kanan: Notifikasi dan Profile User */}
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <BellIcon className="h-6 w-6 text-gray-600" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="hidden md:block text-right">
            <div className="text-sm font-medium text-gray-900">John Doe</div>
            <div className="text-xs text-gray-500">Admin</div>
          </div>
          <div className="relative">
            <img
              src="https://via.placeholder.com/40"
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-gray-200"
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;