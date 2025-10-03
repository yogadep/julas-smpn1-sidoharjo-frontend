import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard';
import UserListingPage from './pages/Users';
import UserDetailPage from './pages/UserDetailPage';
import SubjectDetailPage from './pages/SubjectDetailPage';
import Subjects from './pages/Subjects'
import Classes from './pages/Classes'
import ClassDetailPage from './pages/ClassDetailPage'
import Student from './pages/Students';
import StudentDetailPage from './pages/StudentDetailPage';
import JadwalListingPage from './pages/Jadwal';
import JournalListingPage from './pages/Journal';
import JurnalDetailPage from './pages/JournalDetailPage';
import JadwalDetailPage from './pages/JadwalDetailPage';
import DashboardPageGuru from './pages/DashboardGuru';
import JournalListingPageGuru from './pages/JournalGuru';
import JurnalDetailPageGuru from './pages/JournalDetailPageGuru';
import JadwalListingPageGuru from './pages/JadwalGuru';
import JadwalDetailPageGuru from './pages/JadwalDetailPageGuru';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard/admin" element={<DashboardPage />} />
        <Route path="/users" element={<UserListingPage />} />
        <Route path='/users/:id' element={<UserDetailPage />} />
        <Route path='/subjects' element={<Subjects />} />
        <Route path='/subject/:id' element={<SubjectDetailPage />} />
        <Route path='/classes' element={<Classes />} />
        <Route path='/class/:id' element={<ClassDetailPage />} />
        <Route path='/students' element={<Student />} />
        <Route path='/student/:id' element={<StudentDetailPage />} />
        <Route path='/jadwal' element={<JadwalListingPage />} />
        <Route path='/jadwal/:id' element={<JadwalDetailPage />}></Route>
        <Route path='/journal' element={<JournalListingPage />} />
        <Route path='/journal/:id' element={<JurnalDetailPage />} />
        <Route path='/dashboard/guru' element={<DashboardPageGuru />} />
        <Route path='/journal/guru' element={<JournalListingPageGuru />} />
        <Route path='/journal/guru/:id' element={<JurnalDetailPageGuru />} />
        <Route path='/jadwal/guru' element={<JadwalListingPageGuru />} />
        <Route path='/jadwal/guru/:id' element={<JadwalDetailPageGuru />} />

      </Routes>
    </Router>
  );
};

export default App
