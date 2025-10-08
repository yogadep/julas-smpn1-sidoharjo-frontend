// src/components/LoginForm.tsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // const handleLogin = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     const response = await axios.post('https://julas-smpn1-sidoharjo-backend.vercel.app/api/login', { 
  //       username, 
  //       password 
  //     });
      
  //     if (response.data.success) {
  //       localStorage.setItem('token', response.data.data.token);
  //       // You might want to store user data as well
  //       console.log('User data:', response.data.data.user);
  //       localStorage.setItem('user', JSON.stringify(response.data.data.user));
  //       navigate('/dashboard');
  //     } else {
  //       setError('Login failed. Please try again.');
  //     }
  //   } catch (err) {
  //     console.error('Login error:', err);
  //     setError('Username atau password salah');
  //   }
  // };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('https://julas-smpn1-sidoharjo-backend.vercel.app/api/login', { username, password });
      if (data?.success) {
        const { token, user } = data.data;
        console.log('User login:', user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
  
        // Arahkan sesuai role
        if (user.role === 'admin') navigate('dashboard/admin');
        else if (user.role === 'guru') navigate('dashboard/guru');
        else navigate('/');
  
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Username atau password salah');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;