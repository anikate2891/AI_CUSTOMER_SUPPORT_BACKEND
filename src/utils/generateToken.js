import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

export default async function sendTokenResponse(user, res, message) {
  const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
  httpOnly: true,
  sameSite: "none",    // ✅ lax se none karo
  secure: true,        // ✅ none ke saath secure: true zaruri hai
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
}