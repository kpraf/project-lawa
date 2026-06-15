import {Routes, Route} from 'react-router-dom';
import Main from './pages/Main';
import Homepage from './pages/Homepage';
import AboutUs from './pages/AboutUs';
import LoginPage from './pages/LoginPage';
import HistoricalDataPage from './pages/HistoricalDataPage';
import ReportsPage from './pages/ReportsPage';
import AdminReports from './pages/AdminReports';
import LogsDashboard from './logs-dashboard/page';
import AdminMain from './pages/AdminMain';
import AdminAnalytics from '../src/logs-dashboard/page/index';
import LineGraphDashboard from './linegraph-dashboard/page';
import { Navigate } from 'react-router-dom';
import React, { useState , useEffect} from 'react';

const ProtectedRoute = ({children}) => {
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState(null);
  
  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuth(false);
        return <Navigate to="/" />;
      }
      
      const response = await fetch('process.env.REACT_APP_API_URL/auth/verify/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setAuth(true);
        const data = await response.json();
        setUser(data.role);
        setEmail(data.email);
        return;
      }

      const refreshToken = localStorage.getItem('refresh');
      if (!refreshToken) {
        setAuth(false);
        return <Navigate to="/" />;
      }

      const refreshResponse = await fetch('process.env.REACT_APP_API_URL/auth/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken })
      });
      
      if (refreshResponse.status !== 200) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        setAuth(false);
        return <Navigate to="/" />;
      }
      const data = await refreshResponse.json();
      localStorage.setItem('token', data.access);
      localStorage.setItem('refresh', data.refresh);

      setUser(data.user);
      setEmail(data.email);
      setAuth(true);

      return;
    }

    verify();
  }, []);

  if (auth === null) {
    return <div>Loading...</div>; // or a loading spinner
  }
  return auth 
    ? React.cloneElement(children, {
      user: user,
      email: email})
    : <Navigate to="/login" />;
};

function App() {
  return (
    <div className='App'>
      <Routes>
        <Route index element={<Homepage/>} />
        <Route path='dashboard' element={<Main />} />
        <Route path='dashboard' element={<Main/>} />
        <Route path='about-us' element={<AboutUs />} />
        <Route path='login' element={<LoginPage />} />
        <Route path='monitoring-data' element={<HistoricalDataPage />} />
        <Route path='reports' element={<ReportsPage/>}/>
        <Route path='admin' element={
                              // <ProtectedRoute>
                                <AdminMain/>
                              // </ProtectedRoute>
                            } />
                            
        <Route path='admin-reports' element={
                                      // <ProtectedRoute>
                                        <AdminReports/>
                                      // </ProtectedRoute>
                                    }/>

        <Route path='logs-dashboard' element={
                                      // <ProtectedRoute>
                                        <LogsDashboard/>
                                      // </ProtectedRoute>
                                    }/>

        <Route path='admin-analytics' element={
                                        // <ProtectedRoute>     
                                          <AdminAnalytics/>
                                        // </ProtectedRoute>
                                      }/>
        <Route path='linegraph-dashboard' element={
                                        // <ProtectedRoute>
                                          <LineGraphDashboard/>
                                        // </ProtectedRoute>
                                      }/>
      </Routes>
      <div className="graphs-container">
      </div>
    </div>
  );
}

export default App;

