import { Router } from "express";
import { config } from "../config/config.js";
import {
  registerController,
  loginController,
  googleCallbackController,
  getMeController,
  logoutController,
  verifyEmail,
} from "../controllers/auth.controller.js";
import {
  registerValidator,
  loginValidator,
} from "../validators/auth.validator.js";
import passport from "passport";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", registerValidator, registerController);
authRouter.post("/login", loginValidator, loginController);
authRouter.get("/verify-email", verifyEmail);

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${config.FRONTEND_URL}/login`, // 🔴 yahi change karo
  }),
  googleCallbackController,
);

authRouter.get("/me", authenticateUser, getMeController);
authRouter.post("/logout", logoutController);

export default authRouter;
