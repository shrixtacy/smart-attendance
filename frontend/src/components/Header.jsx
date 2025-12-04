import React from "react";
import { Bell, User, ChevronDown } from "lucide-react";

export default function Header() {
  return (
    <>
    <div className="w-full h-16 flex items-center justify-start px-6 bg-[var(--bg-card)] gap-2" role="navigation">
        <div className="logo-section flex items-center gap-4">
            <img className="w-14 h-14 rounded-full" src="logo.png" alt="" />
            <h1 className="text-2xl font-semibold text-[var(--text-main)]">Smart Attendance</h1>
        </div>
        <div className="nav-links text-gray-500 gap-1 ml-10">
            <a href="/" className="mx-2 font-semibold hover:text-[var(--primary)] hover:bg-[var(--primary-hover)] py-2 px-3 rounded-4xl">Dashboard</a>
            <a href="/attendance" className="mx-2 font-semibold hover:text-[var(--primary)] hover:bg-[var(--primary-hover)] py-2 px-3 rounded-4xl">Attendance</a>
            <a href="/students" className="mx-2 font-semibold hover:text-[var(--primary)] hover:bg-[var(--primary-hover)] py-2 px-3 rounded-4xl">Student</a>
            <a href="/analytics" className="mx-2 font-semibold hover:text-[var(--primary)] hover:bg-[var(--primary-hover)] py-2 px-3 rounded-4xl">Analytics</a>
            <a href="/reports" className="mx-2 font-semibold hover:text-[var(--primary)] hover:bg-[var(--primary-hover)] py-2 px-3 rounded-4xl">Reports</a>
        </div>
        <div className="profile-section flex items-center gap-5 text-gray-500 ml-auto justify-end">
            <div className="bell bg-[var(--primary)] p-1 rounded-full">
                <Bell className="text-[var(--text-on-primary)] cursor-pointer p-0.5"/>
            </div>
            
            <User className="rounded-full" />
            <div className="user flex items-center gap-1.5">
                <span className="user-name text-[var(--text-main)]">John Doe</span>
                <a href="/settings"><ChevronDown className="cursor-pointer p-1" /></a>
            </div>
        </div>
    </div>
      
    </>
  );}