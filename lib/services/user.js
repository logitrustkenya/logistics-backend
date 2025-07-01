const bcrypt = require("bcryptjs");
const { getDB } = require("../mongodb/connect");

async function checkUserExists(email) {
  try {
    const db = await getDB();
    const users = db.collection("users");
    const user = await users.findOne({ email: email.toLowerCase() });
    return !!user;
  } catch (error) {
    console.error("Error checking user existence:", error);
    throw error;
  }
}

async function createUser(userData) {
  try {
    const db = await getDB();
    const users = db.collection("users");
    
    // Hash password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    const user = {
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      userType: userData.userType,
      firstName: userData.firstName,
      lastName: userData.lastName,
      verificationToken: userData.verificationToken,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await users.insertOne(user);
    return result;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

async function verifyUser(token) {
  try {
    const db = await getDB();
    const users = db.collection("users");
    
    const result = await users.updateOne(
      { verificationToken: token },
      { 
        $set: { 
          isVerified: true, 
          updatedAt: new Date() 
        },
        $unset: { verificationToken: "" }
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error verifying user:", error);
    throw error;
  }
}

async function findUserByEmail(email) {
  try {
    const db = await getDB();
    const users = db.collection("users");
    return await users.findOne({ email: email.toLowerCase() });
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}

module.exports = {
  checkUserExists,
  createUser,
  verifyUser,
  findUserByEmail
};
