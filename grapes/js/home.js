$(document).ready(function () {
  // Tab switching functionality
  $(".tab-nav li a").on("click", function (e) {
    e.preventDefault();

    // Get the target tab content
    const target = $(this).attr("href");

    // Remove active class from all tabs and contents
    $(".tab-nav li").removeClass("active");
    $(".tab-content").removeClass("active");

    // Add active class to clicked tab and corresponding content
    $(this).parent().addClass("active");
    $(target).addClass("active");
  });

  // Dropdown menu functionality
  $(".main-menu li").hover(
    function () {
      if ($(this).find(".dropdown-menus").length) {
        $(this).find(".dropdown-menus").stop().fadeIn(200);
      }
    },
    function () {
      if ($(this).find(".dropdown-menus").length) {
        $(this).find(".dropdown-menus").stop().fadeOut(200);
      }
    }
  );

  // Newsletter popup
  // Show popup after a delay (e.g., 3 seconds)
  setTimeout(function () {
    $(".newsletter-popup").addClass("active");
  }, 3000);

  // Close popup when clicking the close button
  $(".close-popup, .no-thanks-btn").on("click", function () {
    $(".newsletter-popup").removeClass("active");
  });

  // Close popup when clicking outside the content
  $(".newsletter-popup").on("click", function (e) {
    if ($(e.target).closest(".popup-content").length === 0) {
      $(".newsletter-popup").removeClass("active");
    }
  });

  // Prevent popup from closing when clicking inside content
  $(".popup-content").on("click", function (e) {
    e.stopPropagation();
  });

  // Form submission for newsletter and popup
  $(".newsletter-form, .popup-content form").on("submit", function (e) {
    e.preventDefault();

    // Get form data
    const formData = $(this).serialize();

    // Here you would typically send the data to a server
    // For this example, we'll just simulate a successful submission

    // Show success message
    const successMessage = $(
      '<p class="success-message">Thank you for subscribing!</p>'
    );
    $(this).after(successMessage);

    // Reset form
    this.reset();

    // If this is from the popup, close it after a delay
    if ($(this).closest(".popup-content").length) {
      setTimeout(function () {
        $(".newsletter-popup").removeClass("active");
      }, 2000);
    }
  });

  // Back to top button functionality
  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $(".back-to-top").fadeIn();
    } else {
      $(".back-to-top").fadeOut();
    }
  });

  $(".back-to-top").on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, 800);
  });

  // Product image hover effect
  $(".product-item").hover(
    function () {
      $(this).find("img").css("opacity", "0.8");
    },
    function () {
      $(this).find("img").css("opacity", "1");
    }
  );

  // Mobile menu toggle (for responsive design)
  $(".mobile-menu-toggle").on("click", function () {
    $(".main-menu").toggleClass("active");
    $(this).toggleClass("active");
  });
});
