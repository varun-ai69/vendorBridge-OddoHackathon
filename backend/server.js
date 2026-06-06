require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

const { connectDB } = require("./db/db");
const errorHandler = require("./middlewares/errorHandler");

// Import Route Files
const authRoutes = require("./routes/auth.routes");
const orgRoutes = require("./routes/org.routes");
const userRoutes = require("./routes/user.routes");
const vendorRoutes = require("./routes/vendor.routes");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.use(cors());
    app.use(express.json()); //Middleware to parse JSON bodies

    // Base routes
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/org", orgRoutes);
    app.use("/api/v1/admin/users", userRoutes);
    app.use("/api/v1", vendorRoutes);

    // Global Error Handler
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}` //server start only after successful DB connection if failed server stops
      );
    });

  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );
    process.exit(1);
  }
};

startServer();