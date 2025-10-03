import { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUpIcon, TrendingDownIcon, Activity, Users, Package, DollarSign, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/SidebarGuru';
import Footer from '../components/Footer';

// Komponen DashboardCard yang ditingkatkan
interface DashboardCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  link: string;
}

type JadwalItem = {
  _id: string;
  kelas: { _id: string; namaKelas: string };
  hari: string;          // ex: "rabu"
  jamKe: number;         // ex: 5
  // mapel: string | { _id: string; nama: string }; // bisa ID atau object
  mapel?: string | { _id: string; namaMapel: string } | null;
};

const DashboardCard = ({ title, count, icon, trend = 0, color, link }: DashboardCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold">{count.toLocaleString()}</p>
            {trend !== 0 && (
              <span className={`ml-2 flex items-center text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <TrendingUpIcon className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <a href={link} className="text-sm font-medium text-blue-600 hover:text-blue-800">
          View details →
        </a>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);

  const [jadwalCount, setJadwalCount] = useState(0);

  const [displayName, setDisplayName] = useState('User');

  const [scheduleDay, setScheduleDay] = useState('Jadwal');

  
  const [todaySchedules, setTodaySchedules] = useState<JadwalItem[]>([]);
  const [mapelDict, setMapelDict] = useState<Record<string, string>>({});

  const [jurnalCount, setJurnalCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const getMe = () => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  };
  const getToken = () => localStorage.getItem('token') || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const me = getMe();
      const token = getToken();
      if (!me?._id || !token) {
        window.location.href = '/login';
        return;
      }

      try {
        const [usersResponse, jurnalRes, jadwalRes] = await Promise.all([
          axios.get('http://localhost:3000/api/getusers', {
            // headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: { data: [] } })),
          axios.get(`http://localhost:3000/api/getjurnalbyguru/${me._id}`, {
            // headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:3000/api/getjadwalbyguru/${me._id}`, {
            // headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const jurnalList = jurnalRes.data?.data ?? [];
        setJurnalCount(jurnalList.length);

        const jadwalList = jadwalRes.data?.data ?? [];
        setJadwalCount(jadwalList.length);

        const mapelIdSet = new Set(
          jadwalList
            .map(j => j.mapel)
            .filter((m): m is string => typeof m === 'string')
        );

        if (mapelIdSet.size > 0) {
          try {
            const ids = Array.from(mapelIdSet);
            const results = await Promise.all(
              ids.map(id =>
                axios.get(`http://localhost:3000/api/mapel/${id}`)
                  .then(res => ({ id, nama: res.data?.data?.namaMapel || res.data?.data?.nama || id }))
                  .catch(() => ({ id, nama: id })) // fallback kalau error
              )
            );

            const dict: Record<string, string> = {};
            for (const r of results) dict[r.id] = r.nama;
            setMapelDict(prev => ({ ...prev, ...dict }));
          } catch (e) {
            console.warn('Gagal memetakan mapel ID -> nama:', e);
          }
        }


        const todayName = new Intl.DateTimeFormat('id-ID', {
          weekday: 'long',
          timeZone: 'Asia/Jakarta',
        }).format(new Date()).toLowerCase(); 
        setScheduleDay(todayName);

        const todays = jadwalList
        .filter(j => (j.hari || '').toLowerCase() === todayName)
        .sort((a, b) => a.jamKe - b.jamKe);

        setTodaySchedules(todays);

        const users = usersResponse.data?.data ?? [];
        setUserCount(users.length);

        setDisplayName(
          me?.namaLengkap ||
          me?.username ||
          (me?.email ? me.email.split('@')[0] : '') ||
          'User'
        );
      } catch (error) {
        console.error('Error fetching data cuk:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();

    // Handle responsive sidebar for mobile devices
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Initial check on mount
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

const getMapelName = (mapel: JadwalItem['mapel']) => {
  if (!mapel) return '-';
  if (typeof mapel === 'string') {
    return mapelDict[mapel] ?? mapel; // kalau masih ID → fallback ID
  }
  return mapel.namaMapel ?? mapel._id ?? '-';
};

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar - now fixed position on mobile */}
      <div 
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative z-30 transition-transform duration-300 ease-in-out h-screen overflow-y-auto`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        {/* Navbar with toggle */}
        <Navbar 
          pageTitle="Dashboard" 
          onToggleSidebar={toggleSidebar} 
        />

        {/* Konten Halaman */}
        <main className={`flex-1 p-6 ${sidebarOpen ? 'md:ml-0' : 'ml-0'} transition-all duration-300 ease-in-out`}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
            <p className="text-gray-500">Welcome back <span>{displayName}</span></p>
            <p className="text-gray-500">
              Hari ini ({scheduleDay}) Anda mengajar:
              {' '}
              {todaySchedules.length === 0
                ? <span className="italic">tidak ada jadwal</span>
                : todaySchedules.map((j, i) => (
                    <span key={j._id}>
                      {i > 0 ? ', ' : ''} jam ke-{j.jamKe} {getMapelName(j.mapel?.namaMapel)} ({j.kelas?.namaKelas})
                    </span>
                  ))
              }
            </p>
          </div>

          {todaySchedules.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Jadwal {scheduleDay.toUpperCase()}</h2>
              <ul className="divide-y">
                {todaySchedules.map(item => (
                  <li key={item._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">
                          Jam ke-{item.jamKe} • {getMapelName(item.mapel)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Kelas {item.kelas?.namaKelas}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                      {item.hari}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
                <DashboardCard
                  title="Jurnal Kelas"
                  count={jurnalCount}
                  icon={<DollarSign className="h-6 w-6 text-white" />}
                  // trend={8.7}
                  color="bg-amber-500"
                  link="/journal/guru"
                />
                <DashboardCard
                  title="Jadwal"  
                  count={jadwalCount}
                  icon={<DollarSign className="h-6 w-6 text-white" />}
                  // trend={8.7}
                  color="bg-amber-500"
                  link="/jadwal/guru"
                />
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default DashboardPage;