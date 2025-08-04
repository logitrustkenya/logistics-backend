import type { NextApiRequest, NextApiResponse } from 'next'
import { validateSignupData } from '../../lib/utils/validation'
import { checkUserExists, createUser, type UserData } from '../../lib/services/user'
import logger from '../../lib/utils/logger'
import { closeMongoDBConnection, getDatabase } from '../../lib/mongodb/connect'
import { sendVerificationEmail } from '../../lib/utils/email'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import corsMiddleware from '../../lib/middleware/cors'

interface SignupData {
  userType: string
  firstName: string
  lastName: string
  name?: string // For Google users
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
  googleCredential?: string
  authMethod?: 'email' | 'google'
  googleId?: string
  profilePicture?: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'ca0e70b4a83f9477Qazxdfe45e6f62678bv-lhu-b1a3344zxxcffga933b85b967274d93c6c3c61a5b784ea1f5a5e1'

interface ErrorResponse {
    message?: string
    errors?: Record<string, string>
}

async function verifyGoogleToken(credential: string) {
  try {
    // Verify with Google's endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
    const tokenInfo = await response.json()

    if (!response.ok) {
      throw new Error('Failed to verify Google token')
    }

    return {
      email: tokenInfo.email,
      name: tokenInfo.name,
      picture: tokenInfo.picture,
      googleId: tokenInfo.sub,
      emailVerified: tokenInfo.email_verified,
      firstName: tokenInfo.given_name || '',
      lastName: tokenInfo.family_name || ''
    }
  } catch (error) {
    logger.error('Google token verification failed', error)
    throw new Error('Invalid Google token')
  }
}

async function createGoogleUser(userData: SignupData, googleUserData: any) {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection('users')

    const newUser = {
      userType: userData.userType,
      firstName: googleUserData.firstName,
      lastName: googleUserData.lastName,
      name: googleUserData.name,
      email: googleUserData.email,
      googleId: googleUserData.googleId,
      profilePicture: googleUserData.picture,
      emailVerified: true, // Google emails are pre-verified
      authMethod: 'google',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add additional fields based on userType if provided
      ...(userData.phoneNumber && { phoneNumber: userData.phoneNumber }),
      ...(userData.companyName && { companyName: userData.companyName }),
      ...(userData.companyType && { companyType: userData.companyType }),
      ...(userData.businessRegistration && { businessRegistration: userData.businessRegistration }),
      ...(userData.courierCompanyName && { courierCompanyName: userData.courierCompanyName }),
      ...(userData.serviceType && { serviceType: userData.serviceType }),
      ...(userData.licenseNumber && { licenseNumber: userData.licenseNumber }),
      ...(userData.experience && { experience: userData.experience }),
      ...(userData.coverage && { coverage: userData.coverage }),
      ...(userData.driverLicense && { driverLicense: userData.driverLicense }),
      ...(userData.vehicleType && { vehicleType: userData.vehicleType }),
      ...(userData.vehicleRegistration && { vehicleRegistration: userData.vehicleRegistration }),
      ...(userData.insuranceNumber && { insuranceNumber: userData.insuranceNumber })
    }

    const result = await usersCollection.insertOne(newUser)
    return { ...newUser, _id: result.insertedId }
  } catch (error) {
    logger.error('Error creating Google user', error)
    throw error
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
    await corsMiddleware(req, res)

    if(req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed"})
    }

    const data: SignupData = req.body
    logger.info(`Signup attempt: ${data.email} - ${data.userType} - ${data.authMethod || 'email'}`)

    try {
        let userData = data
        let googleUserData = null

        // Handle Google OAuth signup
        if (data.authMethod === 'google' && data.googleCredential) {
            try {
                googleUserData = await verifyGoogleToken(data.googleCredential)
                
                // Check if user already exists
                const existingUser = await checkUserExists(googleUserData.email)
                if (existingUser) {
                    return res.status(400).json({ 
                        message: "Account already exists. Please sign in instead.",
                        accountExists: true 
                    })
                }

                // Validate required fields for Google signup
                if (!data.userType) {
                    return res.status(400).json({ 
                        errors: { userType: "User type is required" }
                    })
                }

                // Create user with Google data
                const newUser = await createGoogleUser(data, googleUserData)

                // Generate JWT token
                const token = jwt.sign(
                    { 
                        userId: newUser._id, 
                        email: newUser.email,
                        userType: newUser.userType 
                    },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                )

                logger.info(`Google signup successful: ${googleUserData.email}`)

                return res.status(201).json({ 
                    message: "Account created successfully with Google!",
                    success: true,
                    token,
                    user: {
                        userType: newUser.userType,
                        userId: newUser._id,
                        email: newUser.email,
                        name: newUser.name,
                        profilePicture: newUser.profilePicture,
                        emailVerified: true
                    }
                })

            } catch (googleError) {
                logger.error('Google signup error', googleError)
                return res.status(400).json({ 
                    message: "Google authentication failed. Please try again." 
                })
            }
        } else {
            // Handle traditional email/password signup
            const errors = validateSignupData(data)
            if(Object.keys(errors).length > 0) {
                return res.status(400).json({ errors})
            }

            const userExists = await checkUserExists(data.email)
            if(userExists) {
                return res.status(400).json({ message: "Email already registered"})
            }

            // Generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex')

            const userToCreate = {
                ...data,
                firstName: data.firstName || '',
                verificationToken
            }
            await createUser(userToCreate)

            // Send verification email (uncomment when ready)
            // await sendVerificationEmail(data.email, verificationToken)

            return res.status(201).json({ 
                message: "User created successfully! Please check your email to verify your account.",
                success: true 
            })
        }

    } catch(error) {
        logger.error("Signup error", error)
        return res.status(500).json({ message: "Server error, please try again later"})
    } finally{
        await closeMongoDBConnection()
    }
}

export default handler