const asyncHandler = require("express-async-handler");
const User = require("../models/Users");
const Token = require("../models/Token");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");



const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

const registerUser = asyncHandler(async (req, res) => {

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please fill up the all required fields");
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error("Password must be up to 6 characters");
    }

    // Check if users already exists
    const userExists = await User.findOne({ email })

    if (userExists) {
        res.status(400);
        throw new Error("Email has already been registered");
    }

    // create new user
    const user = await User.create({
        name,
        email,
        password
    })

    //   Generate Token
    const token = generateToken(user._id);

    // Send HTTP-only cookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none",
        secure: true,
    })

    if (user) {
        const { _id, name, email, profilePic, bio } = user;
        res.status(201).json({
            _id,
            name,
            email,
            profilePic,
            bio,
            token
        })
    } else {
        res.status(400);
        throw new Error("Invalied user data")
    }


});


const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    // validate request
    if (!email || !password) {
        res.status(400);
        throw new Error("Pleace add email and password");
    }

    // Check if user is exites
    const user = await User.findOne({ email });

    if (!user) {
        res.status(400);
        throw new Error("User not found, please register");
    }

    // Check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    //   Generate Token
    const token = generateToken(user._id);

    if (passwordIsCorrect) {

        // Send HTTP-only cookie
        res.cookie("token", token, {
            path: "/",
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 86400), // 1 day
            sameSite: "none",
            secure: true,
        });
    }

    if (user && passwordIsCorrect) {
        const { _id, name, email, profilePic, bio } = user;
        res.status(200).json({
            _id,
            name,
            email,
            profilePic,
            bio,
            token,
        });
    } else {
        res.status(400);
        throw new Error("Invalid email or password");
    }

});


const logout = asyncHandler(async (req, res) => {

    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        secure: true,
    })

    res.status(200).json({ message: "Successfully Logged Out" });

});


const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error("User does not exist");
    }

    // Delete token if it exists in DB
    let token = await Token.findOne({ userId: user._id });
    if (token) {
        await token.deleteOne();
    }

    // Create Reste Token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

    // Hash token before saving to DB
    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    // Save Token to DB
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
    }).save();

    // Construct Reset Url
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    // Reset Email
    const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the url below to reset your password</p>  
        <p>This reset link is valid for only 30minutes.</p>
  
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
  
        <p>Regards...</p>
        <p>Sk Coder</p>
      `;
    const subject = "Password Reset Request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try {
        await sendEmail(sent_from, send_to, subject, message);
        res.status(200).json({ success: true, message: "Reset Email Sent" });
    } catch (error) {
        res.status(500);
        throw new Error("Email not sent, please try again");
    }

})

const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { resetToken } = req.params;

    // Hash token, then compare to Token in DB
    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    // fIND tOKEN in DB
    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: { $gt: Date.now() },
    });

    if (!userToken) {
        res.status(404);
        throw new Error("Invalid or Expired Token");
    }

    // Find user
    const user = await User.findOne({ _id: userToken.userId });
    user.password = password;
    await user.save();
    res.status(200).json({
        message: "Password Reset Successful, Please Login",
    });

})

const changePassword = asyncHandler(async (req, res) => {


    const user = await User.findById(req.user._id);
    const { oldPassword, password } = req.body;

    if (!user) {
        res.status(400);
        throw new Error("User not found, Please signup")
    }

    if (!oldPassword || !password) {
        res.status(400);
        throw new Error("Please add old and new password");
    }

    if (oldPassword === password) {
        res.status(400);
        throw new Error("Old and new password are same, Please change diffirent password")
    }

    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

    if (user && passwordIsCorrect) {
        user.password = password;
        await user.save();
        res.status(200).send("Password change successfully");
    } else {
        res.status(400);
        throw new Error("Old password is incorrect");
    }

});



module.exports = {
    registerUser, loginUser, logout, forgotPassword,
    resetPassword, changePassword
};
