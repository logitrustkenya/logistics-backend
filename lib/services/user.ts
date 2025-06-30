import { Collection, Db } from "mongodb"
import bcrypt from 'bcrypt'
import { getDatabase } from '../mongodb/connect'

interface SignupData {
    userType: string
    firstName: string
    lastName: string
    email: string
    password: string
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

export async function checkUserExists(email: string): Promise<boolean> {
    const db = await getDatabase() 
    const usersCollection = db.collection('users')
    const existingUser = await usersCollection.findOne({email})
    return !!existingUser
}

export async function createUser(data: SignupData): Promise<void> {
    const db = await getDatabase()
    const usersCollection = db.collection('users')

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const userData = {
        userType: data.userType,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        phoneNumber: data.phoneNumber,
        agreeTerms: data.agreeTerms,
        createdAt: new Date(),
        ...(data.userType === "sme" && {
        companyName: data.companyName,
        companyType: data.companyType,
        businessRegistration: data.businessRegistration,
        }),
        ...(data.userType === "courier" && {
        courierCompanyName: data.courierCompanyName,
        serviceType: data.serviceType,
        licenseNumber: data.licenseNumber,
        experience: data.experience,
        coverage: data.coverage,
        }),
        ...(data.userType === "delivery" && {
        driverLicense: data.driverLicense,
        vehicleType: data.vehicleType,
        vehicleRegistration: data.vehicleRegistration,
        insuranceNumber: data.insuranceNumber,
        }),
    }
    await usersCollection.insertOne(userData)
}