export const businessLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingBusiness = await businessModel.findOne({ businessEmail: email }).select("+businessPassword");

    if (!existingBusiness)
      return res.status(404).json({ message: "Business with that email doesn't exist" });

    const comparedPassword = await bcrypt.compare(password, existingBusiness.businessPassword);
    if (!comparedPassword)
      return res.status(401).json({ message: "Invalid credentials" });
    if (!existingBusiness.isVerified) 
      return res.status(403).json({ message: "business not verified" });

    const token = jwt.sign({ businessId: existingBusiness._id }, config.JWT_SECRET, { expiresIn: '7d' })
    
    res.cookie("businessToken", token, {
      httpOnly: true,
      sameSite: "none",  // ✅
      secure: true,      // ✅
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Business loggedIn successfully",
      user: {
        id: existingBusiness._id,
        organization: existingBusiness.organization,
        email: existingBusiness.businessEmail,
      }
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
};