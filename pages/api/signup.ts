import type { NextApiRequest, NextApiResponse } from 'next'
import { validateSignupData } from '../../lib/utils/validation'
import { checkUserExists, createUser } from '../../lib/services/user'
import { closeMongoDBConnection } from '../../lib/mongodb/connect'

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
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed"})
    }

    const data: SignupData = req.body

    try{
        const errors = validateSignupData(data)
        if(Object.keys(errors).length > 0) {
            return res.status(400).json({ errors})
        }

        const userExits = await checkUserExists(data.email)
        if(userExits) {
            return res.status(400).json({ message: "Email already registered"})
        }

        await createUser(data)
        return res.status(201).json({ message: "User created successfully"})
    } catch(error) {
        console.error("Signup error:", error)
        return res.status(500).json({ message: "Server error, please try again later"})
    } finally{
        await closeMongoDBConnection()
    }
}