import { error } from "console"
import sanitizeHtml from 'sanitize-html'
interface ValidationErrors {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    password?: string
    confirmPassword?: string
    agreeTerms?: string
    companyName?: string
    companyType?: string
    businessRegistration?: string
    courierCompanyName?: string
    licenseNumber?: string
    serviceType?: string
    experience?: string
    coverage?: string
    driverLicense?: string
    vehicleType?: string
    vehicleRegistration?: string
    insuranceNumber?: string
}

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

function sanitizeInput(input: string): string{
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {},

    }).trim()
}
export function validateCommonFields(data: SignupData): ValidationErrors {
    const errors: ValidationErrors = {}
    const sanitizedFirstName = sanitizeInput(data.firstName)
    const sanitizedLastName = sanitizeInput(data.lastName)
    const sanitizedEmail = sanitizeInput(data.email)
    const sanitizedPhoneNumber = sanitizeInput(data.phoneNumber)

    if(!sanitizedFirstName) {
        errors.firstName = "First name is required"
    } else if (!/^[a-zA-Z\s-]{2,50}$/.test(sanitizedFirstName)){
        errors.firstName = "First name must be 2-50 characters, letters, spaces or hyphens"
    }
    
    if (!sanitizedLastName) {
        errors.lastName = "Last name is required"
    } else if (!/^[a-zA-Z\s-]{2,50}$/.test(sanitizedLastName)) {
        errors.lastName = "Last name must be 2-50 characters, letters, spaces, or hyphens only"
    }

    if (!sanitizedEmail) {
        errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        errors.email = "Invalid email format"
    }

    if (!sanitizedPhoneNumber) {
        errors.phoneNumber = "Phone number is required"
    } else if (!/^\+?\d{10,15}$/.test(sanitizedPhoneNumber)) {
        errors.phoneNumber = "Phone number must be 10-15 digits, optionally starting with +"
    }
    if(data.password.length < 8){
        errors.password = "Password must be at least 8 characters long"
    }
    if(data.password !== data.confirmPassword || !data.confirmPassword){
        errors.confirmPassword = "Passwords do not match"
    }
    if(!data.agreeTerms){
        errors.agreeTerms = "You must agree to the terms"
    }

    return errors
}

export function validateCourierFields(data: SignupData): ValidationErrors {
    const errors: ValidationErrors = {}
    const sanitizedCourierCompanyName = data.courierCompanyName ? sanitizeInput(data.courierCompanyName): ""
    const sanitizedLicenseNumber = data.licenseNumber ? sanitizeInput(data.courierCompanyName) : ""
    const sanitizedCoverage = data.coverage ? sanitizeInput(data.coverage) : ""

    if (!sanitizedCourierCompanyName) {
        errors.courierCompanyName = "Company name is required"
    } else if (!/^[a-zA-Z0-9\s&-]{3,100}$/.test(sanitizedCourierCompanyName)) {
        errors.courierCompanyName = "Company name must be 3-100 characters, letters, numbers, spaces, &, or -"
    }

    if (data.serviceType && !["logistics", "warehousing", "freight", "customs", "packaging", "other"].includes(data.serviceType)) {
        errors.serviceType = "Invalid service type"
    }

    if (!sanitizedLicenseNumber) {
        errors.licenseNumber = "License number is required"
    } else if (!/^[a-zA-Z0-9-]{5,50}$/.test(sanitizedLicenseNumber)) {
        errors.licenseNumber = "License number must be 5-50 alphanumeric characters or hyphens"
    }

    if (!sanitizedCoverage) {
        errors.coverage = "Coverage area is required"
    } else if (!/^[a-zA-Z0-9\s,.-]{5,200}$/.test(sanitizedCoverage)) {
        errors.coverage = "Coverage area must be 5-200 characters, letters, numbers, spaces, commas, or periods"
    }

    if (data.experience && !["0-2", "3-5", "6-10", "10+"].includes(data.experience)) {
        errors.experience = "Invalid experience range"
    }

  return errors
}

export function validateDeliveryManFields(data: SignupData): ValidationErrors {
    const errors: ValidationErrors = {}
    const sanitizedDriverLicense = data.driverLicense ? sanitizeInput(data.driverLicense) : ""
    const sanitizedVehicleRegistration = data.vehicleRegistration ? sanitizeInput(data.vehicleRegistration) : ""
    const sanitizedInsuranceNumber = data.insuranceNumber ? sanitizeInput(data.insuranceNumber) : ""
    if (!sanitizedDriverLicense) {
    errors.driverLicense = "Driver's license is required"
  } else if (!/^[a-zA-Z0-9-]{5,50}$/.test(sanitizedDriverLicense)) {
    errors.driverLicense = "Driver's license must be 5-50 alphanumeric characters or hyphens"
  }

  if (data.vehicleType && !["motorcycle", "car", "van", "pickup", "truck", "bicycle"].includes(data.vehicleType)) {
    errors.vehicleType = "Invalid vehicle type"
  }

  if (!sanitizedVehicleRegistration) {
    errors.vehicleRegistration = "Vehicle registration is required"
  } else if (!/^[a-zA-Z0-9-]{5,50}$/.test(sanitizedVehicleRegistration)) {
    errors.vehicleRegistration = "Vehicle registration must be 5-50 alphanumeric characters or hyphens"
  }

  if (!sanitizedInsuranceNumber) {
    errors.insuranceNumber = "Insurance number is required"
  } else if (!/^[a-zA-Z0-9-]{5,50}$/.test(sanitizedInsuranceNumber)) {
    errors.insuranceNumber = "Insurance number must be 5-50 alphanumeric characters or hyphens"
  }

  return errors
}

export function ValidateSMEFields(data: SignupData): ValidationErrors {
    const errors: ValidationErrors = {}
    const sanitizedCompanyName = data.companyName ? sanitizeInput(data.companyName): ""
    if (!sanitizedCompanyName) {
    errors.companyName = "Company name is required"
  } else if (!/^[a-zA-Z0-9\s&-]{3,100}$/.test(sanitizedCompanyName)) {
    errors.companyName = "Company name must be 3-100 characters, letters, numbers, spaces, &, or -"
  }

  if (data.companyType && !["retail", "manufacturing", "agriculture", "technology", "services", "other"].includes(data.companyType)) {
    errors.companyType = "Invalid company type"
  }

  if (data.businessRegistration && !/^[a-zA-Z0-9-]{5,50}$/.test(sanitizeInput(data.businessRegistration))) {
    errors.businessRegistration = "Business registration must be 5-50 alphanumeric characters or hyphens"
  }
  if (data.experience && !["0-2", "3-5", "6-10", "10+"].includes(data.experience)) {
    errors.experience = "Invalid experience range"
  }

  return errors
}

export function validateSignupData(data: SignupData): ValidationErrors{
    let errors = validateCommonFields(data)

    switch (data.userType){
        case "sme":
            errors = {...errors, ...ValidateSMEFields(data)}
            break
        case "courier":
            errors = {...errors, ...validateCourierFields(data)}
            break
        case "delivery":
            errors = {...errors, ...validateDeliveryManFields(data)}
            break
    }
    return errors
}