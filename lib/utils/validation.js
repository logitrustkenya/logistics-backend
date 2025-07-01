"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCommonFields = validateCommonFields;
exports.validateCourierFields = validateCourierFields;
exports.validateDeliveryManFields = validateDeliveryManFields;
exports.ValidateSMEFields = ValidateSMEFields;
exports.validateSignupData = validateSignupData;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
function sanitizeInput(input) {
    return (0, sanitize_html_1.default)(input, {
        allowedTags: [],
        allowedAttributes: {},
    }).trim();
}
function validateCommonFields(data) {
    const errors = {};
    const sanitizedFirstName = sanitizeInput(data.firstName);
    const sanitizedLastName = sanitizeInput(data.lastName);
    const sanitizedEmail = sanitizeInput(data.email);
    const sanitizedPhoneNumber = sanitizeInput(data.phoneNumber);
    if (!sanitizedFirstName) {
        errors.firstName = "First name is required";
    }
    else if (!/^[a-zA-Z\s-]{2,50}$/.test(sanitizedFirstName)) {
        errors.firstName = "First name must be 2-50 characters, letters, spaces or hyphens";
    }
    if (!sanitizedLastName) {
        errors.lastName = "Last name is required";
    }
    else if (!/^[a-zA-Z\s-]{2,50}$/.test(sanitizedLastName)) {
        errors.lastName = "Last name must be 2-50 characters, letters, spaces, or hyphens only";
    }
    if (!sanitizedEmail) {
        errors.email = "Email is required";
    }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        errors.email = "Invalid email format";
    }
    if (!sanitizedPhoneNumber) {
        errors.phoneNumber = "Phone number is required";
    }
    else if (!/^\+?\d{10,15}$/.test(sanitizedPhoneNumber)) {
        errors.phoneNumber = "Phone number must be 10-15 digits, optionally starting with +";
    }
    if (data.password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
    }
    if (data.password !== data.confirmPassword || !data.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
    }
    if (!data.agreeTerms) {
        errors.agreeTerms = "You must agree to the terms";
    }
    return errors;
}
function validateCourierFields(data) {
    const errors = {};
    const sanitizedCourierCompanyName = data.courierCompanyName ? sanitizeInput(data.courierCompanyName) : "";
    const sanitizedLicenseNumber = data.licenseNumber ? sanitizeInput(data.licenseNumber) : "";
    const sanitizedCoverage = data.coverage ? sanitizeInput(data.coverage) : "";
    if (!sanitizedCourierCompanyName) {
        errors.courierCompanyName = "Company name is required";
    }
    else if (!/^[a-zA-Z0-9\s&-]{3,100}$/.test(sanitizedCourierCompanyName)) {
        errors.courierCompanyName = "Company name must be 3-100 characters, letters, numbers, spaces, &, or -";
    }
    if (data.serviceType && !["logistics", "warehousing", "freight", "customs", "packaging", "other"].includes(data.serviceType)) {
        errors.serviceType = "Invalid service type";
    }
    if (!sanitizedLicenseNumber) {
        errors.licenseNumber = "License number is required";
    }
    else if (!/^[a-zA-Z0-9-]{5,50}$/.test(sanitizedLicenseNumber)) {
        errors.licenseNumber = "License number must be 5-50 alphanumeric characters or hyphens";
    }
    if (!sanitizedCoverage) {
        errors.coverage = "Coverage area is required";
    }
    else if (!/^[a-zA-Z0-9\s,.-]{5,200}$/.test(sanitizedCoverage)) {
        errors.coverage = "Coverage area must be 5-200 characters, letters, numbers, spaces, commas, or periods";
    }
    if (data.experience && !["0-2", "3-5", "6-10", "10+"].includes(data.experience)) {
        errors.experience = "Invalid experience range";
    }
    return errors;
}
function validateDeliveryManFields(data) {
    const errors = {};
    const sanitizedDriverLicense = data.driverLicense ? sanitizeInput(data.driverLicense) : "";
    const sanitizedVehicleRegistration = data.vehicleRegistration ? sanitizeInput(data.vehicleRegistration) : "";
    const sanitizedInsuranceNumber = data.insuranceNumber ? sanitizeInput(data.insuranceNumber) : "";
    if (!sanitizedDriverLicense) {
        errors.driverLicense = "Driver's license is required";
    }
    else if (!/^[a-zA-Z0-9-]{5,50}$/.test(sanitizedDriverLicense)) {
        errors.driverLicense = "Driver's license must be 5-50 alphanumeric characters or hyphens";
    }
    if (data.vehicleType && !["motorcycle", "car", "van", "pickup", "truck", "bicycle"].includes(data.vehicleType)) {
        errors.vehicleType = "Invalid vehicle type";
    }
    if (!sanitizedVehicleRegistration) {
        errors.vehicleRegistration = "Vehicle registration is required";
    }
    else if (!/^[a-zA-Z0-9-]{5,50}$/.test(sanitizedVehicleRegistration)) {
        errors.vehicleRegistration = "Vehicle registration must be 5-50 alphanumeric characters or hyphens";
    }
    if (!sanitizedInsuranceNumber) {
        errors.insuranceNumber = "Insurance number is required";
    }
    else if (!/^[a-zA-Z0-9-]{5,50}$/.test(sanitizedInsuranceNumber)) {
        errors.insuranceNumber = "Insurance number must be 5-50 alphanumeric characters or hyphens";
    }
    return errors;
}
function ValidateSMEFields(data) {
    const errors = {};
    const sanitizedCompanyName = data.companyName ? sanitizeInput(data.companyName) : "";
    if (!sanitizedCompanyName) {
        errors.companyName = "Company name is required";
    }
    else if (!/^[a-zA-Z0-9\s&-]{3,100}$/.test(sanitizedCompanyName)) {
        errors.companyName = "Company name must be 3-100 characters, letters, numbers, spaces, &, or -";
    }
    if (data.companyType && !["retail", "manufacturing", "agriculture", "technology", "services", "other"].includes(data.companyType)) {
        errors.companyType = "Invalid company type";
    }
    if (data.businessRegistration && !/^[a-zA-Z0-9-]{5,50}$/.test(sanitizeInput(data.businessRegistration))) {
        errors.businessRegistration = "Business registration must be 5-50 alphanumeric characters or hyphens";
    }
    if (data.experience && !["0-2", "3-5", "6-10", "10+"].includes(data.experience)) {
        errors.experience = "Invalid experience range";
    }
    return errors;
}
function validateSignupData(data) {
    let errors = validateCommonFields(data);
    switch (data.userType) {
        case "sme":
            errors = Object.assign(Object.assign({}, errors), ValidateSMEFields(data));
            break;
        case "courier":
            errors = Object.assign(Object.assign({}, errors), validateCourierFields(data));
            break;
        case "delivery":
            errors = Object.assign(Object.assign({}, errors), validateDeliveryManFields(data));
            break;
    }
    return errors;
}
