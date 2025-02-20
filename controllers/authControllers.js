const asyncHandler = require("express-async-handler");
const User = require("../models/Users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


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
        const { _id, name, email, profilePic,bio } = user;
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


module.exports = { registerUser, loginUser, logout };
