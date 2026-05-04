import userModel from "../models/user.model.js";
import { config } from "../config/config.js";
import sendTokenResponse from "../utils/generateToken.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import sendEmail from "../config/sendEmail.config.js";

export const registerController = async (req, res) => {
  const { email, password, fullname, iscustomer } = req.body;
  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with this email." });
    }

    const user = await userModel.create({
      email,
      password,
      fullname,
      role: iscustomer ? "customer" : "company",
    });

    // 2. Generate Token
    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '7d' });

    res.cookie("token", token, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 3. Send Response
    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });

    // 4. Send Email in background
    try {
      const verifyUrl = `http://localhost:8000/api/auth/verify-email?token=${token}`;
      sendEmail(
        email,
        "Verify Your SupportAI Account",
        `Hi ${fullname}, please verify your email: ${verifyUrl}`,
        `<h1>Welcome ${fullname}!</h1><p>Please click below to verify your email:</p><a href="${verifyUrl}">Verify Email</a>`
      ).catch(e => console.error("Background Customer Email Error:", e.message));
    } catch (e) {}
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Registration failed.", error: error.message });
  }
};

export const loginController = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch); // ← add karo
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.isVerified && !user.googleId) {
      return res.status(401).json({ message: "Please verify your email before logging in." });
    }

    await sendTokenResponse(user, res);
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Login failed.", error: error.message });
  }
};

export const getMeController = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res
      .status(200)
      .json({ message: "User details fetched successfully.", user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch user details.", error: error.message });
  }
};

export const googleCallbackController = async (req, res) => {
  const { id, emails, displayName, photos } = req.user;
  const email = emails[0].value;
  const profilePic = photos[0].value;

  try {
    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({
        email,
        fullname: displayName,
        googleId: id,
      });
    }

    // ✅ Bahar nikalo — har user ke liye token bane
    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ Sahi options ke saath cookie set karo
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // role ke basis pe redirect karo
    if (user.role === "customer") {
      return res.redirect("http://localhost:5173/customer");
    } else {
      return res.redirect("http://localhost:5173/admin");
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Google authentication failed.", error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "Invalid token" });

    user.isVerified = true;
    await user.save();

    return res.redirect("http://localhost:5173/login");
  } catch (error) {
    return res.status(400).json({ message: "Verification failed or token expired." });
  }
};

export const logoutController = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  });
  return res.status(200).json({ message: 'Logged out successfully' });
};
