// // import React from 'react';
// // import { useNavigate } from 'react-router-dom';

// // const Navigation = () => {
// //   const navigate = useNavigate();

// //   return (
// //     <nav className="bg-blue-600 text-white p-4 shadow-lg">
// //       <div className="container mx-auto flex justify-between items-center">
// //         <div className="text-xl font-bold">SMS Server Monitor</div>
// //         <div className="flex space-x-4">
// //           <button
// //             onClick={() => navigate('/dashboard')}
// //             className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
// //           >
// //             Dashboard
// //           </button>
// //           <button
// //             onClick={() => navigate('/trends')}
// //             className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
// //           >
// //             Trends
// //           </button>
// //           <button
// //             onClick={() => navigate('/settings')}
// //             className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
// //           >
// //             Profile
// //           </button>
// //           <button
// //             onClick={() => {
// //               localStorage.removeItem('token');
// //               navigate('/');
// //             }}
// //             className="hover:bg-red-700 px-3 py-2 rounded transition-colors bg-red-600"
// //           >
// //             Logout
// //           </button>
// //         </div>
// //       </div>
// //     </nav>
// //   );
// // };

// // export default Navigation;

// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LayoutDashboard, TrendingUp, User, LogOut, Server, Database } from 'lucide-react'; // Importing icons

// const Navigation = () => {
//   const navigate = useNavigate();

//   // Helper function for reusable navigation buttons
//   const NavButton = ({ to, icon: Icon, label, onClick }) => (
//     <button
//       onClick={onClick || (() => navigate(to))}
//       // Light background, subtle hover, indigo accent color
//       className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
//     >
//       <Icon className="h-5 w-5" />
//       <span className="font-medium">{label}</span>
//     </button>
//   );

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     navigate('/');
//   };

//   return (
//     <nav className="bg-white text-gray-900 p-4 shadow-md border-b border-gray-200">
//       <div className="container mx-auto flex justify-between items-center">
        
//         {/* Logo/Title - Uses brand accent color */}
//         <div className="flex items-center space-x-2">
//           <Server className="h-6 w-6 text-indigo-600" />
//           <div className="text-xl font-extrabold tracking-tight text-indigo-700">Server Monitor</div>
//         </div>

//         {/* Navigation Links and Logout Group */}
//         <div className="flex items-center space-x-6">
          
//           {/* Main Links */}
//           <div className="hidden sm:flex space-x-1">
//             <NavButton to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
//             <NavButton to="/trends" icon={TrendingUp} label="Trends" />
//             <NavButton to="/schema-explorer" icon={Database} label="Schema Explorer" />
//             <NavButton to="/settings" icon={User} label="Profile" />
//           </div>
          
//           {/* Logout Button (Clear distinction with color) */}
//           <button
//             onClick={handleLogout}
//             className="flex items-center space-x-2 bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-full transition-colors duration-200 shadow-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-300"
//           >
//             <LogOut className="h-5 w-5" />
//             <span className="hidden sm:inline">Logout</span>
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navigation;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, User, LogOut, Server } from 'lucide-react'; // Importing icons

const Navigation = () => {
  const navigate = useNavigate();

  // Helper function for reusable navigation buttons
  const NavButton = ({ to, icon: Icon, label, onClick }) => (
    <button
      onClick={onClick || (() => navigate(to))}
      // Light background, subtle hover, indigo accent color
      className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav className="bg-white text-gray-900 p-4 shadow-md border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* Logo/Title - Uses brand accent color */}
        <div className="flex items-center space-x-2">
          <Server className="h-6 w-6 text-indigo-600" />
          <div className="text-xl font-extrabold tracking-tight text-indigo-700">Server Monitor</div>
        </div>

        {/* Navigation Links and Logout Group */}
        <div className="flex items-center space-x-6">
          
          {/* Main Links */}
          <div className="hidden sm:flex space-x-1">
            <NavButton to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavButton to="/trends" icon={TrendingUp} label="Trends" />
            <NavButton to="/settings" icon={User} label="Profile" />
          </div>
          
          {/* Logout Button (Clear distinction with color) */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-full transition-colors duration-200 shadow-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;