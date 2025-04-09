document.addEventListener("DOMContentLoaded", () => {
  const previousTasksLink = document.getElementById("previous-tasks-link");
  const previousTasksLi = document.getElementById("previous-tasks-li"); // Get the parent li
  const megaMenu = document.getElementById("mega-menu");

  // --- Toggle Mega Menu ---
  previousTasksLink.addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the link from navigating
    event.stopPropagation(); // Stop click from immediately closing menu via document listener

    // Toggle the visibility class
    const isVisible = megaMenu.classList.contains("mega-menu-visible");
    if (isVisible) {
      megaMenu.classList.remove("mega-menu-visible");
    } else {
      // Optional: Close other potential mega menus first if you add more later
      // closeAllMegaMenus();
      megaMenu.classList.add("mega-menu-visible");
    }
  });

  // --- Close Mega Menu when clicking outside ---
  document.addEventListener("click", (event) => {
    // Check if the menu is visible AND if the click was outside the li and the menu itself
    if (
      megaMenu.classList.contains("mega-menu-visible") &&
      !previousTasksLi.contains(event.target) &&
      !megaMenu.contains(event.target)
    ) {
      megaMenu.classList.remove("mega-menu-visible");
    }
  });

  // --- Optional: Close Mega Menu with Escape key ---
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      megaMenu.classList.contains("mega-menu-visible")
    ) {
      megaMenu.classList.remove("mega-menu-visible");
    }
  });
}); // End DOMContentLoaded

// Helper function if you plan to add more mega menus later
// function closeAllMegaMenus() {
//     document.querySelectorAll('.mega-menu').forEach(menu => { // Assuming all mega menus have a common class '.mega-menu'
//         menu.classList.remove('mega-menu-visible');
//     });
// }
