import logger from "../utils/logger.js";
import { Op } from "sequelize";
import User from "../models/userModel.js";
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;
const hashPassword = async (password) => {
  const salt = bcrypt.genSaltSync(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists by email
    const existingUser = await User.findOne({
      where: { email: { [Op.iLike]: email } },
    });

    if (existingUser) {
      logger.warn(
        `Registration attempt failed for email: ${email}. Reason: Email already in use.`
      );
      return res.status(400).json({
        message: "Email already in use. Please try with a different email.",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    logger.info(`Account created successfully for user: ${newUser.userId}`);

    const createUserResponse = newUser.toJSON();
    delete createUserResponse.password;

    return res.status(201).json({
      message: "Account created successfully",
      data: createUserResponse,
    });
  } catch (error) {
    logger.error(`Error during user registration: ${error.message}`, {
      stack: error.stack,
      details: error.errors || null,
    });

    if (error.errors) {
      return res.status(400).json({
        message: "Validation Error",
        errors: error.errors.map((err) => ({
          message: err.message,
          path: err.path,
        })),
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const generateRefreshToken = (data) => {
  return jwt.sign({ data }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "1d",
  });
};


export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Get the IP address of the user attempting to login
    const ipaddress = req.headers["x-forwarded-for"]
      ? req.headers["x-forwarded-for"].split(",")[0]
      : req.connection.remoteAddress;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide both email and password",
      });
    }

    // Find user by email (case-insensitive)
    const currentUser = await User.findOne({
      where: { email: { [Op.iLike]: email } },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "Invalid  email or password" });
    }

    // Handle account lockout if there are too many failed login attempts
    if (currentUser.failedAttempts >= 3) {
      const lockDuration = 30 * 60 * 1000; 
      const timePassed = new Date() - new Date(currentUser.lockTime);

      if (timePassed < lockDuration) {
        const timeLeft = lockDuration - timePassed;
        const minutesLeft = Math.ceil(timeLeft / 60000);
        return res.status(403).json({
          message: `Account temporarily locked. Try again after ${minutesLeft} minute${
            minutesLeft > 1 ? "s" : ""
          }.`,
        });
      } else {
        // Reset failed attempts if lock duration has passed
        currentUser.failedAttempts = 0;
        currentUser.lockTime = null;
        await currentUser.save();
      }
    }

    // Check if the password is correct
    const isMatch = await comparePassword(password, currentUser.password);
    if (!isMatch) {
      currentUser.failedAttempts += 1;
      if (currentUser.failedAttempts >= 3) {
        currentUser.lockTime = new Date();
        logger.error(
          `Account locked for user with email: ${email} due to multiple failed login attempts from IP: ${ipaddress}`
        );
      }
      await currentUser.save();
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Reset failed attempts if login is successful
    currentUser.failedAttempts = 0;
    currentUser.lockTime = null;
    currentUser.lastLogin = new Date();
    await currentUser.save();

    if (currentUser.status !== "1") {
      logger.error(
        `Account with email: ${email} is inactive and tried to log in from IP: ${ipaddress}`
      );
      return res.status(403).json({ message: "Account is inactive" });
    }

    // Generate JWT token and refresh token
    const token = jwt.sign(
      {
        id: currentUser.userId,
        status: currentUser.status,
        email: currentUser.email,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    const refreshToken = generateRefreshToken(currentUser.userId);

    // Log successful login
    logger.info(
      `User with email: ${email} logged in successfully from IP: ${ipaddress}`
    );

    // Send cookies with JWT and refresh token
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Enable secure cookies in production
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000, // 1 hour expiration
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Enable secure cookies in production
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000 * 24, // 24 hours expiration
    });

    // Respond with success
    res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: currentUser.userId,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        email: currentUser.email,
        role: currentUser.status,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    console.log(req.currentUser)
    const  userId  = req.currentUser.id;

    // Find user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user details
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;

    // Save updated user
    await user.save();

    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.currentUser.id;

    // Find user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userResponseData = user.toJSON();
    delete userResponseData.password
    delete userResponseData.failedAttempts
    delete userResponseData.lockTime
    return res.status(200).json({ data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}


export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken ;
  console.log(token,"refresh token called");
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
if (!decoded || !decoded.data) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    const currentUser = await User.findOne({ where: { userId: decoded.data } });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const newToken = jwt.sign(
      {   id: currentUser.userId,
        status: currentUser.status,
        email: currentUser.email, },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
   
  res.cookie('token', newToken, {
    httpOnly: true, 
    secure: false,   
    sameSite: 'Strict',
    maxAge: 60 * 60 * 1000 
  });
    res.status(200).json({ message: 'Token refreshed', token: newToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}