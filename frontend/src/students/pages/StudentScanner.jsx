import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Loader2, ScanLine, XCircle, CheckCircle } from 'lucide-react';
import { markAttendanceQR } from '../../api/attendance';

const StudentScanner = () => {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(true);
    const [locationStatus, setLocationStatus] = useState('verifying'); // verifying, active, denied
    const [cameraPermission, setCameraPermission] = useState(null); // null, granted, denied

    const scannerRef = useRef(null);
    const readerId = "reader-custom";

    // 1. Initialize Geolocation immediately
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationStatus('denied');
            setError("Geolocation is not supported by your browser");
            setGeoLoading(false);
            return;
        }

        // Watch position to update status
        const watchId = navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocationStatus('active');
                setGeoLoading(false);
            },
            (err) => {
                console.error("Location error", err);
                setLocationStatus('denied');
                setGeoLoading(false);
                setError("Location access needed for attendance.");
            },
            { enableHighAccuracy: true }
        );
    }, []);

    // 2. Initialize Camera Scanner
    useEffect(() => {
        // Prevent double init
        if (scannerRef.current) return;

        const html5QrCode = new Html5Qrcode(readerId);
        scannerRef.current = html5QrCode;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        };

        // Start the camera
        html5QrCode.start(
            { facingMode: "environment" }, // Prefer back camera
            config,
            (decodedText, decodedResult) => {
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // Parse error, ignore for UI loop
            }
        ).then(() => {
            setCameraPermission('granted');
        }).catch(err => {
            console.error("Camera start error", err);
            setCameraPermission('denied');
            setError("Camera access is required to scan QR codes.");
        });

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Stop failed", err));
            }
        };
    }, []);

    const onScanSuccess = async (token) => {
        if (loading || scanResult) return;

        // Pause scanning
        if (scannerRef.current) {
            scannerRef.current.pause();
        }

        setScanResult(token);
        setLoading(true);

        // Get fresh location for the API call
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const result = await markAttendanceQR(
                        token,
                        position.coords.latitude,
                        position.coords.longitude
                    );

                    // Determine where to redirect based on subject or success
                    // Ideally we show a success modal here, then redirect
                    // distinct timeout to let the user see the "Success" state
                    setTimeout(() => {
                        navigate('/student-dashboard?success=true');
                    }, 1500);

                } catch (err) {
                    setError(err.response?.data?.detail || "Failed to mark attendance.");
                    setScanResult(null);
                    setLoading(false);
                    // Resume scanning if failed
                    if (scannerRef.current) {
                        scannerRef.current.resume();
                    }
                }
            },
            (err) => {
                setError("Failed to get location for submission.");
                setLoading(false);
                if (scannerRef.current) {
                    scannerRef.current.resume();
                }
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-between z-50 overflow-hidden">

            {/* 1. Full Screen Camera Background */}
            <div id={readerId} className="absolute inset-0 w-full h-full object-cover"></div>

            {/* 2. Top Bar (Overlay) */}
            <div className="relative z-10 w-full p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pt-12">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition"
                >
                    <ArrowLeft className="text-white" size={24} />
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold">Scan Teacher QR</h1>
                    <p className="text-xs text-gray-300">Align code within the frame</p>
                </div>
                <div className="w-10"></div> {/* Spacer for center alignment */}
            </div>

            {/* 3. Central Scanning Frame (Overlay) */}
            <div className="relative z-0 flex-1 flex items-center justify-center w-full pointer-events-none">

                {/* The visual box */}
                <div className="relative w-64 h-64 rounded-3xl border-2 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)] bg-transparent">
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl -mb-1 -mr-1"></div>

                    {/* Scanning Line Animation */}
                    {!scanResult && !loading && (
                        <div className="absolute w-full h-0.5 bg-blue-400 shadow-[0_0_10px_#60a5fa] top-0 animate-scan"></div>
                    )}

                    {/* Loading / Success State in center of box */}
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
                            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-2" />
                            <span className="text-sm font-bold text-blue-100">Verifying...</span>
                        </div>
                    )}

                    {scanResult && !loading && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/20 backdrop-blur-sm rounded-2xl border border-green-500/50">
                            <CheckCircle className="w-16 h-16 text-green-400 mb-2 drop-shadow-md" />
                            <span className="font-bold text-green-100">Scanned!</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Bottom Sheet (Location Status) */}
            <div className="relative z-10 w-full p-4 pb-8">
                <div className="bg-white text-slate-900 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-500">

                    {/* Error Message Display */}
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-3 text-sm">
                            <XCircle className="shrink-0" size={18} />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${locationStatus === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">
                                    Location: {locationStatus === 'active' ? 'Active' : locationStatus === 'denied' ? 'Disabled' : 'Verifying...'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {locationStatus === 'active'
                                        ? 'Your device location is verified'
                                        : 'Required for attendance'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${locationStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                            <span className={`text-xs font-medium ${locationStatus === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                                Secure check-in
                            </span>
                        </div>
                    </div>

                    {/* Fallback for Camera Issues */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button className="w-full text-center text-sm text-blue-600 font-medium hover:underline">
                            Scanner not working? Enter code manually
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-2 px-4">
                            If the camera fails, you can type the session code provided by your teacher.
                        </p>
                    </div>
                </div>
            </div>

            {/* CSS for Scan Animation */}
            <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
            animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
        </div>
    );
};

export default StudentScanner;
