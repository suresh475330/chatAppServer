require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler")
const app = express();

// Routes import
const authRoutes = require("./routes/authRoutes")

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());


// Routes middleware
app.use("/api/v1/auth",authRoutes);


// Test Route
app.get("/", (req, res) => {
  res.send("API is running... hello");
});

app.use(errorHandler);

// Server Listen
const PORT = process.env.PORT || 3000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.log(error);
        
    }
}

start();

