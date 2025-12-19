const express = require("express");
let router = express.Router();
const Product = require("../../models/Product");
const Order = require("../../models/Order");
const User = require("../../models/User");

router.get("/", async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    // Check if Order model exists and has data, otherwise default to 0
    let orderCount = 0;
    try {
        orderCount = await Order.countDocuments();
    } catch (e) {
        console.log("Order model might not exist or have issues", e);
    }
    
    const userCount = await User.countDocuments();

    return res.render("super-admin/dashboard", {
      layout: "super-admin-layout",
      productCount,
      orderCount,
      userCount,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.render("super-admin/dashboard", {
      layout: "super-admin-layout",
      productCount: 0,
      orderCount: 0,
      userCount: 0,
      error: "Failed to load dashboard data",
    });
  }
});

module.exports = router;
