import React, { useState } from "react";
import { X } from "lucide-react";

export default function AddSubjectModal({open, onClose, onSave}){
    const [name, setName] = useState("");
    const [code, setCode] = useState("");

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
            <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Add Subject</h3>
                <button onClick={onClose}><X /></button>
                </div>

                <div className="space-y-4">
                <input
                    placeholder="Subject name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                    placeholder="Subject code (e.g. CS201)"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 border rounded-lg">
                    Cancel
                </button>
                <button
                    onClick={() => onSave({ name, code })}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg"
                >
                    Add
                </button>
                </div>
            </div>
        </div>
    );
}