const passwordResetTemplate = (userName, resetUrl) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
            <tr>
                <td style="padding: 20px 0;">
                    <table role="presentation" width="600" align="center" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(to right bottom, #301F81, #0F0441); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600; letter-spacing: 1px;">E CORP</h1>
                                <p style="color: #ffffff; margin: 10px 0 0; font-size: 20px; opacity: 0.9;">Password Reset Request</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Hello ${userName},</h2>
                                <p style="color: #666666; margin: 0 0 25px; line-height: 24px; font-size: 16px;">
                                    We received a request to reset your password for your E CORP account. For your security, this password reset link will expire in 1 hour and can only be used once.
                                </p>
                                
                                <!-- Reset Button -->
                                <div style="text-align: center; margin: 35px 0;">
                                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 30px; background-color: #151111; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px; transition: background-color 0.3s ease;">
                                        Reset Password
                                    </a>
                                </div>

                                <!-- Security Info -->
                                <div style="margin: 35px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                                    <p style="color: #666666; margin: 0 0 15px; line-height: 24px; font-size: 16px;">
                                        <strong style="color: #333333;">Important Security Information:</strong>
                                    </p>
                                    <ul style="color: #666666; margin: 0; padding-left: 20px; line-height: 24px; font-size: 16px;">
                                        <li>This link will expire in 1 hour</li>
                                        <li>This is a one-time use link and will become invalid after use</li>
                                        <li>If you didn't request this password reset, please ignore this email</li>
                                        <li>For security, please create a strong password with at least 8 characters</li>
                                    </ul>
                                </div>

                                <p style="color: #666666; margin: 25px 0 0; line-height: 24px; font-size: 16px;">
                                    If you have any questions or concerns, please contact our support team.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                                <p style="color: #999999; margin: 0; font-size: 14px;">
                                    This is an automated message, please do not reply to this email.<br>
                                    &copy; ${new Date().getFullYear()} E CORP. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

module.exports = passwordResetTemplate;
