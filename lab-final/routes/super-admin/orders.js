const express = require("express");
let router = express.Router();
const Order = require("../../models/Order");

// GET /super-admin/orders
router.get("/orders", async (req, res) => {
  try {
    // Fetch all orders, sorted by newest first
    const orders = await Order.find().sort({ createdAt: -1 });
    
    return res.render("super-admin/orders/list", {
      layout: "super-admin-layout",
      orders: orders,
      title: "Manage Orders"
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).send("Server Error");
  }
});

// GET /super-admin/orders/:id
router.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user");
    if (!order) {
      return res.status(404).send("Order not found");
    }
    return res.render("super-admin/orders/view", {
      layout: "super-admin-layout",
      order: order,
      title: "Order Details"
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    return res.status(500).send("Server Error");
  }
});

// POST /super-admin/orders/:id/status
router.post("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    return res.redirect("/super-admin/orders/" + req.params.id);
  } catch (err) {
    console.error("Error updating order status:", err);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
