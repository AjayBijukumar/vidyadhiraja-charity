// ===============================
// Mobile Navigation Toggle
// ===============================
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    
    // Accessibility improvement
    const expanded = navToggle.getAttribute("aria-expanded") === "true" || false;
    navToggle.setAttribute("aria-expanded", !expanded);
  });

  // Close nav when a link is clicked (mobile)
  mainNav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", false);
    }
  });
}

// ===============================
// Smooth Scrolling
// ===============================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href").slice(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      e.preventDefault();
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ===============================
// Contact Form Handling with Backend
// ===============================
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    console.log("📝 Form submitted!"); // Debug log

    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const phone = contactForm.phone ? contactForm.phone.value.trim() : "";
    const message = contactForm.message.value.trim();

    // Validation
    if (!name || !email || !message) {
      formStatus.textContent = "Please fill in all required fields (Name, Email, Message).";
      formStatus.style.color = "#b91c1c";
      return;
    }

    // Show sending message
    formStatus.textContent = "📤 Sending message...";
    formStatus.style.color = "#7c6a5a";

    try {
      // Get API endpoint from form attribute or use default
      const apiUrl = contactForm.getAttribute("data-api") || "/api/contact";
      
      console.log("Sending to:", apiUrl); // Debug log
      console.log("Data:", { name, email, phone, message }); // Debug log
      
      // Send to backend
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message
        })
      });

      console.log("Response status:", response.status); // Debug log
      
      const data = await response.json();
      console.log("Response data:", data); // Debug log

      if (data.success) {
        formStatus.textContent = "✅ Thank you! Your message has been sent. We will reply soon.";
        formStatus.style.color = "#166534";
        contactForm.reset();
      } else {
        formStatus.textContent = "❌ Something went wrong. Please try again or contact directly.";
        formStatus.style.color = "#b91c1c";
      }
    } catch (error) {
      console.error("❌ Error:", error);
      
      // Show error message
      formStatus.textContent = "❌ Server error. Please try again later or call us directly.";
      formStatus.style.color = "#b91c1c";
    }
  });
}

// ===============================
// Close mobile menu on resize (if screen becomes large)
// ===============================
window.addEventListener("resize", () => {
  if (window.innerWidth > 900 && mainNav) {
    mainNav.classList.remove("open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", false);
    }
  }
});

// ===============================
// Add active class to current section in navigation
// ===============================
window.addEventListener("scroll", () => {
  const sections = document.querySelectorAll("section[id]");
  const scrollPosition = window.scrollY + 100;

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      document.querySelectorAll(".main-nav a").forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${sectionId}`) {
          link.classList.add("active");
        }
      });
    }
  });
});