module.exports = async function (req, res, next) {
  if (!req.session.user) {
    req.flash("danger", "You need to login to access the admin panel");
    return res.redirect("/login");
  }

  if (!req.session.user.roles.includes("admin")) {
    req.flash("danger", "You are not authorized to access this area");
    return res.redirect("/");
  }

  res.locals.layout = "super-admin-layout";
  res.locals.title = "Awesome Store Admin Panel";
  next();
};
