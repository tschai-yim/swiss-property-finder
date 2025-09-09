import nodemailer from 'nodemailer';
import { emailConfig } from '../../../utils/env';

const getTransporter = () => {
    if (emailConfig.service === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailConfig.user,
                pass: emailConfig.pass,
            },
        });
    }

    return nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass,
        },
    });
};

export const sendEmail = async (to: string, subject: string, html: string) => {
    const transporter = getTransporter();
    const mailOptions = {
        from: emailConfig.from,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
