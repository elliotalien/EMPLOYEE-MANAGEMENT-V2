const getEmailTemplate = (otp) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
            <tr>
                <td style="padding: 20px 0;">
                    <table role="presentation" width="600" align="center" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(to right bottom, #301F81, #0F0441); padding: 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">E CORP</h1>
                                <p style="color: #ffffff; margin: 10px 0 0; font-size: 20px;">Email Verification</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Verify Your Email</h2>
                                <p style="color: #666666; margin: 0 0 30px; font-size: 16px; line-height: 1.5;">
                                    Thank you for registering! To complete your registration, please use the following verification code:
                                </p>
                                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
                                    <h3 style="color: #301F81; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h3>
                                </div>
                                <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.5;">
                                    This code will expire in 10 minutes. If you did not request this verification, please ignore this email.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                                <p style="color: #999999; margin: 0; font-size: 14px;">
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

module.exports = getEmailTemplate;
