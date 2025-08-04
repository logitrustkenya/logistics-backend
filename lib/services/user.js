"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserExists = checkUserExists;
exports.createUser = createUser;
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
exports.updateUser = updateUser;
// lib/services/user.ts
const connect_1 = require("../mongodb/connect");
const mongodb_1 = require("mongodb");
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = __importDefault(require("../utils/logger"));
function checkUserExists(email) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield (0, connect_1.getDatabase)();
            const usersCollection = db.collection('users');
            const user = yield usersCollection.findOne({ email });
            return !!user;
        }
        catch (error) {
            logger_1.default.error('Error checking user existence', error);
            throw error;
        }
    });
}
function createUser(userData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield (0, connect_1.getDatabase)();
            const usersCollection = db.collection('users');
            // Hash password if provided (for email signup)
            let hashedPassword = null;
            if (userData.password) {
                hashedPassword = yield bcrypt_1.default.hash(userData.password, 12);
            }
            const newUser = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ userType: userData.userType, firstName: userData.firstName || '', lastName: userData.lastName || '', name: userData.name || `${userData.firstName} ${userData.lastName}`, email: userData.email }, (hashedPassword && { password: hashedPassword })), { phoneNumber: userData.phoneNumber || '', emailVerified: userData.authMethod === 'google', authMethod: userData.authMethod || 'email', createdAt: new Date(), updatedAt: new Date() }), (userData.companyName && { companyName: userData.companyName })), (userData.companyType && { companyType: userData.companyType })), (userData.businessRegistration && { businessRegistration: userData.businessRegistration })), (userData.courierCompanyName && { courierCompanyName: userData.courierCompanyName })), (userData.serviceType && { serviceType: userData.serviceType })), (userData.licenseNumber && { licenseNumber: userData.licenseNumber })), (userData.experience && { experience: userData.experience })), (userData.coverage && { coverage: userData.coverage })), (userData.driverLicense && { driverLicense: userData.driverLicense })), (userData.vehicleType && { vehicleType: userData.vehicleType })), (userData.vehicleRegistration && { vehicleRegistration: userData.vehicleRegistration })), (userData.insuranceNumber && { insuranceNumber: userData.insuranceNumber })), (userData.verificationToken && { verificationToken: userData.verificationToken })), (userData.googleId && { googleId: userData.googleId })), (userData.profilePicture && { profilePicture: userData.profilePicture }));
            const result = yield usersCollection.insertOne(newUser);
            logger_1.default.info(`User created successfully: ${userData.email}`);
            return Object.assign(Object.assign({}, newUser), { _id: result.insertedId });
        }
        catch (error) {
            logger_1.default.error('Error creating user', error);
            throw error;
        }
    });
}
function getUserById(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield (0, connect_1.getDatabase)();
            const usersCollection = db.collection('users');
            const user = yield usersCollection.findOne({ _id: new mongodb_1.ObjectId(userId) });
            return user;
        }
        catch (error) {
            logger_1.default.error('Error getting user by ID', error);
            throw error;
        }
    });
}
function getUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield (0, connect_1.getDatabase)();
            const usersCollection = db.collection('users');
            const user = yield usersCollection.findOne({ email });
            return user;
        }
        catch (error) {
            logger_1.default.error('Error getting user by email', error);
            throw error;
        }
    });
}
function updateUser(userId, updateData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield (0, connect_1.getDatabase)();
            const usersCollection = db.collection('users');
            const result = yield usersCollection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, {
                $set: Object.assign(Object.assign({}, updateData), { updatedAt: new Date() })
            });
            return result.modifiedCount > 0;
        }
        catch (error) {
            logger_1.default.error('Error updating user', error);
            throw error;
        }
    });
}
