var express = require("express");
var router = express.Router();
const Order = require("../models/Order");

/* GET users listing. */
router.get("/", async function (req, res, next) {
  try {
    const orders = await Order.find({ user: req.session.user._id }).sort({ createdAt: -1 });
    res.render("site/myaccount", { orders });
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

module.exports = router;
