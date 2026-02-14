import html

def otp_email_template(otp: str, user: str) -> str:
    """
    Generate HTML body for password reset OTP email.
    """
    safe_user = html.escape(user)
    safe_otp = html.escape(otp)

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >
</head>
<body
    style="
        margin: 0;
        padding: 0;
        background-color: #f3f4f6;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    "
>
    <div
        style="
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        "
    >
        <div
            style="
                background: linear-gradient(
                    135deg,
                    #4F46E5 0%,
                    #7C3AED 100%
                );
                padding: 30px 20px;
                text-align: center;
            "
        >
            <h1
                style="
                    color: #ffffff;
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    letter-spacing: 1px;
                "
            >
                Smart Attendance
            </h1>
        </div>

        <div style="padding: 40px 30px; color: #374151;">
            <h2
                style="
                    margin-top: 0;
                    color: #1F2937;
                    font-size: 20px;
                    font-weight: 600;
                "
            >
                Password Reset Request
            </h2>

            <p
                style="
                    font-size: 16px;
                    line-height: 1.6;
                    color: #4B5563;
                    margin-bottom: 24px;
                "
            >
                Hi <strong>{safe_user}</strong>,<br>
                We received a request to reset the password for your
                Smart Attendance account.
                Use the code below to complete the process.
            </p>

            <div style="margin: 32px 0; text-align: center;">
                <div
                    style="
                        display: inline-block;
                        background-color: #EEF2FF;
                        border: 1px dashed #6366F1;
                        border-radius: 12px;
                        padding: 20px 40px;
                    "
                >
                    <span
                        style="
                            font-size: 14px;
                            color: #6366F1;
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        "
                    >
                        Your OTP Code
                    </span>

                    <strong
                        style="
                            font-size: 36px;
                            letter-spacing: 8px;
                            color: #1F2937;
                            display: block;
                        "
                    >
                        {safe_otp}
                    </strong>
                </div>
            </div>

            <p
                style="
                    font-size: 14px;
                    color: #6B7280;
                    text-align: center;
                    margin-bottom: 30px;
                "
            >
                ⚠️ This code expires in <strong>10 minutes</strong>.<br>
                Please do not share this code with anyone.
            </p>

            <hr
                style="
                    border: none;
                    border-top: 1px solid #E5E7EB;
                    margin: 24px 0;
                "
            >

            <p
                style="
                    font-size: 14px;
                    color: #6B7280;
                    line-height: 1.5;
                "
            >
                If you did not request a password reset,
                you can safely ignore this email.
                Your account remains secure.
            </p>

            <p
                style="
                    margin-top: 30px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1F2937;
                "
            >
                Best regards,<br>
                <span style="color: #4F46E5;">
                    The Smart Attendance Team
                </span>
            </p>
        </div>

        <div
            style="
                background-color: #F9FAFB;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #E5E7EB;
            "
        >
            <p
                style="
                    margin: 0;
                    font-size: 12px;
                    color: #9CA3AF;
                "
            >
                &copy; Smart Attendance System.
                All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
"""



def verification_email_template(verification_link: str, user: str) -> str:
    safe_user = html.escape(user)
    return f"""
    <html>
        <body>
            <p>Hi, {safe_user}</p>
            <p>Please verify your email by clicking the link below:</p>
            <p><a href="{verification_link}" target="_blank" 
                  style="background-color: #3333FF; color: white; padding: 10px 20px; 
                         text-decoration: none; border-radius: 5px;">
                  Verify Email
               </a></p>
            <p>Or copy this link and paste on the browser tab: {verification_link}</p>
            <br>
            <p>Thanks,<br><b>Smart Attendance Team</b></p>
        </body>
    </html>
    """
