const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USER_AUTHENTICATION_EMAIL,
        pass: process.env.USER_AUTHENTICATION_PASSWORD,
    },
});

const MailSender = {
    async sendEmail(to, subject, html) {
        try {
            console.log('Attempting to send email:', {
                to,
                subject,
                from: process.env.USER_AUTHENTICATION_EMAIL
            });

            if (!process.env.USER_AUTHENTICATION_EMAIL || !process.env.USER_AUTHENTICATION_PASSWORD) {
                console.error('Email configuration missing:', {
                    email: !!process.env.USER_AUTHENTICATION_EMAIL,
                    password: !!process.env.USER_AUTHENTICATION_PASSWORD
                });
                throw new Error('Email configuration is missing');
            }

            const mailOptions = {
                from: process.env.USER_AUTHENTICATION_EMAIL,
                to: to,
                subject: subject,
                html: html,
            };

            const result = await transporter.sendMail(mailOptions);
            console.log("Email sent successfully:", {
                messageId: result.messageId,
                response: result.response
            });
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error("Error while sending email:", {
                error: error.message,
                code: error.code,
                command: error.command
            });
            throw new Error("Failed to send email: " + error.message);
        }
    }
};

module.exports = MailSender;
