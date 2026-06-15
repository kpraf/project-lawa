import React from 'react';
import Navbar from '../components/navbar';
import Dashboard from '../components/Dashboard';
import Footer from '../components/Footer';

function Main() {
  return (
    <div className="flex flex-col text-center font-sans bg-blue-100 absolute w-full min-h-screen gap-y-2">
      <header className="w-full content-center object-top sticky top-0 z-50">
        <Navbar />
      </header>
      <div className="">
        <Dashboard />
      </div>
      <Footer />
    </div>
  );
}

export default Main;