import React from 'react';
import Sidebar from '../components/sidebar';
import AdminDashboard from '../components/AdminDashboard';



function Main(props) {
  const user = props.user;
  const email = props.email;

  return (
    <div className="flex flex-row text-center font-sans w-full min-h-screen bg-blue-100">
      <div className="flex-shrink-0">
        <Sidebar userProps={user} emailProps={email}/>
      </div>
      <div className="flex-1 w-full min-w-0">
        <AdminDashboard />
      </div>
    </div>
  );
}

export default Main;