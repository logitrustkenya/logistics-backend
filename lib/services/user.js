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
const bcrypt_1 = __importDefault(require("bcrypt"));
const connect_1 = require("../mongodb/connect");
function checkUserExists(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield (0, connect_1.getDatabase)();
        const usersCollection = db.collection('users');
        const existingUser = yield usersCollection.findOne({ email });
        return !!existingUser;
    });
}
function createUser(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield (0, connect_1.getDatabase)();
        const usersCollection = db.collection('users');
        const hashedPassword = yield bcrypt_1.default.hash(data.password, 10);
        const userData = Object.assign(Object.assign(Object.assign(Object.assign({ userType: data.userType, firstName: data.firstName, lastName: data.lastName, email: data.email, password: hashedPassword, phoneNumber: data.phoneNumber, agreeTerms: data.agreeTerms, createdAt: new Date() }, (data.userType === "sme" && {
            companyName: data.companyName,
            companyType: data.companyType,
            businessRegistration: data.businessRegistration,
        })), (data.userType === "courier" && {
            courierCompanyName: data.courierCompanyName,
            serviceType: data.serviceType,
            licenseNumber: data.licenseNumber,
            experience: data.experience,
            coverage: data.coverage,
        })), (data.userType === "delivery" && {
            driverLicense: data.driverLicense,
            vehicleType: data.vehicleType,
            vehicleRegistration: data.vehicleRegistration,
            insuranceNumber: data.insuranceNumber,
        })), (data.verificationToken && {
            verificationToken: data.verificationToken,
            isVerified: false,
        }));
        yield usersCollection.insertOne(userData);
    });
}
