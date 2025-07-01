import type { NextApiRequest, NextApiResponse } from 'next'
import { validateSignupData } from '../../lib/utils/validation'
import { checkUserExists, createUser } from '../../lib/services/user'
import logger from '../../lib/utils/logger'
import { closeMongoDBConnection } from '../../lib/mongodb/connect'
import { sendVerificationEmail } from '../../lib/utils/email'
import crypto from 'crypto'

interface SignupData {
  userType: string
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  agreeTerms: boolean
  companyName?: string
  companyType?: string
  businessRegistration?: string
  courierCompanyName?: string
  serviceType?: string
  licenseNumber?: string
  experience?: string
  coverage?: string
  driverLicense?: string
  vehicleType?: string
  vehicleRegistration?: string
  insuranceNumber?: string
  verificationToken?: string
}

interface ErrorResponse {
    message?: string
    errors?: Record<string, string>
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed"})
    }

    const data: SignupData = req.body
    logger.info(`Signup attempt: ${data.email} - ${data.userType}`)

    const errors = validateSignupData(data)
    if(Object.keys(errors).length > 0) {
        return res.status(400).json({ errors})
    }
    try{
        const userExists = await checkUserExists(data.email)
        if(userExists) {
            return res.status(400).json({ message: "Email already registered"})
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex')

        await createUser({...data, verificationToken})

        // Send verification email
        await sendVerificationEmail(data.email, verificationToken)

        return res.status(201).json({ message: "User created successfully. Please check your email to verify your account."})
    } catch(error) {
        logger.error("Signup error", error)
        return res.status(500).json({ message: "Server error, please try again later"})
    } finally{
        await closeMongoDBConnection()
    }
}

export default handler
