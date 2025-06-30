import { format } from 'path'
import winston from 'winston'

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/app.log"}),
    ],
})

export function logSignupAttempt(email: string, userType: string){
    logger.info(`Signup attempt for email: ${email}, userType: ${userType}`)
}

export function logSignupSuccess(email: string, userType: string){
    logger.info(`Signup successful for email: ${email}, userType: ${userType}`)
}

export function logError(message: string, error?: unknown) {
    logger.error(message, { error: error instanceof Error ? error.message: error})
}