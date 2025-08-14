import { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUpIcon, TrendingDownIcon, Activity, Users, Package, DollarSign, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
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

// Komponen TopProducts
const TopProducts = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Top Products</h2>
      <div className="space-y-4">
        {[
          { name: 'Product A', sales: 342, percentage: 65 },
          { name: 'Product B', sales: 276, percentage: 52 },
          { name: 'Product C', sales: 198, percentage: 38 },
        ].map((product, index) => (
          <div key={index} className="flex items-center">
            <div className="w-10 h-10 mr-3 rounded-lg bg-gray-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{product.name}</span>
                <span className="text-sm text-gray-500">{product.sales} sold</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${product.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          View all products
        </a>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const usersResponse = await axios.get('http://localhost:3000/api/getusers');
        console.log("test")

        console.log('User data:', usersResponse.data);
        const users = usersResponse.data.data;

        // const productsResponse = await axios.get('http://localhost:3000/products');
        // const ordersResponse = await axios.get('http://localhost:3000/sales',{
        //   headers: {
        //     Authorization: `Bearer ${localStorage.getItem('token')}`,
        //   },
        // });
        // // console.log(`User: ${JSON.stringify(usersResponse.data)}`);
        // // console.log('User data:', usersResponse.data);

        // const totalRevenue = ordersResponse.data.reduce((sum, order) => sum + order.total, 0);
        // const rupiahFormatter = new Intl.NumberFormat('id-ID', { 
        //   style: 'currency', 
        //   currency: 'IDR' 
        // }).format(totalRevenue);

        console.log("test lagi")
        setUserCount(users.length);
        console.log('User count:', users.length);
        // setProductCount(productsResponse.data.length);
        // setOrderCount(ordersResponse.data.length);
        
        // setRevenueCount(rupiahFormatter);
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
            <p className="text-gray-500">Welcome back, here's what's happening with your store today.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <DashboardCard
                  title="Users"
                  count={userCount}
                  icon={<Users className="h-6 w-6 text-white" />}
                  // trend={5.2}
                  color="bg-blue-500"
                  link="/users"
                />
                <DashboardCard
                  title="Mata Pelajaran"
                  count={productCount}
                  icon={<Package className="h-6 w-6 text-white" />}
                  // trend={3.1}
                  color="bg-green-500"
                  link="/products"
                />
                <DashboardCard
                  title="Kelas"
                  count={orderCount}
                  icon={<ShoppingCart className="h-6 w-6 text-white" />}
                  // trend={-1.5}
                  color="bg-purple-500"
                  link="/sales"
                />
                <DashboardCard
                  title="Jurnal Kelas"
                  count={revenueCount}
                  icon={<DollarSign className="h-6 w-6 text-white" />}
                  // trend={8.7}
                  color="bg-amber-500"
                  link="/sales"
                />
                <DashboardCard
                  title="Jadwal"  
                  count={revenueCount}
                  icon={<DollarSign className="h-6 w-6 text-white" />}
                  // trend={8.7}
                  color="bg-amber-500"
                  link="/sales"
                />
              </div>

              {/* Charts and Tables */}
              {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SimpleChart />
                </div>
                <div>
                  <RecentActivity />
                </div>
              </div> */}

              {/* Top Products */}
              <div className="mt-6">
                <TopProducts />
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