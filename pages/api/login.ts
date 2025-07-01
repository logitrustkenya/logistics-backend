import type { NextApiRequest, NextApiResponse } from 'next'
import { checkUserExists } from '../../lib/services/user'
import { getDatabase } from '../../lib/mongodb/connect'
import bcrypt from 'bcrypt'
import logger from '../../lib/utils/logger'

interface LoginData {
  email: string
  password: string
}

interface ErrorResponse {
  message?: string
  errors?: Record<string, string>
}

function validateLoginData(data: LoginData): ErrorResponse {
  const errors: Record<string, string> = {}
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Valid email is required'
  }
  if (!data.password || data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long'
  }
  return errors
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const data: LoginData = req.body
  logger.info(`Login attempt: ${data.email}`)

  const errors = validateLoginData(data)
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors })
  }

  try {
    const db = await getDatabase()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ email: data.email })

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Login successful - for now, just return success message
    return res.status(200).json({ message: 'Login successful' })
  } catch (error) {
    logger.error('Login error', error)
    return res.status(500).json({ message: 'Server error, please try again later' })
  }
}

export default handler
