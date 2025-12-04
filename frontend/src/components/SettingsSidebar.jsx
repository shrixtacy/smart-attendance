import React from "react";
import { User, Sliders, AlertCircle, ScanFace, Heart } from "lucide-react";

export default function SettingsSidebar({ activeTab, setActiveTab }) {
  const sidebarItems = [
    { name: "General", icon: Sliders },
    { name: "Thresholds", icon: AlertCircle },
    { name: "Profile", icon: User },
    { name: "Face settings", icon: ScanFace },
    { name: "Credits", icon: Heart }, // Added Credits option
  ];

  return (
    <div className="w-full md:w-64 flex-shrink-0 bg-white md:bg-transparent rounded-xl border md:border-none border-gray-100 shadow-sm md:shadow-none p-2 md:p-0">
      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-3 hidden md:block">
          Settings
        </h3>
        {sidebarItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === item.name
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <item.icon size={18} />
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}