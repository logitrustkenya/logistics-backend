import nodemailer from 'nodemailer'
import logger from './logger'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export async function sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.APP_URL}/api/verify?token=${token}`
    const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to: email,
        subject: 'Please verify your email address',
        text: `Thank you for signing up. Please verify your email by clicking the following link: ${verificationUrl}`,
        html: `<p>Thank you for signing up. Please verify your email by clicking the following link:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
    }

    try {
        await transporter.sendMail(mailOptions)
        logger.info(`Verification email sent to ${email}`)
    } catch (error) {
        logger.error(`Failed to send verification email to ${email}`, error)
        throw new Error('Failed to send verification email')
    }
}
