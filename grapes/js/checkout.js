$(document).ready(function () {
  // Toggle payment method sections
  $('input[name="payment-method"]').on("change", function () {
    if ($(this).val() === "card") {
      $("#card-details").slideDown();
    } else {
      $("#card-details").slideUp();
    }
  });

  // Update shipping cost and total when shipping method changes
  $('input[name="shipping-method"]').on("change", function () {
    const shippingCost = $(this).val() === "standard" ? "€8.00" : "€15.00";
    $('.cart-row:contains("Shipping")')
      .find("span:last-child")
      .text(shippingCost);
    updateTotal();
  });

  // Update total price based on subtotal and shipping cost
  function updateTotal() {
    const subtotal = parseFloat(
      $('.cart-row:contains("Subtotal")')
        .find("span:last-child")
        .text()
        .replace("€", "")
    );
    const shipping = parseFloat(
      $('.cart-row:contains("Shipping")')
        .find("span:last-child")
        .text()
        .replace("€", "")
    );
    const total = subtotal + shipping;
    $(".amount").text("€" + total.toFixed(2));
  }

  // Apply discount code
  $("#apply-discount").on("click", function () {
    const discountCode = $("#discount-code").val().trim().toUpperCase();

    if (discountCode === "") {
      showMessage("Please enter a discount code", "error");
      return;
    }

    // Example discount codes
    const discountCodes = {
      WELCOME10: 10,
      SUMMER20: 20,
      FREESHIP: "free-shipping",
    };

    if (discountCodes[discountCode]) {
      if (discountCodes[discountCode] === "free-shipping") {
        $('.cart-row:contains("Shipping")')
          .find("span:last-child")
          .text("€0.00");
        showMessage("Free shipping discount applied!", "success");
      } else {
        // Apply percentage discount
        const discount = discountCodes[discountCode];
        const subtotal = parseFloat(
          $('.cart-row:contains("Subtotal")')
            .find("span:last-child")
            .text()
            .replace("€", "")
        );
        const discountAmount = ((subtotal * discount) / 100).toFixed(2);

        // Check if discount row already exists
        if ($('.cart-row:contains("Discount")').length) {
          $('.cart-row:contains("Discount")')
            .find("span:last-child")
            .text("-€" + discountAmount);
        } else {
          // Add discount row
          const discountRow = $(
            '<div class="cart-row"><span>Discount (' +
              discount +
              "%)</span><span>-€" +
              discountAmount +
              "</span></div>"
          );
          $('.cart-row:contains("Shipping")').after(discountRow);
        }

        showMessage(discount + "% discount applied!", "success");
      }

      // Disable the input and button
      $("#discount-code").prop("disabled", true);
      $("#apply-discount").prop("disabled", true).text("Applied");

      updateTotal();
    } else {
      showMessage("Invalid discount code", "error");
    }
  });

  // Show message
  function showMessage(message, type) {
    // Remove any existing messages
    $(".message").remove();

    // Create message element
    const messageElement = $(
      '<div class="message ' + type + '">' + message + "</div>"
    );

    // Add to DOM
    $(".discount-code").after(messageElement);

    // Fade out after 3 seconds
    setTimeout(function () {
      messageElement.fadeOut(function () {
        $(this).remove();
      });
    }, 3000);
  }

  // Form validation
  $("#checkout-form").on("submit", function (e) {
    e.preventDefault();

    // Reset previous error messages
    $(".error-message").remove();
    $(".form-group").removeClass("has-error");

    // Basic validation
    let isValid = true;

    // Check required fields
    $(this)
      .find("[required]")
      .each(function () {
        if ($(this).val().trim() === "") {
          isValid = false;
          showFieldError($(this), "This field is required");
        }
      });

    // Email validation
    const emailField = $("#email");
    if (emailField.val() && !isValidEmail(emailField.val())) {
      isValid = false;
      showFieldError(emailField, "Please enter a valid email address");
    }

    // Credit card validation if credit card payment is selected
    if ($("#payment-card").is(":checked")) {
      // Card number validation
      const cardNumber = $("#card-number").val().replace(/\s/g, "");
      if (cardNumber && !isValidCardNumber(cardNumber)) {
        isValid = false;
        showFieldError($("#card-number"), "Please enter a valid card number");
      }

      // Expiry date validation
      const expiryDate = $("#expiry-date").val();
      if (expiryDate && !isValidExpiryDate(expiryDate)) {
        isValid = false;
        showFieldError(
          $("#expiry-date"),
          "Please enter a valid expiry date (MM/YY)"
        );
      }

      // CVV validation
      const cvv = $("#cvv").val();
      if (cvv && !isValidCVV(cvv)) {
        isValid = false;
        showFieldError($("#cvv"), "Please enter a valid 3 or 4 digit CVV");
      }
    }

    // Terms checkbox validation
    if (!$("#terms").is(":checked")) {
      isValid = false;
      showFieldError($("#terms"), "You must accept the terms and conditions");
    }

    // If form is valid, proceed with submission
    if (isValid) {
      // Here you would typically submit the form data to a server
      // For this example, we'll just show a success message

      // Disable form elements
      $("#checkout-form")
        .find("input, select, textarea, button")
        .prop("disabled", true);

      // Show loading animation
      const loadingOverlay = $(
        '<div class="loading-overlay"><div class="spinner"></div><p>Processing your order...</p></div>'
      );
      $("body").append(loadingOverlay);

      // Simulate processing delay
      setTimeout(function () {
        // Remove loading overlay
        loadingOverlay.remove();

        // Show success message
        const successMessage = $(
          '<div class="order-success"><h2>Thank you for your order!</h2><p>Your order has been placed successfully. An email confirmation has been sent to your email address.</p><p>Order number: #' +
            generateOrderNumber() +
            '</p><a href="index.html" class="btn">Return to Home</a></div>'
        );
        $(".checkout-content").html(successMessage);

        // Scroll to top
        $("html, body").animate({ scrollTop: 0 }, 500);
      }, 2000);
    }
  });

  // Show error message for a field
  function showFieldError(field, message) {
    field
      .closest(".form-group, .newsletter-checkbox, .terms-checkbox")
      .addClass("has-error");
    $('<p class="error-message">' + message + "</p>").insertAfter(field);
  }

  // Email validation helper
  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Credit card validation helpers
  function isValidCardNumber(cardNumber) {
    // Simple validation (length between 13-19 digits)
    return /^\d{13,19}$/.test(cardNumber);
  }

  function isValidExpiryDate(expiryDate) {
    // Format MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return false;
    }

    const [month, year] = expiryDate.split("/");
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // Last two digits
    const currentMonth = now.getMonth() + 1; // 1-12

    // Check if month is valid (1-12)
    if (parseInt(month) < 1 || parseInt(month) > 12) {
      return false;
    }

    // Check if the expiry date is in the future
    if (
      parseInt(year) < currentYear ||
      (parseInt(year) === currentYear && parseInt(month) < currentMonth)
    ) {
      return false;
    }

    return true;
  }

  function isValidCVV(cvv) {
    // 3 or 4 digits
    return /^\d{3,4}$/.test(cvv);
  }

  // Generate a random order number
  function generateOrderNumber() {
    const prefix = "PT";
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return prefix + timestamp + random;
  }

  // Format credit card input
  $("#card-number").on("input", function () {
    let value = $(this).val().replace(/\D/g, "");
    let formattedValue = "";

    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += " ";
      }
      formattedValue += value[i];
    }

    $(this).val(formattedValue);
  });

  // Format expiry date input
  $("#expiry-date").on("input", function () {
    let value = $(this).val().replace(/\D/g, "");

    if (value.length > 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }

    $(this).val(value);
  });

  // Limit CVV input to numbers and max length of 4
  $("#cvv").on("input", function () {
    let value = $(this).val().replace(/\D/g, "");
    $(this).val(value.slice(0, 4));
  });
});
