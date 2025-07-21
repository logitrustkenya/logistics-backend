// lib/services/user.ts
import { getDatabase } from '../mongodb/connect'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcrypt'
import logger from '../utils/logger'

export interface UserData {
  userType: string
  firstName: string
  lastName: string
  name?: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber?: string
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
  googleId?: string
  profilePicture?: string
  authMethod?: 'email' | 'google'
}

export async function checkUserExists(email: string) {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ email })
    return !!user
  } catch (error) {
    logger.error('Error checking user existence', error)
    throw error
  }
}

export async function createUser(userData: UserData) {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection('users')

    // Hash password if provided (for email signup)
    let hashedPassword = null
    if (userData.password) {
      hashedPassword = await bcrypt.hash(userData.password, 12)
    }

    const newUser = {
      userType: userData.userType,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      name: userData.name || `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      ...(hashedPassword && { password: hashedPassword }),
      phoneNumber: userData.phoneNumber || '',
      emailVerified: userData.authMethod === 'google', // Google emails are pre-verified
      authMethod: userData.authMethod || 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Optional fields based on user type
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
      ...(userData.insuranceNumber && { insuranceNumber: userData.insuranceNumber }),
      ...(userData.verificationToken && { verificationToken: userData.verificationToken }),
      ...(userData.googleId && { googleId: userData.googleId }),
      ...(userData.profilePicture && { profilePicture: userData.profilePicture })
    }

    const result = await usersCollection.insertOne(newUser)
    logger.info(`User created successfully: ${userData.email}`)
    
    return { ...newUser, _id: result.insertedId }
  } catch (error) {
    logger.error('Error creating user', error)
    throw error
  }
}

export async function getUserById(userId: string) {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    return user
  } catch (error) {
    logger.error('Error getting user by ID', error)
    throw error
  }
}

export async function getUserByEmail(email: string) {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ email })
    return user
  } catch (error) {
    logger.error('Error getting user by email', error)
    throw error
  }
}

export async function updateUser(userId: string, updateData: Partial<UserData>) {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection('users')
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )
    
    return result.modifiedCount > 0
  } catch (error) {
    logger.error('Error updating user', error)
    throw error
  }
}
