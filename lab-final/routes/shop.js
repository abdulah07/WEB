var express = require("express");
var router = express.Router();
var Product = require("../models/Product");
var Order = require("../models/Order");
// Product detail page
router.get("/product/:id", async function (req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/");
    }
    return res.render("site/product", { product });
  } catch (err) {
    console.error("Error fetching product:", err);
    req.flash("error", "Unable to load product");
    return res.redirect("/");
  }
});
router.get("/cart", async function (req, res, next) {
  let cart = req.cookies.cart;
  if (!cart) cart = [];

  let cartItems = [];
  let total = 0;

  // If cart is array of IDs, normalize to {productId, quantity} format
  for (let item of cart) {
    if (typeof item === 'string') {
  
      let cartItem = cartItems.find(c => c.productId === item);
      if (cartItem) {
        cartItem.quantity += 1;
      } else {
        cartItems.push({ productId: item, quantity: 1 });
      }
    } else {

      cartItems.push(item);
    }
  }

  // Fetch products and calculate total with quantity
  let products = [];
  for (let item of cartItems) {
    let product = await Product.findById(item.productId);
    if (product) {
      let itemPrice = Number(product.price) * item.quantity;
      total += itemPrice;
      products.push({
        ...product.toObject(),
        quantity: item.quantity,
        itemTotal: itemPrice
      });
    }
  }

  res.render("site/cart", { products, total });
});

// Checkout page
router.get("/checkout", async function (req, res, next) {
  let cart = req.cookies.cart;
  if (!cart) cart = [];

  let cartItems = [];
  let total = 0;

  for (let item of cart) {
    if (typeof item === "string") {
      let existing = cartItems.find((c) => c.productId === item);
      if (existing) existing.quantity += 1;
      else cartItems.push({ productId: item, quantity: 1 });
    } else {
      cartItems.push(item);
    }
  }

  let products = [];
  for (let item of cartItems) {
    let product = await Product.findById(item.productId);
    if (product) {
      let itemPrice = Number(product.price) * item.quantity;
      total += itemPrice;
      products.push({
        ...product.toObject(),
        quantity: item.quantity,
        itemTotal: itemPrice,
      });
    }
  }

  if (!products.length) {
    req.flash("error", "Your cart is empty.");
    return res.redirect("/cart");
  }

  res.render("site/checkout", {
    products,
    total,
    errors: {},
    values: {},
  });
});

// Handle checkout submit
router.post("/checkout", async function (req, res, next) {
  const { fullName, line1, line2, city, state, postalCode, country, phone } =
    req.body;

  const errors = {};
  if (!fullName) errors.fullName = "Please enter your full name.";
  if (!line1) errors.line1 = "Please enter your address.";
  if (!city) errors.city = "Please enter your city.";
  if (!postalCode) errors.postalCode = "Please enter your postal code.";
  if (!country) errors.country = "Please enter your country.";

  let cart = req.cookies.cart;
  if (!cart) cart = [];

  let cartItems = [];
  let total = 0;

  for (let item of cart) {
    if (typeof item === "string") {
      let existing = cartItems.find((c) => c.productId === item);
      if (existing) existing.quantity += 1;
      else cartItems.push({ productId: item, quantity: 1 });
    } else {
      cartItems.push(item);
    }
  }

  let products = [];
  for (let item of cartItems) {
    let product = await Product.findById(item.productId);
    if (product) {
      let unitPrice = Number(product.price);
      let itemTotal = unitPrice * item.quantity;
      total += itemTotal;
      products.push({ product, quantity: item.quantity, unitPrice, itemTotal });
    }
  }

  if (!products.length) {
    errors._global = "Your cart is empty.";
  }

  if (Object.keys(errors).length) {
    return res.render("site/checkout", {
      products: products.map((p) => ({
        ...p.product.toObject(),
        quantity: p.quantity,
        itemTotal: p.itemTotal,
      })),
      total,
      errors,
      values: { fullName, line1, line2, city, state, postalCode, country, phone },
    });
  }

  try {
    const items = products.map((p) => ({
      product: p.product._id,
      name: p.product.name,
      price: p.unitPrice,
      quantity: p.quantity,
      subtotal: p.itemTotal,
    }));

    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const subtotalAmount = total;
    const shippingAmount = 0;
    const taxAmount = 0;
    const totalAmount = subtotalAmount + shippingAmount + taxAmount;

    const order = new Order({
      user: req.session.user ? req.session.user._id : undefined,
      items,
      totalItems,
      subtotalAmount,
      shippingAmount,
      taxAmount,
      totalAmount,
      shippingAddress: {
        fullName,
        line1,
        line2,
        city,
        state,
        postalCode,
        country,
        phone,
      },
      status: "pending",
    });

    await order.save();

    // Clear cart
    res.clearCookie("cart");
    req.flash("success", "Your order has been placed.");
    return res.redirect("/cart");
  } catch (err) {
    console.error("Error creating order:", err);
    req.flash("error", "Unable to complete checkout. Please try again.");
    return res.redirect("/checkout");
  }
});

router.get("/add-cart/:id", function (req, res, next) {
  let cart = req.cookies.cart;
  if (!cart) cart = [];

  // Check if product already exists in cart
  const existingIndex = cart.findIndex(item => {
    const itemId = typeof item === 'string' ? item : item.productId;
    return itemId === req.params.id;
  });

  if (existingIndex !== -1) {
    // Product exists, increment quantity
    if (typeof cart[existingIndex] === 'string') {
      // Convert simple ID to structured format
      cart[existingIndex] = { productId: req.params.id, quantity: 2 };
    } else {
      cart[existingIndex].quantity += 1;
    }
  } else {
    // New product, add to cart
    cart.push(req.params.id);
  }

  res.cookie("cart", cart);
  req.flash("success", "Product Added To Cart");
  res.redirect("/");
});

router.get("/remove-from-cart/:id", function (req, res, next) {
  let cart = req.cookies.cart;
  if (!cart) cart = [];

  // Remove product from cart (removes all quantities)
  cart = cart.filter(item => {
    const itemId = typeof item === 'string' ? item : item.productId;
    return itemId !== req.params.id;
  });

  res.cookie("cart", cart);
  req.flash("success", "Product Removed From Cart");
  res.redirect("/cart");
});

router.post("/update-cart/:id", function (req, res, next) {
  let cart = req.cookies.cart;
  if (!cart) cart = [];
  const quantity = parseInt(req.body.quantity) || 1;

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    cart = cart.filter(item => {
      const itemId = typeof item === 'string' ? item : item.productId;
      return itemId !== req.params.id;
    });
  } else {
    // Update quantity
    const itemIndex = cart.findIndex(item => {
      const itemId = typeof item === 'string' ? item : item.productId;
      return itemId === req.params.id;
    });

    if (itemIndex !== -1) {
      if (typeof cart[itemIndex] === 'string') {
        cart[itemIndex] = { productId: req.params.id, quantity };
      } else {
        cart[itemIndex].quantity = quantity;
      }
    }
  }

  res.cookie("cart", cart);
  req.flash("success", "Cart Updated");
  res.redirect("/cart");
});

router.get("/:page?", async function (req, res, next) {
  let page = Number(req.params.page);
  if (!page) page = 1;
  const pageSize = 10;

  // Read filters from query
  const department = (req.query.department || "").trim();
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : NaN;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : NaN;

  // Fetch all products (MVP approach due to price being a string)
  let allProducts = await Product.find();

  // Distinct departments for filter UI
  let departments = Array.from(
    new Set(allProducts.map((p) => p.department).filter((d) => !!d))
  ).sort((a, b) => a.localeCompare(b));

  // Apply filters in memory
  let filtered = allProducts.filter((p) => {
    let ok = true;
    if (department) {
      ok = ok && (p.department || "").toLowerCase() === department.toLowerCase();
    }
    const priceNum = Number(p.price);
    if (!Number.isNaN(minPrice)) ok = ok && priceNum >= minPrice;
    if (!Number.isNaN(maxPrice)) ok = ok && priceNum <= maxPrice;
    return ok;
  });

  const totalProducts = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const products = filtered.slice(start, end);

  // Build query string for pagination links
  const params = [];
  if (department) params.push(`department=${encodeURIComponent(department)}`);
  if (!Number.isNaN(minPrice)) params.push(`minPrice=${encodeURIComponent(minPrice)}`);
  if (!Number.isNaN(maxPrice)) params.push(`maxPrice=${encodeURIComponent(maxPrice)}`);
  const queryString = params.length ? `?${params.join("&")}` : "";

  return res.render("site/homepage", {
    pagetitle: "Awesome Products",
    products,
    page,
    pageSize,
    totalPages,
    departments,
    filters: { department, minPrice: Number.isNaN(minPrice) ? "" : minPrice, maxPrice: Number.isNaN(maxPrice) ? "" : maxPrice },
    queryString,
  });
});

module.exports = router;
