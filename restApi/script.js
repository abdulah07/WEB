$(function () {
  var apiUrl = "https://jsonplaceholder.typicode.com/users";
  var $form = $("#userForm");
  var $submitBtn = $("#submitBtn");
  var $tableBody = $("#usersTable tbody");
  var $feedback = $("#feedbackContainer");
  var $overlay = $("#loadingOverlay");
  var $count = $("#userCount");
  var users = [];
  var editingId = "";

  function showMessage(type, text) {
    var html =
      '<div class="alert alert-' +
      type +
      ' alert-dismissible fade show" role="alert">' +
      text +
      '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
    $feedback.removeClass("d-none").html(html);
  }

  function setLoading(isLoading) {
    if (isLoading) {
      $overlay.show();
    } else {
      $overlay.hide();
    }
    $("#refreshUsersBtn").prop("disabled", isLoading);
    $submitBtn.prop("disabled", isLoading);
  }

  function updateCount() {
    var total = users.length;
    var label = total === 1 ? "user" : "users";
    $count.text(total + " " + label);
  }

  function renderUsers() {
    $tableBody.empty();

    if (!users.length) {
      $tableBody.append(
        '<tr class="text-center"><td colspan="5" class="py-5"><i class="bi bi-people fs-3 text-secondary d-block mb-2"></i><span class="text-secondary">No users loaded yet.</span></td></tr>'
      );
    } else {
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var row =
          '<tr data-id="' +
          (user.id || "") +
          '"><td>' +
          (user.id || "") +
          "</td><td>" +
          (user.name || "") +
          "</td><td>" +
          (user.username || "") +
          "</td><td>" +
          (user.email || "") +
          '</td><td class="text-end"><button class="btn btn-outline-primary btn-sm edit-user" type="button"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-outline-danger btn-sm delete-user" type="button"><i class="bi bi-trash"></i></button></td></tr>';
        $tableBody.append(row);
      }
    }

    updateCount();
  }

  function resetForm() {
    $form[0].reset();
    editingId = "";
    $("#formTitle").text("Create User");
    $submitBtn.html('<i class="bi bi-save"></i> Save User');
  }

  function loadUsers() {
    setLoading(true);
    fetch(apiUrl)
      .then(function (resp) {
        return resp.json();
      })
      .then(function (data) {
        if (Array.isArray(data)) {
          users = data;
        } else {
          users = [];
        }
        renderUsers();
        showMessage("success", "Users loaded.");
      })
      .catch(function () {
        users = [];
        renderUsers();
        showMessage("danger", "Could not load users.");
      })
      .finally(function () {
        setLoading(false);
      });
  }

  $form.on("submit", function (event) {
    event.preventDefault();

    var name = $.trim($("#fullName").val());
    var username = $.trim($("#username").val());
    var email = $.trim($("#email").val());

    if (!name || !username || !email) {
      showMessage("warning", "Please fill in every field.");
      return;
    }

    var payload = {
      name: name,
      username: username,
      email: email,
    };

    setLoading(true);

    if (editingId) {
      fetch(apiUrl + "/" + editingId, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          id: editingId,
          name: name,
          username: username,
          email: email,
        }),
      })
        .then(function (resp) {
          return resp.json();
        })
        .then(function (data) {
          var newUser = {
            id: data.id || editingId,
            name: name,
            username: username,
            email: email,
          };

          for (var i = 0; i < users.length; i++) {
            if (String(users[i].id) === String(editingId)) {
              users[i] = newUser;
              break;
            }
          }

          renderUsers();
          showMessage("success", "User updated.");
          resetForm();
        })
        .catch(function () {
          showMessage("danger", "Update failed.");
        })
        .finally(function () {
          setLoading(false);
        });
    } else {
      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify(payload),
      })
        .then(function (resp) {
          return resp.json();
        })
        .then(function (data) {
          var newUser = {
            id: data.id || Date.now(),
            name: name,
            username: username,
            email: email,
          };

          users.unshift(newUser);
          renderUsers();
          showMessage("success", "User created.");
          resetForm();
        })
        .catch(function () {
          showMessage("danger", "Create failed.");
        })
        .finally(function () {
          setLoading(false);
        });
    }
  });

  $("#usersTable").on("click", ".edit-user", function () {
    var id = $(this).closest("tr").data("id");
    var user = null;

    for (var i = 0; i < users.length; i++) {
      if (String(users[i].id) === String(id)) {
        user = users[i];
        break;
      }
    }

    if (!user) {
      showMessage("warning", "User not found.");
      return;
    }

    $("#fullName").val(user.name || "");
    $("#username").val(user.username || "");
    $("#email").val(user.email || "");
    editingId = id;
    $("#formTitle").text("Edit User");
    $submitBtn.html('<i class="bi bi-pencil-square"></i> Update User');
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  $("#usersTable").on("click", ".delete-user", function () {
    var id = $(this).closest("tr").data("id");

    if (!window.confirm("Delete this user?")) {
      return;
    }

    setLoading(true);

    fetch(apiUrl + "/" + id, {
      method: "DELETE",
    })
      .then(function () {
        users = users.filter(function (user) {
          return String(user.id) !== String(id);
        });

        renderUsers();
        showMessage("success", "User deleted.");

        if (String(editingId) === String(id)) {
          resetForm();
        }
      })
      .catch(function () {
        showMessage("danger", "Delete failed.");
      })
      .finally(function () {
        setLoading(false);
      });
  });

  $("#refreshUsersBtn").on("click", function () {
    loadUsers();
  });

  $("#resetBtn").on("click", function () {
    resetForm();
    showMessage("secondary", "Form cleared.");
  });

  setLoading(false);
  renderUsers();
  loadUsers();
});
