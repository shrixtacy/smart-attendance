/**
 * Utility functions for MediaPipe Face Mesh calculations
 */

// Euclidean distance between two 3D points
const getDistance = (p1, p2) => {
    return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2) +
        Math.pow(p1.z - p2.z, 2)
    );
};

// Calculate Eye Aspect Ratio (EAR)
// Indices: p1 (left corner), p2 (top-left), p3 (top-right), p4 (right corner), p5 (bottom-right), p6 (bottom-left)
export const calculateEAR = (landmarks, indices) => {
    const p1 = landmarks[indices[0]];
    const p2 = landmarks[indices[1]];
    const p3 = landmarks[indices[2]];
    const p4 = landmarks[indices[3]];
    const p5 = landmarks[indices[4]];
    const p6 = landmarks[indices[5]];

    const v1 = getDistance(p2, p6);
    const v2 = getDistance(p3, p5);
    const h = getDistance(p1, p4);

    if (h === 0) return 0;
    return (v1 + v2) / (2.0 * h);
};

// Landmark Indices
export const LANDMARKS = {
    // Left Eye (33, 160, 158, 133, 153, 144)
    LEFT_EYE: [33, 160, 158, 133, 153, 144],
    // Right Eye (362, 385, 387, 263, 373, 380)
    RIGHT_EYE: [362, 385, 387, 263, 373, 380],
    // Head Pose Keypoints
    NOSE_TIP: 1,
    LEFT_CHEEK: 234,
    RIGHT_CHEEK: 454,
    CHIN: 152,
    FOREHEAD: 10,
    // Mouth
    MOUTH_LEFT: 61,
    MOUTH_RIGHT: 291,
    MOUTH_TOP: 13,
    MOUTH_BOTTOM: 14
};

// Detect Head Turn (Yaw)
// Returns: 'left', 'right', 'center'
export const detectHeadTurn = (landmarks) => {
    const nose = landmarks[LANDMARKS.NOSE_TIP];
    const leftCheek = landmarks[LANDMARKS.LEFT_CHEEK];
    const rightCheek = landmarks[LANDMARKS.RIGHT_CHEEK];

    const distToLeft = Math.abs(nose.x - leftCheek.x);
    const distToRight = Math.abs(nose.x - rightCheek.x);

    const ratio = distToLeft / (distToRight + 0.0001); // Avoid div by zero

    // Thresholds need calibration, but generally:
    // Ratio < 0.6 => Turning Left (Nose closer to left cheek in 2D projection? No, wait.)
    // If user turns LEFT (their left), nose moves LEFT in image (viewer's left? No, mirrored?).
    // Usually mirrored=true.
    // If mirrored:
    // Turn Left (User's left) -> Face looks to right of screen. Nose moves towards right cheek (454).
    //  distToRight gets smaller. Ratio gets larger.
    // Turn Right (User's right) -> Face looks to left of screen. Nose moves towards left cheek (234).
    //  distToLeft gets smaller. Ratio gets smaller.

    if (ratio < 0.6) return 'right'; // User looking to their right (screen left)
    if (ratio > 1.6) return 'left'; // User looking to their left (screen right)
    return 'center';
};

// Simple Smile Detection
export const detectSmile = (landmarks) => {
    const mouthLeft = landmarks[LANDMARKS.MOUTH_LEFT];
    const mouthRight = landmarks[LANDMARKS.MOUTH_RIGHT];
    const leftCheek = landmarks[LANDMARKS.LEFT_CHEEK];
    const rightCheek = landmarks[LANDMARKS.RIGHT_CHEEK];

    const faceWidth = getDistance(leftCheek, rightCheek);
    const mouthWidth = getDistance(mouthLeft, mouthRight);

    if (faceWidth === 0) return false;

    // If mouth width is > 45% of face width (calibrated value)
    return (mouthWidth / faceWidth) > 0.45;
};
