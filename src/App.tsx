import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard';
import UserListingPage from './pages/Users';
import UserDetailPage from './pages/UserDetailPage';


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UserListingPage />} />
        <Route path='/users/:id' element={<UserDetailPage />} />
      </Routes>
    </Router>
  );
};

export default App
