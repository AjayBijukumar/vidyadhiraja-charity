// ===============================
// Mobile Navigation Toggle
// ===============================
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
const body = document.body;

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    mainNav.classList.toggle("active"); // CHANGED: 'open' → 'active'
    body.classList.toggle("menu-open"); // ADDED: for overlay
    
    // Update ARIA attribute for accessibility
    const expanded = navToggle.getAttribute("aria-expanded") === "true" || false;
    navToggle.setAttribute("aria-expanded", !expanded);
    
    // Animate hamburger
    navToggle.classList.toggle("open");
  });

  // Close nav when a link is clicked (mobile)
  mainNav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      mainNav.classList.remove("active");
      body.classList.remove("menu-open"); // ADDED: remove overlay
      navToggle.setAttribute("aria-expanded", false);
      navToggle.classList.remove("open");
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
    
    console.log("📝 Form submitted!");

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
      const apiUrl = contactForm.getAttribute("data-api") || "/api/contact";
      
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
      
      const data = await response.json();

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
      
      formStatus.textContent = "❌ Server error. Please try again later or call us directly.";
      formStatus.style.color = "#b91c1c";
    }
  });
}

// ===============================
// Close mobile menu on resize
// ===============================
window.addEventListener("resize", () => {
  if (window.innerWidth > 768 && mainNav) {
    mainNav.classList.remove("active"); // CHANGED: 'open' → 'active'
    body.classList.remove("menu-open"); // ADDED: remove overlay
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", false);
      navToggle.classList.remove("open");
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

// ===============================
// RAZORPAY DONATION HANDLER
// ===============================
const donationForm = document.getElementById('donationForm');
const donationMessage = document.getElementById('donationMessage');
const donateButton = document.getElementById('donateButton');

// Load Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

if (donationForm) {
  donationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('donorName').value.trim();
    const email = document.getElementById('donorEmail').value.trim();
    const phone = document.getElementById('donorPhone').value.trim();
    const amount = parseInt(document.getElementById('donationAmount').value);
    
    // Validate
    if (!name || !email || !phone || !amount || amount < 1) {
      donationMessage.innerHTML = '<span style="color: #b91c1c;">Please fill all fields with valid amount</span>';
      return;
    }
    
    // Disable button and show loading
    donateButton.disabled = true;
    donateButton.textContent = 'Processing...';
    donationMessage.innerHTML = '<span style="color: #7c6a5a;">Creating order...</span>';
    
    try {
      // Load Razorpay script
      await loadRazorpayScript();
      
      // Create order on backend
      const orderResponse = await fetch('/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      const orderData = await orderResponse.json();
      
      if (orderData.error) {
        throw new Error(orderData.error);
      }
      
      // Razorpay options
      const options = {
        key: 'YOUR_RAZORPAY_KEY_ID', // ⚠️ REPLACE WITH YOUR ACTUAL KEY
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Sree Vidyadhiraja Charity',
        description: 'Donation for Elderly Home',
        image: '/pics/logo.png',
        order_id: orderData.orderId,
        handler: async function(response) {
          // Verify payment on backend
          const verifyResponse = await fetch('/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              name,
              email,
              phone,
              amount: orderData.amount
            })
          });
          
          const verifyData = await verifyResponse.json();
          
          if (verifyData.success) {
            donationMessage.innerHTML = '<span style="color: #166534;">✅ Thank you for your donation! You will receive a receipt via email.</span>';
            donationForm.reset();
            
            // Optional: Refresh UPI QR code or update something
            if (typeof refreshUPIQRCode === 'function') {
              refreshUPIQRCode();
            }
          } else {
            donationMessage.innerHTML = '<span style="color: #b91c1c;">❌ Payment verification failed. Please contact us.</span>';
          }
        },
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: '#d97706'
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Donation error:', error);
      donationMessage.innerHTML = '<span style="color: #b91c1c;">❌ Failed to process donation. Please try again.</span>';
    } finally {
      donateButton.disabled = false;
      donateButton.textContent = 'Donate Now via Razorpay';
    }
  });
}

// ===============================
// UPI QR Code Helper (Optional)
// ===============================
window.refreshUPIQRCode = function() {
  const upiQrElement = document.getElementById('upi-qr-code');
  if (upiQrElement && upiQrElement.children.length === 0) {
    console.log('🔄 UPI QR code would refresh here');
  }
};

// ===============================
// WhatsApp Click Tracking
// ===============================
if (typeof window.trackWhatsAppClick !== 'function') {
  window.trackWhatsAppClick = function() {
    console.log('📱 WhatsApp clicked at:', new Date().toISOString());
    fetch('/api/track-whatsapp-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.log('Tracking error:', err));
  };
}

// ===============================
// Initialize any on-load functions
// ===============================
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Script loaded successfully');
  
  if (document.getElementById('upi-qr-code')) {
    console.log('📱 UPI QR code container found');
  }
});