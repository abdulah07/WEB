const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const config = require("config");

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    // Note: In a real app, we might use config.get("db"), but for this script we'll try to load it or fallback
    // Since we are running this with node, we need to make sure config is loaded correctly or we hardcode for this script if needed.
    // Let's try to use the config module if possible, assuming NODE_ENV is set or defaults work.
    // If config fails, we will fallback to the local string found in development.json
    
    let dbConnection = "mongodb://localhost:27017/fullstack";
    try {
        if(config.has("db")) {
            dbConnection = config.get("db");
        }
    } catch (e) {
        console.log("Config not loaded, using default localhost connection");
    }

    await mongoose.connect(dbConnection);
    console.log("Connected to MongoDB...");

    const email = "superadmin@admin.com";
    const password = "adminpassword123";
    const name = "Super Admin";

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("Super Admin user already exists.");
      console.log("Email:", email);
      // We won't overwrite the password to avoid breaking existing access if it was changed
      console.log("If you need to reset the password, please delete the user manually first.");
    } else {
      // Create new user
      user = new User({
        name,
        email,
        password,
        roles: ["admin", "user"], // Give both roles
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();
      console.log("Super Admin user created successfully!");
      console.log("------------------------------------------------");
      console.log("Email:    " + email);
      console.log("Password: " + password);
      console.log("------------------------------------------------");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error creating super admin:", err);
    process.exit(1);
  }
}

createSuperAdmin();
