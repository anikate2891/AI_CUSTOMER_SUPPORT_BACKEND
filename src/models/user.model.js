import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    fullname: { type: String, required: true },
    googleId: { type: String },
    isVerified: { type: Boolean, default: false },
    businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'business',
    default: null
}
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
});

const userModel = mongoose.model("Users", userSchema);
export default userModel;
