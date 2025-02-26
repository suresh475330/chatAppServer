const asyncHandler = require("express-async-handler");
const User = require("../models/Users");


const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        const { _id, name, email, profilePic, bio } = user;
        res.status(200).json({
            _id,
            name,
            email,
            profilePic,
            bio,
        });
    } else {
        res.status(400);
        throw new Error("User Not Found");
    }
});

const updateUser = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (user) {

        const { name, email, profilePic, bio } = user;
        user.email = email;
        user.name = req.body.name || name;
        user.profilePic = req.body.profilePic || profilePic;
        user.bio = req.body.bio || bio;

        const updatedUser = await user.save();
        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            bio: updatedUser.bio,
        })
    } else {
        res.status(404);
        throw new Error("User not found")
    }

})

module.exports = {getUser, updateUser};