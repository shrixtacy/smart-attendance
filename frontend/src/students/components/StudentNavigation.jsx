import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  User,
  LogOut
} from "lucide-react";
import PropTypes from "prop-types";

export default function StudentNavigation({ activePage }) {

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to logout?")){
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }

  return (
    <aside className="w-full md:w-64 bg-white md:fixed md:inset-y-0 border-r border-gray-100 flex flex-col z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
          <img src="/logo.png" className="w-5 h-5 opacity-90" alt="logo" onError={(e) => e.target.style.display='none'} />
        </div>
        <span className="font-bold text-xl text-slate-800 tracking-tight">Smart Attend</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <NavItem
          icon={LayoutDashboard}
          label="Home"
          active={activePage === 'dashboard'}
          path="/student-dashboard"
        />
        <NavItem
          icon={BookOpen}
          label="Subjects"
          active={activePage === 'subjects'}
          path="/student-subjects"
        />
        <NavItem
          icon={TrendingUp}
          label="Forecast"
          active={activePage === 'forecast'}
          path="/student-forecast"
        />
        <NavItem
          icon={User}
          label="Profile"
          active={activePage === 'profile'}
          path="/student-profile"
        />
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group font-medium text-sm"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
          Logout
        </button>
      </div>
    </aside>
  );
}

StudentNavigation.propTypes = {
  activePage: PropTypes.string.isRequired,
};

function NavItem({ icon: Icon, label, active, path }) {
  return (
    <Link
      to={path}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
        active
          ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon
        size={18}
        className={`transition-transform duration-200 ${
          active ? "scale-110" : "group-hover:scale-110"
        }`}
      />
      {label}
    </Link>
  );
}

NavItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  path: PropTypes.string.isRequired,
};
