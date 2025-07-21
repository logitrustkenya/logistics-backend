import type { NextApiRequest, NextApiResponse } from 'next'
import { getDatabase } from '../../lib/mongodb/connect'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import logger from '../../lib/utils/logger'

interface LoginData {
  email?: string
  password?: string
  googleCredential?: string
  authMethod?: 'email' | 'google'
}

const JWT_SECRET = process.env.JWT_SECRET || 'ca0e70b4a83f9477Qazxdfe45e6f62678bv-lhu-b1a3344zxxcffga933b85b967274d93c6c3c61a5b784ea1f5a5e1'
const JWT_EXPIRATION = '1h'

interface ErrorResponse {
  message?: string
  errors?: Record<string, string>
}

function validateEmailLoginData(data: LoginData): ErrorResponse {
  const errors: Record<string, string> = {}
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Valid email is required'
  }
  if (!data.password || data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long'
  }
  return errors
}

async function verifyGoogleToken(credential: string) {
  try {
    // Decode the JWT without verification to get payload
    const decoded = jwt.decode(credential) as any
    
    if (!decoded) {
      throw new Error('Invalid Google token')
    }

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
      emailVerified: tokenInfo.email_verified
    }
  } catch (error) {
    logger.error('Google token verification failed', error)
    throw new Error('Invalid Google token')
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const data: LoginData = req.body
  logger.info(`Login attempt: ${data.authMethod === 'google' ? 'Google OAuth' : data.email}`)

  try {
    const db = await getDatabase()
    const usersCollection = db.collection('users')
    let user = null

    if (data.authMethod === 'google' && data.googleCredential) {
      // Handle Google OAuth login
      try {
        const googleUser = await verifyGoogleToken(data.googleCredential)
        
        // Find user by email or Google ID
        user = await usersCollection.findOne({
          $or: [
            { email: googleUser.email },
            { googleId: googleUser.googleId }
          ]
        })

        if (!user) {
          return res.status(401).json({ 
            message: 'Account not found. Please sign up first.',
            requireSignup: true
          })
        }

        // Update user with Google info if not already set
        if (!user.googleId) {
          await usersCollection.updateOne(
            { _id: user._id },
            {
              $set: {
                googleId: googleUser.googleId,
                profilePicture: googleUser.picture,
                emailVerified: true,
                lastLogin: new Date()
              }
            }
          )
        } else {
          // Update last login
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          )
        }

        logger.info(`Google login successful: ${googleUser.email}`)
        
      } catch (googleError) {
        logger.error('Google authentication failed', googleError)
        return res.status(401).json({ message: 'Google authentication failed' })
      }

    } else {
      // Handle traditional email/password login
      const errors = validateEmailLoginData(data)
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors })
      }

      user = await usersCollection.findOne({ email: data.email })

      if (!user) {
        return res.status(401).json({ message: 'Email not found' })
      }

      if (!user.password) {
        return res.status(401).json({ 
          message: 'This account uses Google sign-in. Please use Google to log in.' 
        })
      }

      const passwordMatch = await bcrypt.compare(data.password!, user.password)
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Incorrect password, Try again' })
      }

      // Update last login
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        userType: user.userType 
      },
      JWT_SECRET as string,
      { expiresIn: JWT_EXPIRATION }
    )

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userType: user.userType,
        userId: user._id,
        email: user.email,
        name: user.firstName ? `${user.firstName} ${user.lastName}` : user.name,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified || false
      }
    })
  } catch (error) {
    logger.error('Login error', error)
    console.error('Login API error:', error)
    return res.status(500).json({ message: 'Server error, please try again later' })
  }
}

export default handler