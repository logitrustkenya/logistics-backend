"use strict";
// import type { NextApiRequest, NextApiResponse } from 'next'
// import { getDatabase } from '../../lib/mongodb/connect'
// import bcrypt from 'bcrypt'
// import jwt from 'jsonwebtoken'
// import logger from '../../lib/utils/logger'
// interface LoginData {
//   email: string
//   password: string
// }
// const JWT_SECRET = 'ca0e70b4a83f9477Qazxdfe45e6f62678bv-lhu-b1a3344zxxcffga933b85b967274d93c6c3c61a5b784ea1f5a5e1'
// // const JWT_EXPIRATION = '1h'
// interface ErrorResponse {
//   message?: string
//   errors?: Record<string, string>
// }
// function validateLoginData(data: LoginData): ErrorResponse {
//   const errors: Record<string, string> = {}
//   if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
//     errors.email = 'Valid email is required'
//   }
//   if (!data.password || data.password.length < 8) {
//     errors.password = 'Password must be at least 8 characters long'
//   }
//   return errors
// }
// async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' })
//   }
//   const data: LoginData = req.body
//   logger.info(`Login attempt: ${data.email}`)
//   const errors = validateLoginData(data)
//   if (Object.keys(errors).length > 0) {
//     return res.status(400).json({ errors })
//   }
//   try {
//     const db = await getDatabase()
//     const usersCollection = db.collection('users')
//     const user = await usersCollection.findOne({ email: data.email })
//     if (!user) {
//       return res.status(401).json({ message: 'Email not found' })
//     }
//     const passwordMatch = await bcrypt.compare(data.password, user.password)
//     if (!passwordMatch) {
//       return res.status(401).json({ message: 'Incorrect password, Try again' })
//     }
//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: user._id, email: user.email },
//       JWT_SECRET as string,
//       { expiresIn: '1h' }
//     )
//     return res.json({
//       success: true,
//       message: 'Login was successful, token generated',
//       token,
//       user: {
//         userType: user.userType,
//         userId: user._id,
//         email: user.email,
//         name: user.firstName + ' ' + user.lastName,
//       }
//     })
//   } catch (error) {
//     logger.error('Login error', error)
//     console.error('Login API error:', error)
//     return res.status(500).json({ message: 'Server error, please try again later' })
//   }
// }
// export default handler
