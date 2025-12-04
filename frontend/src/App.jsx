// frontend/src/App.jsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MarkAttendance from "./pages/MarkAttendance";
import StudentList from "./pages/StudentList";
import { useTheme } from "./theme/ThemeContext";
import Header from "./components/Header";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AddStudents from "./pages/AddStudents";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <Header theme={theme} setTheme={setTheme} />

      <div className="p-6">
        <Routes>
          <Route path="/" element={<Dashboard/>} />
          <Route path="/attendance" element={<MarkAttendance/>}/>
          <Route path="/students" element={<StudentList/>}/>
          <Route path="/analytics" element={<Analytics/>}/>
          <Route path="/reports" element={<Reports/>}/>
          <Route path="/settings" element={<Settings/>}/>
          <Route path="/add-students" element={<AddStudents/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="*" element={<div>404 Not Found</div>} />


        </Routes>
      </div>
    </div>
  );
}
