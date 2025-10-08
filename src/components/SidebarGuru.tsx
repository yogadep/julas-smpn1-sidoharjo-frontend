import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  CalendarDays,
  NotebookPen
} from 'lucide-react';
import axios from 'axios';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  
  // Handle responsiveness based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const menuItems = [
    { path: '/dashboard/guru', name: 'Home', icon: <HomeIcon className="h-5 w-5" /> },
    { path: '/jadwal/guru', name: 'Jadwal Pelajaran', icon: <CalendarDays className="h-5 w-5" /> },
    { path: '/journal/guru', name: 'Jurnal Kelas', icon: <NotebookPen className="h-5 w-5" /> }
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Handle sidebar toggle
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

   // === Handle logout ===
   const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://julas-smpn1-sidoharjo-backend.vercel.app/api/logout', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (err) {
      console.warn('Logout API error (ignored):', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      delete axios.defaults.headers?.common?.Authorization;
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      {/* Mobile toggle button - fixed at top left */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg transition-all duration-300 lg:hidden"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>
      
      <div className="flex">
        {/* Sidebar */}
        <aside 
          className={`${
            isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
          } fixed top-0 left-0 z-40 h-screen bg-white shadow-md transition-all duration-300 ease-in-out ${
            isOpen ? 'w-64' : 'w-0 lg:w-16'
          }`}
        >
          <div className="h-full flex flex-col overflow-y-auto scrollbar-thin">
            {/* Logo/Store Name */}
            <div className={`flex items-center px-4 py-6 ${!isOpen && 'lg:justify-center'}`}>
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                M
              </div>
              {isOpen && (
                <div className="text-xl font-bold text-gray-800 ml-3">
                  My Store
                </div>
              )}
            </div>
            
            {/* Menu */}
            <div className="flex-1">
              {isOpen && (
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
                  Main Menu
                </div>
              )}
              <ul className="space-y-1 px-2">
                {menuItems.map((item) => (
                  <li key={item.path} title={!isOpen ? item.name : undefined}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-2 py-2 rounded-lg transition-all duration-200 ${
                        !isOpen && 'lg:justify-center'
                      } ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`${!isOpen ? 'lg:mx-auto' : 'mr-3'} ${isActive(item.path) ? 'text-blue-500' : 'text-gray-500'}`}>
                        {item.icon}
                      </span>
                      {isOpen && (
                        <>
                          <span>{item.name}</span>
                          {isActive(item.path) && (
                            <span className="ml-auto h-2 w-2 rounded-full bg-blue-500"></span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Footer Menu */}
            <div className={`mt-auto pt-4 border-t border-gray-200 ${!isOpen && 'lg:text-center'}`}>
              <ul className="space-y-1 px-2">
                <li title={!isOpen ? "Logout" : undefined}>
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center px-2 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
                      !isOpen && 'lg:justify-center'
                    }`}
                  >
                    <span className={`${!isOpen ? 'lg:mx-auto' : 'mr-3'} text-gray-500`}>
                      <LogOutIcon className="h-5 w-5" />
                    </span>
                    {isOpen && <span>Logout</span>}
                  </button>
                </li>
              </ul>
              
              {/* Version */}
              <div className="text-xs text-gray-500 text-center py-4">
                v1.0.0
              </div>
            </div>
          </div>
        </aside>
        
        {/* Semi-transparent overlay for mobile when sidebar is open */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {/* Main content area - adjusted margin */}
        <main className={`transition-all duration-300 min-h-screen flex-1 ${
          isOpen ? 'ml-64' : 'ml-0 lg:ml-16'
        }`}>
          {/* Your page content goes here */}
        </main>
      </div>
    </>
  );
};

export default Sidebar;