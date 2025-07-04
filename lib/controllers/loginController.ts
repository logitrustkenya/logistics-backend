
import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getDatabase } from '../../lib/mongodb/connect'
import logger from '../../lib/utils/logger'

const JWT_SECRET = 'ca0e70b4a83f9477Qazxdfe45e6f62678bv-lhu-b1a3344zxxcffga933b85b967274d93c6c3c61a5b784ea1f5a5e1'
// const JWT_EXPIRATION = '1h'

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Valid email is required' })
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' })
  }

  try {
    const db = await getDatabase()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ email })

    if (!user) {
      return res.status(401).json({ message: 'Email not found' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password, Try again' })
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    return res.status(200).json({
      success: true,
      message: 'Login was successful, token generated.....',
      token,
      user: {
        userType: user.userType,
        userId: user._id,
        email: user.email,
        name: user.firstName + ' ' + user.lastName,
      }
    })
  }
   catch (error) {
    logger.error('Login error', error)
    console.error('Login API error:', error)
    return res.status(500).json({ message: 'Server error, please try again later' })
  }
}

