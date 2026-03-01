const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }

    async init() {
        try {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            console.log(`📧 Email service initialized using Gmail.`);
        } catch (error) {
            console.error('Failed to initialize email service:', error);
        }
    }

    async sendWelcomeEmail(userEmail, userName) {
        if (!this.transporter) {
            console.error('Email transporter not ready yet.');
            return;
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"Artisan LMS" <${process.env.SMTP_USER}>`, 
                to: userEmail,
                subject: "Welcome to Artisan LMS! 🎓",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                        <h2 style="color: #4f46e5; text-align: center;">Welcome to the Classroom, ${userName}!</h2>
                        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
                            We're thrilled to have you join our Next-Generation LMS Platform. Your account has been successfully created.
                        </p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
                            You can now browse subjects, enroll in courses, and take interactive assessments.
                        </p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://lms-six-henna.vercel.app/login" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 40px; text-align: center;">
                            If you have any questions, feel free to contact your instructor.
                        </p>
                    </div>
                `,
            });

            console.log("=========================================");
            console.log("📨 Message sent: %s", info.messageId);
            console.log("🔗 Preview URL: %s", nodemailer.getTestMessageUrl(info));
            console.log("=========================================");
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }
    }
}

module.exports = new EmailService();
