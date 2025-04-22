document.addEventListener("DOMContentLoaded", () => {
  const previousTasksLink = document.getElementById("previous-tasks-link");
  const previousTasksLi = document.getElementById("previous-tasks-li");
  const megaMenu = document.getElementById("mega-menu");

  previousTasksLink.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const isVisible = megaMenu.classList.contains("mega-menu-visible");
    if (isVisible) {
      megaMenu.classList.remove("mega-menu-visible");
    } else {
      megaMenu.classList.add("mega-menu-visible");
    }
  });

  document.addEventListener("click", (event) => {
    if (
      megaMenu.classList.contains("mega-menu-visible") &&
      !previousTasksLi.contains(event.target) &&
      !megaMenu.contains(event.target)
    ) {
      megaMenu.classList.remove("mega-menu-visible");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      megaMenu.classList.contains("mega-menu-visible")
    ) {
      megaMenu.classList.remove("mega-menu-visible");
    }
  });
});

// function closeAllMegaMenus() {
//     document.querySelectorAll('.mega-menu').forEach(menu => {
//         menu.classList.remove('mega-menu-visible');
//     });
// }
