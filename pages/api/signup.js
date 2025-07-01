"use strict";

const { validateSignupData } = require("../../lib/utils/validation");
const { checkUserExists, createUser } = require("../../lib/services/user");
const logger = require("../../lib/utils/logger");
const { closeMongoDBConnection } = require("../../lib/mongodb/connect");
const { sendVerificationEmail } = require("../../lib/utils/email");
const crypto = require("crypto");

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const data = req.body;
  logger.info(`Signup attempt: ${data.email} - ${data.userType}`);

  // Validate input data
  const errors = validateSignupData(data);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Check if user already exists
    const userExists = await checkUserExists(data.email);
    if (userExists) {
      return res.status(400).json({ 
        message: "Email already registered" 
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user with verification token
    await createUser({
      ...data,
      verificationToken
    });

    // Send verification email
    await sendVerificationEmail(data.email, verificationToken);

    return res.status(201).json({ 
      message: "User created successfully. Please check your email to verify your account." 
    });

  } catch (error) {
    logger.error("Signup error:", error);
    return res.status(500).json({ 
      message: "Server error, please try again later" 
    });
  } finally {
    
    await closeMongoDBConnection();
  }
}

module.exports = handler;