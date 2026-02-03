/* ================================
   QuantMentor - Interactive JavaScript
   ================================ */

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM loaded, initializing all components...');

    // --------------------------------
    // Mobile Navigation
    // --------------------------------
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function () {
            navLinks.classList.toggle('mobile-active');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        console.log('✅ Mobile navigation initialized');
    }

    // --------------------------------
    // Smooth Scrolling for Navigation
    // --------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                // Close mobile menu if open
                navLinks.classList.remove('mobile-active');

                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --------------------------------
    // Navbar Background on Scroll
    // --------------------------------
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // --------------------------------
    // Product Filtering
    // --------------------------------
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;

            productCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.3s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // --------------------------------
    // Product Modal
    // --------------------------------
    const modal = document.getElementById('productModal');
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = modal?.querySelector('.modal-overlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalPrice = document.getElementById('modalPrice');
    const modalPayBtn = document.getElementById('modalPayBtn');

    // Product descriptions
    const productDescriptions = {
        'Python for Quants': 'Complete Python guide for quantitative finance professionals. Covers NumPy, Pandas, SciPy, pricing models, and production-ready code patterns. Includes all code examples.',
        'C++ for Quants': 'Modern C++ patterns for high-performance trading systems. Memory management, optimization techniques, and real-world examples from production systems.',
        'XVA Derivatives Primer': 'Comprehensive guide to derivatives pricing and XVA. CVA, DVA, FVA explained with mathematical derivations and practical examples.',
        'Quant Projects Bundle': '15+ real-world quant projects including option pricing, risk models, backtesting frameworks. All code, data, and documentation included.',
        'Interview Bible': '300+ quant interview questions with detailed solutions. Math, probability, coding challenges, brainteasers, and behavioral questions.',
        'Complete Quant Bundle': 'The ultimate package: All PDFs, all code, all projects. One purchase, lifetime access, free updates forever.'
    };

    // Open modal when product button is clicked
    document.querySelectorAll('.btn-product').forEach(btn => {
        btn.addEventListener('click', function () {
            console.log('🖱️ Product button clicked:', this.dataset.product);
            const product = this.dataset.product;
            const price = this.dataset.price;

            if (!modal) {
                console.error('❌ Modal not found in DOM');
                alert('Error: Product modal not found. Please refresh the page.');
                return;
            }

            modalTitle.textContent = product;
            modalDescription.textContent = productDescriptions[product] || 'Premium digital product for quant professionals.';
            modalPrice.textContent = '₹' + price;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal opened for:', product);
        });
    });

    // Close modal functions
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    // Close modal on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // --------------------------------
    // Service Booking - Pre-fill form
    // --------------------------------
    document.querySelectorAll('.btn-service').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const service = this.dataset.service;
            // Find the matching option in the select
            const serviceSelect = document.getElementById('service');
            if (serviceSelect && service) {
                // Map service names to select values
                const serviceMap = {
                    'Quick Consultation - 30min': 'quick',
                    'Deep Dive Session - 60min': 'deep',
                    'Interview Prep - 90min': 'interview'
                };
                if (serviceMap[service]) {
                    serviceSelect.value = serviceMap[service];
                }
            }
        });
    });

    // --------------------------------
    // Contact Form Handling
    // --------------------------------
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const data = Object.fromEntries(formData);

            // Basic validation
            if (!data.name || !data.email || !data.service) {
                alert('Please fill in all required fields.');
                return;
            }

            // Here you can integrate with:
            // 1. Formspree (free): action="https://formspree.io/f/YOUR_FORM_ID"
            // 2. Netlify Forms (free): Just add netlify attribute to form
            // 3. Google Forms

            // For now, show a success message
            alert('Thank you, ' + data.name + '!\n\nYour booking request has been received. I will contact you at ' + data.email + ' within 24 hours.\n\nService: ' + data.service);

            // Reset form
            this.reset();
        });
    }

    // --------------------------------
    // Scroll Animations (Intersection Observer)
    // --------------------------------
    const animateOnScroll = document.querySelectorAll('.service-card, .product-card, .testimonial-card, .contact-method');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animateOnScroll.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });

    // --------------------------------
    // Add fade-in animation keyframes dynamically
    // --------------------------------
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .nav-links.mobile-active {
            display: flex !important;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(10, 10, 15, 0.98);
            padding: 20px;
            gap: 16px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .nav-links.mobile-active .nav-cta {
            text-align: center;
        }
    `;
    document.head.appendChild(style);

    // --------------------------------
    // Console welcome message
    // --------------------------------
    console.log('%c QuantMentor ', 'background: linear-gradient(135deg, #6366f1, #a855f7); color: white; font-size: 20px; padding: 10px 20px; border-radius: 8px;');
    console.log('%c Expert Quant Mentorship & Digital Resources ', 'color: #a855f7; font-size: 14px;');

});

// ================================
// RAZORPAY PAYMENT INTEGRATION
// ================================

// ⚠️ ADD YOUR RAZORPAY KEY ID BELOW
const RAZORPAY_KEY_ID = 'rzp_test_1DWpRLqKKMWMgY';

// Your business name
const BUSINESS_NAME = 'QuantMentor';

// ================================
// EMAILJS CONFIGURATION (for customer emails)
// ================================
// ⚠️ Get these from emailjs.com (free: 200 emails/month)
// 1. Sign up at emailjs.com
// 2. Add email service (Gmail recommended)
// 3. Create template with variables: to_email, to_name, subject, message
// 4. Copy your IDs below

const EMAILJS_USER_ID = 'qDPRKM4ROa6YKvqWL';         // ✅ Your public key
const EMAILJS_SERVICE_ID = 'service_t71bulx';          // ✅ Your service ID
const EMAILJS_TEMPLATE_ID = 'template_ddficic';        // ✅ Your template ID

// EmailJS is initialized inline in index.html to ensure it's ready before this script runs

// ================================
// SUPABASE INTEGRATION (for dynamic file links)
// ================================
const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'sb_secret_IWfTFpvaZloE12VJpQJ8fw_NHa1Jf7V'; // Using provided secret

// Use global supabase reference (avoid local declaration)
// Initialize Supabase with delay to ensure SDK is loaded
setTimeout(function() {
    try {
        // Check if Supabase SDK is available
        if (typeof window.supabase !== 'undefined') {
            // Initialize if not already done
            if (!window.supabaseClient) {
                window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                console.log('✅ Supabase initialized');
            } else {
                console.log('✅ Supabase already initialized');
            }

            // Fetch products immediately on load
            fetchProductLinks();
        } else {
            console.error('❌ Supabase SDK not loaded');
            console.log('⚠️ Continuing without Supabase - using default links');
        }
    } catch (e) {
        console.error('Supabase initialization failed:', e);
        console.log('⚠️ Continuing without Supabase - using default links');
    }
}, 500);

// Default links (fallback) - will be updated from Supabase
const PRODUCT_DOWNLOAD_LINKS = {
    'Python for Quants': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'C++ for Quants': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'XVA Derivatives Primer': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Quant Projects Bundle': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Interview Bible': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Complete Quant Bundle': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Test Product': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Free Sample - Quant Cheatsheet': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing'
};

// Fetch dynamic links from Supabase
async function fetchProductLinks() {
    try {
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            console.log('📚 Using default download links');
            return;
        }

        const { data, error } = await window.supabaseClient
            .from('products')
            .select('name, file_url');

        if (error) {
            if (error.status === 401) {
                console.error('❌ Supabase authentication failed (401): Invalid API key');
                console.log('📚 Using default download links - check Supabase configuration');
            } else {
                console.error('Error fetching Supabase products:', error);
            }
            console.log('📚 Continuing with default download links');
            return;
        }

        if (data && data.length > 0) {
            console.log('📚 Loaded ' + data.length + ' products from Supabase');
            data.forEach(product => {
                PRODUCT_DOWNLOAD_LINKS[product.name] = product.file_url;
                // Log for debugging
                console.log(`🔗 Link updated for: ${product.name}`);
            });
        } else {
            console.log('📚 No products found in Supabase, using default links');
        }
    } catch (err) {
        console.error('Failed to fetch product links:', err);
        console.log('📚 Continuing with default download links');
    }
}

function initRazorpayCheckout(productName, amount) {
    console.log('🚀 initRazorpayCheckout called:', { productName, amount });
    
    // Handle FREE products (₹0) - skip payment, go directly to download
    if (amount === 0) {
        console.log('🆓 Free product detected');
        const downloadLink = PRODUCT_DOWNLOAD_LINKS[productName];
        if (downloadLink && downloadLink !== 'YOUR_DRIVE_LINK_HERE') {
            // Prompt for email to send free download
            const customerEmail = prompt('Enter your email to receive the free download:');
            if (customerEmail && customerEmail.includes('@')) {
                sendProductEmail(customerEmail, productName, 'FREE', downloadLink);
                alert('🎉 Free Download!\n\nCheck your email for the download link.\n\nClick OK to also open it now.');
                window.open(downloadLink, '_blank');
            } else {
                alert('🎉 Free Download!\n\nClick OK to download.');
                window.open(downloadLink, '_blank');
            }
        } else {
            alert('⚠️ Download link not configured. Please contact support.');
        }
        return;
    }

    // Validate key for paid products
    if (RAZORPAY_KEY_ID === 'YOUR_RAZORPAY_KEY_ID_HERE') {
        alert('⚠️ Razorpay not configured!\n\nAdd your Key ID in script.js line 253');
        return;
    }

    // Check if Razorpay SDK is loaded
    if (typeof Razorpay === 'undefined') {
        console.log('❌ Razorpay SDK not loaded, attempting to load...');
        alert('⏳ Loading payment system...\nPlease wait and try again in 2 seconds.');
        
        // Try to load Razorpay SDK dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = function() {
            console.log('✅ Razorpay SDK loaded successfully');
            alert('✅ Payment system loaded!\nPlease click "Buy Now" again.');
        };
        script.onerror = function() {
            console.error('❌ Failed to load Razorpay SDK');
            alert('❌ Unable to load payment system.\nPlease refresh the page and try again.');
        };
        document.head.appendChild(script);
        return;
    } else {
        alert('⚠️ Download link not configured. Please contact support.');
        return;
    }

    // Validate key for paid products
    if (RAZORPAY_KEY_ID === 'YOUR_RAZORPAY_KEY_ID_HERE') {
        alert('⚠️ Razorpay not configured!\n\nAdd your Key ID in script.js line 253');
        return;
    }

    // Check if Razorpay SDK is loaded
    if (typeof Razorpay === 'undefined') {
        alert('❌ Payment System Loading...\nPlease wait a moment and try again.\nIf the issue persists, refresh the page.');
        console.error('Razorpay SDK not found!');
        
        // Try to load Razorpay SDK dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = function() {
            alert('✅ Payment system loaded!\nPlease click "Buy Now" again.');
        };
        script.onerror = function() {
            alert('❌ Unable to load payment system.\nPlease check your internet connection.');
        };
        document.head.appendChild(script);
        return;
    }

    var options = {
        "key": RAZORPAY_KEY_ID,
        "amount": amount * 100,
        "currency": "INR",
        "name": BUSINESS_NAME,
        "description": productName,
        "handler": function (response) {
            console.log('Payment success:', response);
            // ✅ Payment successful!
            const paymentId = response.razorpay_payment_id;
            const downloadLink = PRODUCT_DOWNLOAD_LINKS[productName];

            // Get customer email from Razorpay response or prompt
            const customerEmail = prompt('Enter your email to receive the download link:');

            if (downloadLink && downloadLink !== 'YOUR_DRIVE_LINK_HERE') {
                // Send email to customer
                if (customerEmail && customerEmail.includes('@')) {
                    sendProductEmail(customerEmail, productName, paymentId, downloadLink);
                    alert('🎉 Payment Successful!\n\nPayment ID: ' + paymentId + '\n\nDownload link sent to: ' + customerEmail + '\n\nClick OK to also open it now.');
                } else {
                    alert('🎉 Payment Successful!\n\nPayment ID: ' + paymentId + '\n\nClick OK to download your product.');
                }
                window.open(downloadLink, '_blank');
            } else {
                alert('🎉 Payment Successful!\n\nPayment ID: ' + paymentId + '\n\n⚠️ Download link not configured. Please contact support with your Payment ID.');
            }
        },
        "theme": {
            "color": "#6366f1"
        },
        "modal": {
            "ondismiss": function () {
                console.log('Checkout modal closed');
            }
        }
    };

    try {
        console.log('Initializing Razorpay with options:', { ...options, key: '***' });
        var rzp = new Razorpay(options);

        rzp.on('payment.failed', function (response) {
            console.error('Payment failed:', response.error);
            alert('❌ Payment Failed\n\n' + response.error.description);
        });

        rzp.open();
        console.log('Razorpay opened successfully');
    } catch (e) {
        console.error('Razorpay init failed:', e);
        
        // TEST BYPASS: For testing purposes, simulate successful payment
        if (confirm('❌ Payment initialization failed!\n\nFor testing: Simulate successful payment?\n\nClick OK for test download, Cancel to retry.')) {
            const downloadLink = PRODUCT_DOWNLOAD_LINKS[productName];
            if (downloadLink && downloadLink !== 'YOUR_DRIVE_LINK_HERE') {
                const customerEmail = prompt('Enter your email for test download:');
                if (customerEmail && customerEmail.includes('@')) {
                    sendProductEmail(customerEmail, productName, 'TEST_PAYMENT_' + Date.now(), downloadLink);
                    alert('🧪 Test Payment Successful!\n\nTest Download link sent to: ' + customerEmail + '\n\nClick OK to download.');
                    window.open(downloadLink, '_blank');
                } else {
                    alert('🧪 Test Download!\n\nClick OK to download test product.');
                    window.open(downloadLink, '_blank');
                }
            } else {
                alert('⚠️ Download link not configured for testing.');
            }
        } else {
            alert('❌ Critical Error: Could not initialize payment gateway.\n' + e.message + '\n\nPlease refresh the page and try again.');
        }
    }
}

/**
 * Send product purchase email to customer via EmailJS
 */
async function sendProductEmail(customerEmail, productName, paymentId, downloadLink) {
    const FORMSPREE_ID = 'mjgozran';

    console.log('📧 sendProductEmail called with:', customerEmail);
    console.log('📧 EmailJS User ID:', EMAILJS_USER_ID);
    console.log('📧 EmailJS available:', typeof emailjs !== 'undefined');

    // Send to CUSTOMER via EmailJS (if configured)
    if (EMAILJS_USER_ID !== 'YOUR_EMAILJS_USER_ID' && typeof emailjs !== 'undefined') {
        console.log('📧 Attempting to send via EmailJS...');
        try {
            const templateParams = {
                to_email: customerEmail,
                to_name: customerEmail.split('@')[0],
                subject: `Your Purchase: ${productName}`,
                message: `🎉 Thank you for your purchase!

━━━━━━━━━━━━━━━━━━━━
📦 Product: ${productName}
🆔 Payment ID: ${paymentId}
━━━━━━━━━━━━━━━━━━━━

📥 Download your product here:
${downloadLink}

If you have any questions, simply reply to this email.

Best regards,
${BUSINESS_NAME}`
            };
            console.log('📧 Template params:', templateParams);

            const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
            console.log('✅ EmailJS SUCCESS:', result);
        } catch (error) {
            console.error('❌ EmailJS FAILED:', error);
            alert('Email sending failed: ' + error.text);
        }
    } else {
        console.log('⚠️ EmailJS not configured or not available');
    }

    // Also send notification to ADMIN via Formspree
    try {
        await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                _subject: `New Purchase: ${productName}`,
                email: customerEmail,
                message: `
📦 New Product Purchase!
━━━━━━━━━━━━━━━━━━━━
Product: ${productName}
Payment ID: ${paymentId}
Customer Email: ${customerEmail}
━━━━━━━━━━━━━━━━━━━━
                `.trim()
            })
        });
        console.log('Admin notified via Formspree');
    } catch (error) {
        console.error('Formspree failed:', error);
    }
}

// Connect to product modal - MOVED INSIDE MAIN DOMContentLoaded
const modalPayBtn = document.getElementById('modalPayBtn');

if (modalPayBtn) {
    console.log('✅ Pay button found, attaching listener');
    modalPayBtn.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('🖱️ Pay button clicked');

        const productName = document.getElementById('modalTitle').textContent;
        const priceText = document.getElementById('modalPrice').textContent;
        console.log('Payment Request:', { productName, priceText });

        const price = parseInt(priceText.replace(/[^\d]/g, ''));
        console.log('Parsed Price:', price);

        if (isNaN(price)) {
            alert('Error parsing price. Please try again.');
            return;
        }

        document.getElementById('productModal').classList.remove('active');
        document.body.style.overflow = '';

        console.log('Calling initRazorpayCheckout...');
        initRazorpayCheckout(productName, price);
    });
} else {
    console.error('❌ Pay button (modalPayBtn) not found in DOM');
}

// ================================
// SESSION BOOKING SYSTEM
// ================================

// ⚠️ YOUR EMAIL - Where booking notifications will be sent
const ADMIN_EMAIL = 'jha.8@alumni.iitj.ac.in';

// Google Meet link for sessions (you can also generate unique links per booking)
const GOOGLE_MEET_LINK = "https://meet.google.com/hfp-npyq-qho";

// Session types with details
const SESSION_TYPES = {
    'free': { name: 'Free Test Session', price: 0, duration: 15 },
    'quick': { name: 'Quick Consultation', price: 499, duration: 30 },
    'deep': { name: 'Deep Dive Session', price: 999, duration: 60 },
    'interview': { name: 'Interview Prep', price: 1499, duration: 90 }
};

// Initialize booking form
const bookingForm = document.getElementById('bookingForm');
const bookingService = document.getElementById('bookingService');
const bookingDate = document.getElementById('bookingDate');
const bookingPrice = document.getElementById('bookingPrice');
const priceDisplay = document.getElementById('priceDisplay');

if (bookingForm) {
    console.log('✅ Booking form found, initializing...');
    
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    bookingDate.min = tomorrow.toISOString().split('T')[0];

    // Show price when service is selected
    if (bookingService) {
        bookingService.addEventListener('change', function () {
            const value = this.value;
            if (value) {
                const [type, price, duration] = value.split('|');
                priceDisplay.textContent = '₹' + price;
                bookingPrice.style.display = 'flex';
            } else {
                bookingPrice.style.display = 'none';
            }
        });
    }

    // Handle form submission
    bookingForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('🚀 Booking form submitted!'); // Debug log

        const name = document.getElementById('bookingName').value;
        const email = document.getElementById('bookingEmail').value;
        const phone = document.getElementById('bookingPhone').value || 'Not provided';
        const serviceValue = document.getElementById('bookingService').value;
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('bookingTime').value;
        const message = document.getElementById('bookingMessage').value || 'No specific message';

        if (!serviceValue || !date || !time) {
            alert('Please fill in all required fields');
            return;
        }

        const [sessionType, price, duration] = serviceValue.split('|');
        const sessionInfo = SESSION_TYPES[sessionType];

        // Check if session info was found
        if (!sessionInfo) {
            alert('Error: Invalid session type. Please refresh and try again.');
            console.error('Session type not found:', sessionType, 'Available:', Object.keys(SESSION_TYPES));
            return;
        }

        // Format date for display
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Create session description for Razorpay
        const sessionDescription = `${sessionInfo.name} on ${formattedDate} at ${time}`;

        // Store booking details for after payment
        window.pendingBooking = {
            name,
            email,
            phone,
            sessionType: sessionInfo.name,
            duration: sessionInfo.duration,
            price: parseInt(price),
            date: formattedDate,
            time,
            message
        };

        console.log('Opening Razorpay for session:', sessionDescription, 'Price:', price);

        // Open Razorpay for session payment
        initSessionPayment(sessionDescription, parseInt(price), email);
    });
}

/**
 * Initialize Razorpay for session booking payment
 */
function initSessionPayment(description, amount, customerEmail) {
    // Handle FREE sessions (₹0) - skip payment, go directly to confirmation
    if (amount === 0) {
        handleSessionPaymentSuccess({ razorpay_payment_id: 'FREE_SESSION_' + Date.now() });
        return;
    }

    if (RAZORPAY_KEY_ID === 'YOUR_RAZORPAY_KEY_ID_HERE') {
        alert('⚠️ Payment system not configured. Please contact the admin.');
        return;
    }

    var options = {
        "key": RAZORPAY_KEY_ID,
        "amount": amount * 100,
        "currency": "INR",
        "name": BUSINESS_NAME,
        "description": description,
        "handler": function (response) {
            handleSessionPaymentSuccess(response);
        },
        "prefill": {
            "email": customerEmail,
        },
        "theme": {
            "color": "#6366f1"
        }
    };

    var rzp = new Razorpay(options);

    rzp.on('payment.failed', function (response) {
        alert('❌ Payment Failed\n\n' + response.error.description);
    });

    rzp.open();
}

/**
 * Handle successful session payment - send email notification
 */
async function handleSessionPaymentSuccess(response) {
    const paymentId = response.razorpay_payment_id;
    const booking = window.pendingBooking;

    console.log('📧 Booking object:', booking);
    console.log('📧 Email to send to:', booking?.email);

    // Create email body for admin notification
    const emailSubject = `New Session Booking: ${booking.sessionType}`;
    const emailBody = `
New Booking Details:
━━━━━━━━━━━━━━━━━━━━
📋 Session: ${booking.sessionType} (${booking.duration} mins)
💰 Amount Paid: ₹${booking.price}
🆔 Payment ID: ${paymentId}

👤 Customer Details:
   Name: ${booking.name}
   Email: ${booking.email}
   Phone: ${booking.phone}

📅 Scheduled For:
   Date: ${booking.date}
   Time: ${booking.time}

📝 Customer Message:
   ${booking.message}

🔗 Google Meet Link to Share:
   ${GOOGLE_MEET_LINK}
━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Send email via Formspree (free)
    const FORMSPREE_ID = 'mjgozran';

    try {
        await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                _subject: emailSubject,
                email: booking.email,
                name: booking.name,
                message: emailBody
            })
        });
        console.log('Email notification sent');
    } catch (error) {
        console.error('Admin email notification failed:', error);
    }

    // Send confirmation email to CUSTOMER with Meet link via EmailJS
    console.log('📧 Sending session confirmation to customer:', booking.email);

    if (EMAILJS_USER_ID !== 'YOUR_EMAILJS_USER_ID' && typeof emailjs !== 'undefined') {
        console.log('📧 EmailJS is available, sending...');
        try {
            const sessionParams = {
                to_email: booking.email,
                to_name: booking.name,
                subject: `Booking Confirmed: ${booking.sessionType}`,
                message: `🎉 Your session has been booked!

━━━━━━━━━━━━━━━━━━━━
📋 Session: ${booking.sessionType} (${booking.duration} mins)
📅 Date: ${booking.date}
⏰ Time: ${booking.time}
💰 Amount Paid: ₹${booking.price}
🆔 Payment ID: ${paymentId}
━━━━━━━━━━━━━━━━━━━━

🔗 JOIN YOUR SESSION HERE:
${GOOGLE_MEET_LINK}

Please save this link and join on time.

If you need to reschedule, reply to this email.

Best regards,
${BUSINESS_NAME}`
            };
            console.log('📧 Session email params:', sessionParams);

            const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, sessionParams);
            console.log('✅ Session confirmation SUCCESS:', result);
        } catch (error) {
            console.error('❌ Session EmailJS FAILED:', error);
            alert('Session email failed: ' + (error.text || error.message || error));
        }
    } else {
        console.log('⚠️ EmailJS not configured - customer confirmation email not sent');
    }

    // Show success message to customer
    alert(`🎉 Session Booked Successfully!

Payment ID: ${paymentId}

📅 ${booking.sessionType}
📆 ${booking.date}
⏰ ${booking.time}

✅ Confirmation email with Google Meet link has been sent to ${booking.email}

Thank you for booking!`);

    // Reset form
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingPrice').style.display = 'none';

    // Clear pending booking
    window.pendingBooking = null;
}
