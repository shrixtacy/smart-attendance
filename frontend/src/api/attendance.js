import api from "./axiosClient";

export const captureAndSend = async (
  webcamRef,
  selectedSubject,
  setDetections
) => {
  console.log("captureAndSend triggered");
  const image = webcamRef.current?.getScreenshot();
  if (!image || !selectedSubject) return;

  try {
    const res = await api.post("/api/attendance/mark", {
      image,
      subject_id: selectedSubject,
    });

    console.log("Attendance response:", res.data);
    setDetections(res.data.faces);
  } catch (err) {
    console.error(
      "Attendance error:",
      err.response?.data || err.message
    );
  }
};

export const generateQR = async (subjectId, duration = 30) => {
  const res = await api.post("/api/attendance/generate-qr", {
    subject_id: subjectId,
    valid_duration: duration,
  });
  return res.data;
};

export const markAttendanceQR = async (token, latitude, longitude) => {
  const res = await api.post("/api/attendance/mark-qr", {
    token,
    lat: latitude,
    long: longitude
  });
  return res.data;
};
