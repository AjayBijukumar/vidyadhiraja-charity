// ===============================
// Mobile Navigation Toggle
// ===============================
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
const body = document.body;

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    mainNav.classList.toggle("active");
    body.classList.toggle("menu-open");
    
    const expanded = navToggle.getAttribute("aria-expanded") === "true" || false;
    navToggle.setAttribute("aria-expanded", !expanded);
    navToggle.classList.toggle("open");
  });

  mainNav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      mainNav.classList.remove("active");
      body.classList.remove("menu-open");
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

    if (!name || !email || !message) {
      formStatus.textContent = "Please fill in all required fields (Name, Email, Message).";
      formStatus.style.color = "#b91c1c";
      return;
    }

    formStatus.textContent = "📤 Sending message...";
    formStatus.style.color = "#7c6a5a";

    try {
      const apiUrl = contactForm.getAttribute("data-api") || "/api/contact";
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message })
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
    mainNav.classList.remove("active");
    body.classList.remove("menu-open");
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
// DONATION MODAL FUNCTIONALITY (NEW)
// ===============================

// DOM Elements
const modal = document.getElementById('donationModal');
const donateTriggers = document.querySelectorAll('.donate-trigger');
const closeBtn = document.querySelector('.donation-modal-close');
const modalOverlay = document.querySelector('.donation-modal-overlay');
const modalForm = document.getElementById('donationModalForm');

// Form elements
const existingDonorCheckbox = document.getElementById('existingDonorCheckbox');
const existingDonorFields = document.getElementById('existingDonorFields');
const taxExemptionCheckbox = document.getElementById('taxExemptionCheckbox');
const panInput = document.getElementById('donorPan');

// Open modal
function openModal() {
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Close modal
function closeModal() {
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Modal event listeners
if (donateTriggers.length) {
  donateTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });
}

if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

// ESC key to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
    closeModal();
  }
});

// Existing Donor Toggle
if (existingDonorCheckbox) {
  existingDonorCheckbox.addEventListener('change', function() {
    existingDonorFields.style.display = this.checked ? 'block' : 'none';
  });
}

// Tax Exemption Toggle
if (taxExemptionCheckbox) {
  taxExemptionCheckbox.addEventListener('change', function() {
    if (this.checked) {
      panInput.setAttribute('required', 'required');
      panInput.parentElement.classList.add('required-field');
    } else {
      panInput.removeAttribute('required');
      panInput.parentElement.classList.remove('required-field');
    }
  });
}

// Fetch Donor Details (Simulate)
const fetchBtn = document.getElementById('fetchDonorDetailsBtn');
if (fetchBtn) {
  fetchBtn.addEventListener('click', function() {
    const input = document.getElementById('existingDonorEmail').value;
    const messageDiv = document.getElementById('fetchDonorMessage');
    
    if (!input) {
      messageDiv.innerHTML = '<span style="color: #b91c1c;">Please enter email or mobile number</span>';
      return;
    }
    
    messageDiv.innerHTML = '<span style="color: #7c6a5a;">Fetching details...</span>';
    
    setTimeout(() => {
      const dummyData = {
        title: 'Mr',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '9876543210',
        address: '123 Main Street',
        city: 'Mumbai',
        postalCode: '400001'
      };
      
      document.getElementById('donorTitle').value = dummyData.title;
      document.getElementById('donorFirstName').value = dummyData.firstName;
      document.getElementById('donorLastName').value = dummyData.lastName;
      document.getElementById('donorEmailModal').value = dummyData.email;
      document.getElementById('donorPhoneModal').value = dummyData.phone;
      document.getElementById('donorAddress').value = dummyData.address;
      document.getElementById('donorCity').value = dummyData.city;
      document.getElementById('donorPostalCode').value = dummyData.postalCode;
      
      messageDiv.innerHTML = '<span style="color: #166534;">✅ Details fetched successfully!</span>';
      
      setTimeout(() => {
        messageDiv.innerHTML = '';
      }, 3000);
    }, 800);
  });
}

// Load Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Handle Donation Modal Form Submission
if (modalForm) {
  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get all form values
    const title = document.getElementById('donorTitle').value;
    const firstName = document.getElementById('donorFirstName').value.trim();
    const lastName = document.getElementById('donorLastName').value.trim();
    const email = document.getElementById('donorEmailModal').value.trim();
    const phone = document.getElementById('donorPhoneModal').value.trim();
    const address = document.getElementById('donorAddress').value.trim();
    const city = document.getElementById('donorCity').value.trim();
    const postalCode = document.getElementById('donorPostalCode').value.trim();
    const pan = document.getElementById('donorPan').value.trim();
    const amount = parseInt(document.getElementById('donationAmountModal').value);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'upi';
    const taxExemption = document.getElementById('taxExemptionCheckbox')?.checked || false;
    const existingDonor = document.getElementById('existingDonorCheckbox')?.checked || false;
    
    // Validate required fields
    if (!title || !firstName || !lastName || !email || !phone || !address || !city || !postalCode || !amount || amount < 1) {
      alert('Please fill all required fields');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    // Validate phone (basic)
    if (!phone || phone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    
    // Validate PAN if tax exemption is checked
    if (taxExemption && !pan) {
      alert('PAN is required for tax exemption');
      return;
    }
    
    // Disable submit button and show loading
    const submitBtn = modalForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
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
        name: 'Sri Vidyadhiraja Charities',
        description: 'Donation for Elderly Home',
        image: '/pics/logo.png',
        order_id: orderData.orderId,
        handler: async function(response) {
          // Verify payment on backend with ALL donor details
          const verifyResponse = await fetch('/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              title,
              firstName,
              lastName,
              email,
              phone,
              address,
              city,
              postalCode,
              pan: pan || '',
              amount: orderData.amount,
              paymentMethod,
              taxExemption,
              existingDonor
            })
          });
          
          const verifyData = await verifyResponse.json();
          
          if (verifyData.success) {
            alert('✅ Thank you for your donation! You will receive a receipt via email.');
            modalForm.reset();
            closeModal();
            
            // Reset tax exemption state
            if (panInput) panInput.removeAttribute('required');
            if (existingDonorFields) existingDonorFields.style.display = 'none';
          } else {
            alert('❌ Payment verification failed. Please contact us.');
          }
        },
        prefill: {
          name: `${title} ${firstName} ${lastName}`,
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
      alert('❌ Failed to process donation. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}

// ===============================
// OLD RAZORPAY DONATION HANDLER (Keep for backward compatibility)
// ===============================
const oldDonationForm = document.getElementById('donationForm');
const oldDonationMessage = document.getElementById('donationMessage');
const oldDonateButton = document.getElementById('donateButton');

if (oldDonationForm) {
  oldDonationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('donorName')?.value.trim();
    const email = document.getElementById('donorEmail')?.value.trim();
    const phone = document.getElementById('donorPhone')?.value.trim();
    const amount = parseInt(document.getElementById('donationAmount')?.value);
    
    if (!name || !email || !phone || !amount || amount < 1) {
      if (oldDonationMessage) oldDonationMessage.innerHTML = '<span style="color: #b91c1c;">Please fill all fields with valid amount</span>';
      return;
    }
    
    if (oldDonateButton) oldDonateButton.disabled = true;
    if (oldDonateButton) oldDonateButton.textContent = 'Processing...';
    if (oldDonationMessage) oldDonationMessage.innerHTML = '<span style="color: #7c6a5a;">Creating order...</span>';
    
    try {
      await loadRazorpayScript();
      
      const orderResponse = await fetch('/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      const orderData = await orderResponse.json();
      
      if (orderData.error) throw new Error(orderData.error);
      
      const options = {
        key: 'YOUR_RAZORPAY_KEY_ID',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Sri Vidyadhiraja Charities',
        description: 'Donation for Elderly Home',
        image: '/pics/logo.png',
        order_id: orderData.orderId,
        handler: async function(response) {
          const verifyResponse = await fetch('/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              title: 'Mr',
              firstName: name.split(' ')[0] || name,
              lastName: name.split(' ').slice(1).join(' ') || '',
              email,
              phone,
              address: '',
              city: '',
              postalCode: '',
              pan: '',
              amount: orderData.amount,
              paymentMethod: 'upi',
              taxExemption: false,
              existingDonor: false
            })
          });
          
          const verifyData = await verifyResponse.json();
          
          if (verifyData.success) {
            if (oldDonationMessage) oldDonationMessage.innerHTML = '<span style="color: #166534;">✅ Thank you for your donation!</span>';
            if (oldDonationForm) oldDonationForm.reset();
          } else {
            if (oldDonationMessage) oldDonationMessage.innerHTML = '<span style="color: #b91c1c;">❌ Payment verification failed.</span>';
          }
        },
        prefill: { name, email, contact: phone },
        theme: { color: '#d97706' }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Donation error:', error);
      if (oldDonationMessage) oldDonationMessage.innerHTML = '<span style="color: #b91c1c;">❌ Failed to process donation.</span>';
    } finally {
      if (oldDonateButton) oldDonateButton.disabled = false;
      if (oldDonateButton) oldDonateButton.textContent = 'Donate Now via Razorpay';
    }
  });
}

// ===============================
// UPI QR Code Helper
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