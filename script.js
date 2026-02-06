// --- Brevo Email Configuration (Global) ---
// These are fallback values. Priority is given to window.CONFIG from config.js
let BREVO_API_KEY = 'xkeysib-your-api-key-here';
let BREVO_SENDER_EMAIL = 'jha.8@alumni.iitj.ac.in';
let BREVO_SENDER_NAME = 'QuantMentor';

// Helper to get latest config
function getBrevoConfig() {
    return {
        apiKey: (window.CONFIG && window.CONFIG.BREVO_API_KEY) || BREVO_API_KEY,
        senderEmail: (window.CONFIG && window.CONFIG.BREVO_SENDER_EMAIL) || BREVO_SENDER_EMAIL,
        senderName: (window.CONFIG && window.CONFIG.BREVO_SENDER_NAME) || BREVO_SENDER_NAME
    };
}

// Send email via Brevo API
async function sendEmailWithBrevo(to, subject, htmlContent, textContent) {
    const config = getBrevoConfig();

    if (!config.apiKey || config.apiKey === 'xkeysib-your-api-key-here') {
        console.warn('⚠️ Brevo API key not configured. Email not sent.');
        return { success: false, error: 'API key not configured' };
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': config.apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { email: config.senderEmail, name: config.senderName },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent,
                textContent: textContent
            })
        });

        if (response.ok) {
            console.log('✅ Email sent successfully via Brevo to:', to);
            return { success: true };
        } else {
            const error = await response.json();
            console.error('❌ Brevo error:', error);
            return { success: false, error: error.message };
        }
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return { success: false, error: error.message };
    }
}

// Send Notification to Admin
async function sendAdminNotification(subject, htmlContent, textContent) {
    const ADMIN_EMAIL = 'jha.8@alumni.iitj.ac.in';
    console.log('📧 Sending Admin Notification to:', ADMIN_EMAIL);
    return sendEmailWithBrevo(ADMIN_EMAIL, subject, htmlContent, textContent);
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM loaded, initializing all components...');

    // --- Dynamic Stats & Supabase Init ---
    const STATS_CONFIG = {
        students: { base: 50, id: 'stat-students' },
        experience: { startYear: 2020, id: 'stat-experience' },
        products: { base: 15, id: 'stat-products' }
    };

    if (typeof window.supabase !== 'undefined' && !window.supabaseClient) {
        const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_OhbTYIuMYgGgmKPQJ9W7RA_rhKyaad0';
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    async function updateStats() {
        // Experience
        const elExp = document.getElementById(STATS_CONFIG.experience.id);
        if (elExp) {
            const exp = new Date().getFullYear() - STATS_CONFIG.experience.startYear;
            elExp.textContent = `${exp}+`;
        }

        if (!window.supabaseClient) return;

        try {
            // Products
            const { count: prodCount } = await window.supabaseClient
                .from('products')
                .select('*', { count: 'exact', head: true });

            const elProd = document.getElementById(STATS_CONFIG.products.id);
            if (elProd && prodCount !== null) {
                elProd.textContent = `${STATS_CONFIG.products.base + prodCount}+`;
            }

            // Students (Bookings)
            const { count: bookCount } = await window.supabaseClient
                .from('bookings')
                .select('*', { count: 'exact', head: true });

            const elStud = document.getElementById(STATS_CONFIG.students.id);
            if (elStud && bookCount !== null) {
                elStud.textContent = `${STATS_CONFIG.students.base + bookCount}+`;
            }
        } catch (e) { console.error('Stats Update Error:', e); }
    }
    updateStats();

    // Initialize Dynamic Content
    if (typeof loadProductsFromSupabase === 'function') loadProductsFromSupabase();
    if (typeof loadSessionsFromSupabase === 'function') loadSessionsFromSupabase();
    if (typeof loadBlogsFromSupabase === 'function') loadBlogsFromSupabase();
    // -------------------------------------

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
            const href = this.getAttribute('href');
            // Prevent error if href is just "#" or empty
            if (!href || href === '#' || href.length <= 1) return;

            const target = document.querySelector(href);
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
            // Reset any previous discount state for a new product
            window.currentDiscountedPrice = undefined;
            // Keep track of product-specific coupon for this modal
            window.activeModalCoupon = {
                code: this.dataset.couponCode || '',
                percent: parseInt(this.dataset.couponPercent) || 0
            };
            // Clear coupon input
            const couponInput = document.getElementById('couponInput');
            if (couponInput) couponInput.value = '';
            // Clear any previously applied discount price shown
            // (the price text will be used if discount is not applied)

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal opened for:', product);
        });
    });

    // Apply coupon for the current product in modal
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', function () {
            const inputCode = document.getElementById('couponInput')?.value.trim() || '';
            const couponInfo = window.activeModalCoupon || { code: '', percent: 0 };
            const modalPriceEl = document.getElementById('modalPrice');
            const basePriceText = modalPriceEl?.textContent || '₹0';
            const basePrice = parseInt(basePriceText.replace(/[^0-9]/g, ''));

            if (inputCode && couponInfo.code && inputCode.toLowerCase() === couponInfo.code.toLowerCase()) {
                const discount = parseInt(couponInfo.percent) || 0;
                const discounted = Math.max(0, Math.round(basePrice * (100 - discount) / 100));
                modalPriceEl.textContent = '₹' + discounted;
                window.currentDiscountedPrice = discounted;
                alert('Coupon applied: ' + discount + '% off');
            } else {
                alert('Invalid coupon for this product');
                // Do not change price
            }
        });
    }

    // Close modal functions
    function closeModal() {
        modal.classList.remove('active');
        window.currentDiscountedPrice = undefined;
        window.activeModalCoupon = { code: '', percent: 0 };
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
const RAZORPAY_KEY_ID = 'rzp_live_SBbq38M84PSrrG';

// Your business name
const BUSINESS_NAME = 'QuantMentor';

// ================================
// BREVO EMAIL CONFIGURATION (replaces EmailJS - 9,000 emails/month free!)
// ================================
// ⚠️ Get these from brevo.com (free: 300 emails/day = 9,000/month)

// ================================
// SUPABASE INTEGRATION (for dynamic file links)
// ================================
const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OhbTYIuMYgGgmKPQJ9W7RA_rhKyaad0'; // Using provided public key

// Use global supabase reference (avoid local declaration)
// Initialize Supabase with delay to ensure SDK is loaded
setTimeout(function () {
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
            // Also load and display products from Supabase
            loadProductsFromSupabase();
            // Load sessions from Supabase
            loadSessionsFromSupabase();
            // Load blogs from Supabase
            loadBlogs();
            // Load approved testimonials
            loadApprovedTestimonials();

            // Check for direct product link in URL
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id') || urlParams.get('product');
            if (productId) {
                console.log('🔗 Direct link detected for product:', productId);
                // small delay to let products load
                setTimeout(() => window.openProductModal(productId), 1500);
            }
        } else {
            console.error('❌ Supabase SDK not loaded');
            console.log('⚠️ Continuing without Supabase - using default links');
        }
    } catch (e) {
        console.error('Supabase initialization failed:', e);
        console.log('⚠️ Continuing without Supabase - using default links');
    }
}, 500);

// Fetched country cache
let userCountryCode = null;

// Try to get user country (simple caching)
async function getUserCountry() {
    if (userCountryCode) return userCountryCode;

    // Helper to fetch with timeout
    const fetchWithTimeout = async (url, timeout = 3000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    };

    try {
        // Primary: ipapi.co
        const data = await fetchWithTimeout('https://ipapi.co/json/');
        userCountryCode = data.country_code;
    } catch (e) {
        console.warn('⚠️ Primary IP service (ipapi.co) failed:', e);
        try {
            // Fallback: ipwho.is (No API key required, good CORS)
            console.log('🔄 Trying fallback IP service (ipwho.is)...');
            const data = await fetchWithTimeout('https://ipwho.is/');
            if (data.success === false) throw new Error(data.message);
            userCountryCode = data.country_code;
        } catch (e2) {
            console.warn('❌ All IP services failed, defaulting to India (IN):', e2);
            userCountryCode = 'IN';
        }
    }

    console.log('🌍 User country detected:', userCountryCode);
    return userCountryCode;
}

// Currency Configuration - Maps country codes to currency info (rates fetched dynamically)
const CURRENCY_MAP = {
    'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    'US': { code: 'USD', symbol: '$', name: 'US Dollar' },
    'GB': { code: 'GBP', symbol: '£', name: 'British Pound' },
    'EU': { code: 'EUR', symbol: '€', name: 'Euro' },
    'DE': { code: 'EUR', symbol: '€', name: 'Euro' },
    'FR': { code: 'EUR', symbol: '€', name: 'Euro' },
    'IT': { code: 'EUR', symbol: '€', name: 'Euro' },
    'ES': { code: 'EUR', symbol: '€', name: 'Euro' },
    'NL': { code: 'EUR', symbol: '€', name: 'Euro' },
    'BE': { code: 'EUR', symbol: '€', name: 'Euro' },
    'AT': { code: 'EUR', symbol: '€', name: 'Euro' },
    'PT': { code: 'EUR', symbol: '€', name: 'Euro' },
    'GR': { code: 'EUR', symbol: '€', name: 'Euro' },
    'IE': { code: 'EUR', symbol: '€', name: 'Euro' },
    'FI': { code: 'EUR', symbol: '€', name: 'Euro' },
    'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    'KR': { code: 'KRW', symbol: '₩', name: 'Korean Won' },
    'CN': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    'CH': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    'SE': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    'NO': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    'DK': { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    'SG': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    'HK': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    'NZ': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    'BR': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    'MX': { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
    'ZA': { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    'RU': { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    'TR': { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    'AE': { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    'SA': { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    'PK': { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    'BD': { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    'LK': { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
    'NP': { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee' },
    'TH': { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    'MY': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    'ID': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    'PH': { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    'VN': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    'EG': { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
    'NG': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    'KE': { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    'GH': { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' }
};

// Cache for exchange rates
let exchangeRatesCache = null;
let exchangeRatesTimestamp = null;
const RATES_CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Fetch real-time exchange rates from API
async function fetchExchangeRates() {
    // Check if we have cached rates that are still valid
    if (exchangeRatesCache && exchangeRatesTimestamp) {
        const age = Date.now() - exchangeRatesTimestamp;
        if (age < RATES_CACHE_DURATION) {
            console.log('💱 Using cached exchange rates (age:', Math.round(age / 60000), 'minutes)');
            return exchangeRatesCache;
        }
    }

    try {
        // Try multiple exchange rate APIs in case one fails
        const apis = [
            'https://api.frankfurter.app/latest?from=INR',
            'https://open.er-api.com/v6/latest/INR',
            'https://api.exchangerate-api.com/v4/latest/INR'
        ];

        for (const apiUrl of apis) {
            try {
                console.log('💱 Trying exchange rate API:', apiUrl);
                const response = await fetch(apiUrl, { timeout: 5000 });

                if (!response.ok) {
                    console.warn('⚠️ API returned status:', response.status, apiUrl);
                    continue;
                }

                const data = await response.json();
                console.log('📊 API Response:', apiUrl, data);

                // Different APIs have different response formats
                let rates = null;

                if (data.rates) {
                    // Standard format
                    rates = data.rates;
                } else if (data.rates && data.rates.rates) {
                    // Nested format
                    rates = data.rates.rates;
                } else if (data.conversion_rates) {
                    // Some APIs use this format
                    rates = data.conversion_rates;
                }

                if (rates && Object.keys(rates).length > 0) {
                    exchangeRatesCache = rates;
                    exchangeRatesTimestamp = Date.now();
                    console.log('💱 Fetched fresh exchange rates from:', apiUrl);
                    return rates;
                }
            } catch (apiError) {
                console.warn('⚠️ API failed:', apiUrl, apiError.message);
                continue;
            }
        }

        throw new Error('All exchange rate APIs failed');
    } catch (error) {
        console.error('❌ Failed to fetch exchange rates:', error);
        console.log('⚠️ Falling back to hardcoded rates (may be outdated)');
        return getFallbackRates();
    }
}

// Fallback rates in case API fails
function getFallbackRates() {
    return {
        'INR': 1,
        'USD': 0.012,
        'GBP': 0.0095,
        'EUR': 0.011,
        'JPY': 1.8,
        'KRW': 16.5,
        'CNY': 0.087,
        'AUD': 0.018,
        'CAD': 0.016,
        'CHF': 0.010,
        'SEK': 0.13,
        'NOK': 0.13,
        'DKK': 0.084,
        'SGD': 0.016,
        'HKD': 0.094,
        'NZD': 0.020,
        'BRL': 0.067,
        'MXN': 0.24,
        'ZAR': 0.22,
        'RUB': 1.1,
        'TRY': 0.42,
        'AED': 0.044,
        'SAR': 0.045,
        'PKR': 3.3,
        'BDT': 1.4,
        'LKR': 3.6,
        'NPR': 1.6,
        'THB': 0.43,
        'MYR': 0.056,
        'IDR': 190,
        'PHP': 0.70,
        'VND': 300,
        'EGP': 0.60,
        'NGN': 18.5,
        'KES': 1.6,
        'GHS': 0.18
    };
}

// Get currency info for a country code
function getCurrencyForCountry(countryCode) {
    if (!countryCode) return CURRENCY_MAP['IN']; // Default to INR
    const code = countryCode.toUpperCase();
    return CURRENCY_MAP[code] || CURRENCY_MAP['IN']; // Default to INR if not found
}

// Convert INR price to local currency using live rates
async function convertPrice(inrPrice, countryCode) {
    if (!inrPrice || inrPrice <= 0) return { amount: 0, currency: CURRENCY_MAP['IN'] };

    const currency = getCurrencyForCountry(countryCode);
    const rates = await fetchExchangeRates();
    const rate = rates[currency.code] || 1;
    const convertedAmount = Math.round(inrPrice * rate);

    return {
        amount: convertedAmount,
        currency: currency,
        originalInr: inrPrice,
        rate: rate
    };
}

// Format price with currency symbol
function formatPrice(priceObj) {
    if (!priceObj || priceObj.amount === 0) return 'FREE';
    return `${priceObj.currency.symbol}${priceObj.amount.toLocaleString()}`;
}

// Load and display blogs from Supabase
async function loadBlogsFromSupabase() {
    try {
        if (!window.supabaseClient) return;

        const { data, error } = await window.supabaseClient
            .from('blogs')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading blogs:', error);
            return;
        }

        const blogGrid = document.getElementById('blog-grid');
        if (!blogGrid) return;

        blogGrid.innerHTML = '';

        if (!data || data.length === 0) {
            blogGrid.innerHTML = '<p style="text-align:center; color:var(--text-muted); grid-column:1/-1;">No articles found. Check back soon!</p>';
            return;
        }

        data.forEach(blog => {
            const date = new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.cursor = 'pointer';
            card.onclick = () => window.openBlogModal(blog.id);

            const imageHtml = blog.cover_image_url
                ? `<div class="product-image" style="height:200px; padding:0; overflow:hidden;"><img src="${blog.cover_image_url}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.5s ease;"></div>`
                : `<div class="product-image" style="height:200px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05);"><i class="fas fa-newspaper" style="font-size:3em; opacity:0.5;"></i></div>`;

            card.innerHTML = `
                ${imageHtml}
                <div class="product-content">
                    <div style="font-size:0.85em; color:var(--primary); margin-bottom:5px;">${date}</div>
                    <h3 class="product-title" style="margin-bottom:10px;">${blog.title}</h3>
                    <p class="product-description" style="margin-bottom:15px;">${blog.excerpt || ''}</p>
                    <div style="margin-top:auto; color:var(--text-color); font-weight:600; font-size:0.9em; display:flex; align-items:center; gap:5px;">
                        Read Article <i class="fas fa-arrow-right" style="font-size:0.8em;"></i>
                    </div>
                </div>
            `;
            blogGrid.appendChild(card);
        });

    } catch (err) {
        console.error('Failed to load blogs:', err);
    }
}

// Load and display products from Supabase
async function loadProductsFromSupabase() {
    try {
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }

        // Fetch country and exchange rates first
        await getUserCountry();
        await fetchExchangeRates(); // Pre-fetch rates for currency conversion

        const { data, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading products from Supabase:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('📦 Loading ' + data.length + ' products from Supabase');
            await displaySupabaseProducts(data);
        }
    } catch (err) {
        console.error('Failed to load products:', err);
    }
}

// Display products from Supabase in the products grid
// Display products separated by Paid and Free
async function displaySupabaseProducts(products) {
    const productsGrid = document.querySelector('#products .products-grid') || document.querySelector('.products-grid');
    const resourcesGrid = document.getElementById('resources-grid');

    if (productsGrid) productsGrid.innerHTML = '';
    if (resourcesGrid) resourcesGrid.innerHTML = '';

    const paidProducts = products.filter(p => p.price > 0);
    const freeProducts = products.filter(p => p.price === 0);

    const renderList = [
        { items: paidProducts, container: productsGrid, isFree: false },
        { items: freeProducts, container: resourcesGrid, isFree: true }
    ];

    for (const { items, container, isFree } of renderList) {
        if (!container) continue;
        if (items.length === 0 && isFree) {
            const section = document.getElementById('resources');
            if (section) section.style.display = 'none';
            continue;
        } else if (items.length > 0 && isFree) {
            const section = document.getElementById('resources');
            if (section) section.style.display = 'block';
        }

        for (const product of items) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.category = 'notes';

            // Convert price to local currency (async)
            const localPrice = await convertPrice(product.price, userCountryCode);
            const isLocalCurrency = localPrice.currency.code !== 'INR';

            const priceDisplay = isFree
                ? `<div class="product-price" style="color:#22c55e">Free</div>`
                : isLocalCurrency
                    ? `<div class="product-price" style="font-size:1.2em;">${formatPrice(localPrice)}</div>`
                    : `<div class="product-price">₹${product.price}</div>`;

            const btnText = isFree ? 'Download' : 'Buy Now';

            const imageSection = product.cover_image_url ?
                `<div class="product-image" style="padding:0; height:240px; background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <img src="${product.cover_image_url}" style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; transition:transform 0.5s ease;">
                    <div class="product-badge">${isFree ? 'FREE' : 'PDF'}</div>
                 </div>` :
                `<div class="product-image"><div class="product-placeholder pdf"><i class="fas fa-file-pdf"></i></div><div class="product-badge">${isFree ? 'FREE' : 'PDF'}</div></div>`;

            // Handle sanitized description
            const rawDesc = product.description || '';
            const displayDesc = (rawDesc === '<p><br></p>') ? '' : rawDesc;

            // Store price info on the card for modal use
            productCard.dataset.localPrice = JSON.stringify(localPrice);
            productCard.dataset.inrPrice = product.price;

            // Currency badge for non-INR countries
            const currencyBadge = (!isFree && isLocalCurrency)
                ? `<span style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: 600; margin-left: 8px;">${localPrice.currency.code}</span>`
                : '';

            productCard.innerHTML = `
                ${imageSection}
                <div class="product-content">
                    <h3 class="product-title">
                        ${product.name}${currencyBadge}
                        <button class="share-btn" onclick="copyProductLink('${product.id}')" title="Copy share link" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.8em; margin-left:10px; transition:color 0.3s ease;">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </h3>
                    <div class="product-description">${displayDesc.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'}</div>
                    <div class="product-meta">
                        <span><i class="fas fa-file-alt"></i> ${isFree ? 'Resource' : 'Premium Note'}</span>
                        <span><i class="fas fa-download"></i> Instant Access</span>
                    </div>
                    <div class="product-footer">
                        ${isFree ? priceDisplay : (product.original_price > product.price ? `<div style="display:flex;gap:8px;align-items:baseline;"><span style="text-decoration:line-through;color:var(--text-muted);font-size:0.9em">₹${product.original_price}</span>${priceDisplay}</div>` : priceDisplay)}
                        <button class="btn btn-product" onclick="openProductModal('${product.id}')" data-price="${product.price}">${btnText}</button>
                    </div>
                </div>
            `;
            container.appendChild(productCard);
        }
    }
}

// Global scope for product modal
window.openProductModal = async function (id) {
    if (!window.supabaseClient) return;
    try {
        const { data: product, error } = await window.supabaseClient.from('products').select('*').eq('id', id).single();
        if (error || !product) return;

        const modal = document.getElementById('productModal');
        if (!modal) return;

        // Convert price to local currency
        const localPrice = await convertPrice(product.price, userCountryCode);
        const isLocalCurrency = localPrice.currency.code !== 'INR';

        // Store price info for calculations
        window.currentProductInrPrice = product.price;
        window.currentProductLocalPrice = localPrice;
        window.currentProductIsLocalCurrency = isLocalCurrency;

        document.getElementById('modalTitle').textContent = product.name;
        document.getElementById('modalDescription').innerHTML = product.description || 'Premium digital product.';

        // Display price with local currency
        const priceElement = document.getElementById('modalPrice');
        const pppInfoElement = document.getElementById('pppInfo');
        const pppTextElement = document.getElementById('pppText');

        // Check if Free or Paid
        const isFree = (product.price === 0 || !product.price);
        const modalPayBtn = document.getElementById('modalPayBtn');
        const couponRow = document.querySelector('.coupon-row');
        const modalNote = document.querySelector('.modal-note');

        if (isFree) {
            priceElement.textContent = 'FREE';
            if (pppInfoElement) pppInfoElement.style.display = 'none';

            // UI Updates for FREE
            if (couponRow) couponRow.style.display = 'none';
            if (modalNote) modalNote.style.display = 'none';

            if (modalPayBtn) {
                modalPayBtn.innerHTML = '<i class="fas fa-download"></i> Download Now';
                modalPayBtn.style.background = '#22c55e'; // Green for download
            }
        } else {
            // UI Updates for PAID (Reset)
            if (couponRow) couponRow.style.display = 'flex';
            if (modalNote) modalNote.style.display = 'block';

            if (modalPayBtn) {
                modalPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> Pay Now';
                modalPayBtn.style.background = ''; // Reset to default primary color
            }

            if (isLocalCurrency) {
                // Show local currency only
                priceElement.innerHTML = `<span style="font-size:1.3em;font-weight:600;">${formatPrice(localPrice)}</span>`;
                if (pppInfoElement) pppInfoElement.style.display = 'none';
            } else {
                // Show INR for Indian users
                priceElement.textContent = '₹' + product.price;
                if (pppInfoElement) pppInfoElement.style.display = 'none';
            }
        }

        window.currentDiscountedPrice = undefined;
        window.activeModalCoupon = {
            code: product.coupon_code || '',
            percent: product.discount_percentage || 0
        };

        const couponInput = document.getElementById('couponInput');
        if (couponInput) couponInput.value = '';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (err) { console.error(err); }
};

// Load Sessions from Supabase and Update Services Section
async function loadSessionsFromSupabase() {
    try {
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }

        // Fetch country and exchange rates first for currency conversion
        await getUserCountry();
        await fetchExchangeRates();

        const { data, error } = await window.supabaseClient
            .from('sessions')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });

        if (error) {
            console.error('Error loading sessions from Supabase:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('🎯 Loading ' + data.length + ' sessions from Supabase');
            // Store sessions globally for booking form reference
            window.dynamicSessions = data;
            await updateServicesSection(data);
            await updateBookingForm(data);
        }
    } catch (err) {
        console.error('Failed to load sessions:', err);
    }
}

// Update Services Section with Dynamic Sessions
async function updateServicesSection(sessions) {
    const servicesContainer = document.querySelector('.services-grid');
    if (!servicesContainer) {
        console.error('Services container not found');
        return;
    }

    // Clear existing services (except hardcoded structure, we'll replace content)
    servicesContainer.innerHTML = '';

    for (let index = 0; index < sessions.length; index++) {
        const session = sessions[index];
        const serviceCard = document.createElement('div');
        serviceCard.className = session.is_popular ? 'service-card popular' : 'service-card';

        // Generate features HTML
        const featuresHtml = session.features ? session.features.map(feature =>
            `<li><i class="fas fa-check" style="color: #22c55e; margin-right: 8px;"></i>${feature}</li>`
        ).join('') : '';

        // Convert price to local currency
        const localPrice = await convertPrice(session.price, userCountryCode);
        const isLocalCurrency = localPrice.currency.code !== 'INR';

        const priceDisplay = session.price === 0
            ? '<span class="price-free">FREE</span>'
            : isLocalCurrency
                ? `<span style="font-weight:700;">${formatPrice(localPrice)}</span>`
                : `₹${session.price}`;

        serviceCard.innerHTML = `
            <div class="service-header">
                <div class="service-icon">
                    <i class="fas fa-${index === 0 ? 'headset' : index === 1 ? 'comments' : index === 2 ? 'graduation-cap' : 'briefcase'}"></i>
                </div>
                <h3 class="service-title">${session.name}</h3>
                ${session.is_popular ? '<span class="popular-badge">Most Popular</span>' : ''}
            </div>
            <div class="service-content">
                <div class="service-price">
                    ${priceDisplay}
                    <span class="price-duration">/${session.duration} min</span>
                </div>
                <p class="service-description">${session.description || 'Personalized mentorship session.'}</p>
                <ul class="service-features" style="list-style: none; padding: 0; margin: 0;">
                    ${featuresHtml}
                </ul>
            </div>
            <div class="service-footer">
                <a href="#contact" class="btn btn-service" data-service="${session.name}">
                    ${session.price === 0 ? '🆓 Book Free Session' : 'Book Session'}
                </a>
            </div>
`;

        servicesContainer.appendChild(serviceCard);

        // Add event listener for the booking button
        const bookBtn = serviceCard.querySelector('.btn-service');
        if (bookBtn) {
            bookBtn.addEventListener('click', function (e) {
                const service = this.dataset.service;
                const serviceSelect = document.getElementById('bookingService');
                if (serviceSelect) {
                    // Find the option with matching session name
                    const options = Array.from(serviceSelect.options);
                    const option = options.find(opt => opt.text.includes(service));
                    if (option) {
                        serviceSelect.value = option.value;
                        // Scroll to booking form
                        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        }
    }

    console.log('✅ Services section updated with ' + sessions.length + ' sessions');
}

// Update Booking Form with Dynamic Sessions
async function updateBookingForm(sessions) {
    const bookingSelect = document.getElementById('bookingService');
    if (!bookingSelect) {
        console.error('Booking select not found');
        return;
    }

    // Clear existing options (keep placeholder)
    const placeholder = bookingSelect.options[0];
    bookingSelect.innerHTML = '';
    bookingSelect.appendChild(placeholder);

    for (const session of sessions) {
        const option = document.createElement('option');
        const valueType = session.name.toLowerCase().replace(/\s+/g, '_');

        // Convert price to local currency for display
        const localPrice = await convertPrice(session.price, userCountryCode);
        const isLocalCurrency = localPrice.currency.code !== 'INR';

        option.value = `${valueType}| ${session.price}| ${session.duration} `;
        if (session.price === 0) {
            option.innerHTML = `🆓 ${session.name} (${session.duration} min) - FREE`;
        } else if (isLocalCurrency) {
            option.innerHTML = `${session.name} (${session.duration} min) - ${formatPrice(localPrice)}`;
        } else {
            option.innerHTML = `${session.name} (${session.duration} min) - ₹${session.price}`;
        }
        option.style.color = session.price === 0 ? '#22c55e' : '';

        bookingSelect.appendChild(option);
    }

    console.log('✅ Booking form updated with ' + sessions.length + ' sessions');
}

// Default links (fallback) - will be updated from Supabase
const PRODUCT_DOWNLOAD_LINKS = {
    'Python for Quants': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'C++ for Quants': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'XVA Derivatives Primer': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Quant Projects Bundle': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Interview Bible': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Complete Quant Bundle': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
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
                console.log(`🔗 Link updated for: ${product.name} `);
            });
        } else {
            console.log('📚 No products found in Supabase, using default links');
        }
    } catch (err) {
        console.error('Failed to fetch product links:', err);
        console.log('📚 Continuing with default download links');
    }

    // ---------------- Admin Panel Helpers ----------------
    // Admin: fetch and render products in Admin panel
    async function fetchAdminProducts() {
        if (typeof window.supabaseClient === 'undefined') return;
        try {
            const { data, error } = await window.supabaseClient
                .from('products')
                .select('*')
                .order('id', { ascending: false });
            if (error) {
                console.error('Admin: error loading products:', error);
                return;
            }
            if (data && data.length > 0) {
                renderAdminProductsTable(data);
            }
        } catch (e) {
            console.error('Admin: failed to fetch products', e);
        }
    }

    // Admin: handle Add Product form
    const adminAddForm = document.getElementById('adminAddProductForm');
    if (adminAddForm) {
        adminAddForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (typeof window.supabaseClient === 'undefined') return;
            const name = (document.getElementById('adminProductName').value || '').trim();
            const price = parseFloat(document.getElementById('adminProductPrice').value || '0');
            const description = (document.getElementById('adminProductDescription').value || '').trim();
            const couponCode = (document.getElementById('adminCouponCode').value || '').trim();
            const couponPercent = parseInt(document.getElementById('adminCouponPercent').value || '0');

            if (!name) {
                alert('Please enter a product name.');
                return;
            }

            const payload = {
                name,
                price: isNaN(price) ? 0 : price,
                description,
                coupon_code: couponCode || null,
                coupon_percent: isNaN(couponPercent) ? 0 : couponPercent
            };
            try {
                const { data, error } = await window.supabaseClient
                    .from('products')
                    .insert(payload)
                    .select();
                if (error) {
                    alert('Error adding product: ' + error.message);
                    return;
                }
                fetchAdminProducts();
                adminAddForm.reset();
            } catch (err) {
                console.error('Admin: add product failed', err);
            }
        });
    }

    // Render admin products in the admin table
    function renderAdminProductsTable(products) {
        const tbody = document.querySelector('#adminProductsTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
    < td style = "padding:8px 6px;" > ${p.id ?? ''}</td >
                <td style="padding:8px 6px;">${p.name ?? ''}</td>
                <td style="padding:8px 6px;">₹${p.price ?? 0}</td>
                <td style="padding:8px 6px;">${p.coupon_code ?? ''} (${p.coupon_percent ?? 0}%)</td>
                <td style="padding:8px 6px;">${p.description ?? ''}</td>
                <td style="padding:8px 6px;">
                    <button class="btn btn-secondary" data-id="${p.id}" data-name="${p.name ?? ''}" data-price="${p.price ?? 0}" data-description="${p.description ?? ''}" data-code="${p.coupon_code ?? ''}" data-percent="${p.coupon_percent ?? 0}" onclick="adminEditProduct(this)">Edit</button>
                </td>
`;
            tbody.appendChild(tr);
        });
    }

    // Called when user clicks Edit in Admin panel. Simple prompt-based editor.
    window.adminEditProduct = async function (button) {
        const id = button.getAttribute('data-id');
        const currentName = button.getAttribute('data-name') || '';
        const currentPrice = button.getAttribute('data-price') || 0;
        const currentDescription = button.getAttribute('data-description') || '';
        const currentCode = button.getAttribute('data-code') || '';
        const currentPercent = button.getAttribute('data-percent') || 0;

        const name = prompt('Product Name', currentName) || currentName;
        const price = parseFloat(prompt('Price (INR)', currentPrice) || currentPrice);
        const description = prompt('Description', currentDescription) || currentDescription;
        const code = prompt('Coupon Code', currentCode) || '';
        const percent = parseInt(prompt('Coupon Percent', currentPercent) || currentPercent);

        // Persist only if id exists and user provided changes
        if (!id) return;
        try {
            const payload = {
                name,
                price: isNaN(price) ? 0 : price,
                description,
                coupon_code: code,
                coupon_percent: isNaN(percent) ? 0 : percent
            };
            const { data, error } = await window.supabaseClient
                .from('products')
                .update(payload)
                .eq('id', id)
                .select();
            if (error) {
                alert('Failed to update product: ' + error.message);
                return;
            }
            // Refresh admin table
            fetchAdminProducts();
        } catch (e) {
            console.error('Admin: update failed', e);
        }
    }
}

function initRazorpayCheckout(productName, amount, currency = 'INR', inrAmountForLogging = null) {
    console.log('🚀 initRazorpayCheckout called:', { productName, amount, currency, inrAmountForLogging });

    // Handle FREE products (0 value) - skip payment, go directly to download
    if (amount <= 0) {
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
        script.onload = function () {
            console.log('✅ Razorpay SDK loaded successfully');
            alert('✅ Payment system loaded!\nPlease click "Buy Now" again.');
        };
        script.onerror = function () {
            console.error('❌ Failed to load Razorpay SDK');
            alert('❌ Unable to load payment system.\nPlease refresh the page and try again.');
        };
        document.head.appendChild(script);
        return;
    }

    // Smallest currency sub-unit multiplier (100 for INR/USD/GBP, 1 for JPY)
    const multiplier = (currency.toUpperCase() === 'JPY') ? 1 : 100;

    var options = {
        "key": RAZORPAY_KEY_ID,
        "amount": Math.round(amount * multiplier), // Convert to subunits (paise/cents)
        "currency": currency,
        "name": BUSINESS_NAME,
        "description": productName,
        "handler": async function (response) {
            console.log('Payment success:', response);
            // ✅ Payment successful!
            const paymentId = response.razorpay_payment_id;

            // Determine amount to log (INR preference for database stats)
            // If inrAmountForLogging is passed, use it. Otherwise use the amount paid (assuming INR).
            const loggedAmount = inrAmountForLogging !== null ? inrAmountForLogging : ((currency === 'INR') ? amount : 0);

            const downloadLink = PRODUCT_DOWNLOAD_LINKS[productName];

            // Get customer email from Razorpay response or prompt
            const customerEmail = prompt('Enter your email to receive the download link:');

            if (customerEmail && customerEmail.includes('@')) {
                // Log purchase to Supabase for statistics
                if (window.supabaseClient) {
                    try {
                        console.log('📊 Logging purchase to database:', {
                            customerEmail,
                            productName,
                            loggedAmount,
                            currencyPaid: currency,
                            amountPaid: amount,
                            paymentId
                        });

                        await window.supabaseClient
                            .from('purchases')
                            .insert({
                                customer_email: customerEmail,
                                product_name: productName,
                                amount: Math.round(loggedAmount), // Store as Integer INR
                                payment_id: paymentId
                            });
                        console.log('✅ Purchase logged successfully');
                    } catch (err) {
                        console.error('❌ Failed to log purchase:', err);
                    }
                }

                if (downloadLink && downloadLink !== 'YOUR_DRIVE_LINK_HERE') {
                    // Send email to customer via Brevo
                    sendProductEmail(customerEmail, productName, paymentId, downloadLink);

                    // Send Admin Notification
                    const adminSubject = `💰 New Product Sale: ${productName}`;
                    const adminBody = `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #22c55e; border-radius: 8px;">
                            <h2 style="color: #16a34a;">💰 New Sale!</h2>
                            <p><strong>Product:</strong> ${productName}</p>
                            <p><strong>Amount:</strong> ₹${Math.round(loggedAmount)}</p>
                            <p><strong>Customer Email:</strong> ${customerEmail}</p>
                            <p><strong>Payment ID:</strong> ${paymentId}</p>
                        </div>
                    `;
                    const adminText = `New Sale!\nProduct: ${productName}\nAmount: ₹${Math.round(loggedAmount)}\nEmail: ${customerEmail}\nID: ${paymentId}`;
                    sendAdminNotification(adminSubject, adminBody, adminText);

                    alert('🎉 Payment Successful!\n\nPayment ID: ' + paymentId + '\n\nDownload link sent to: ' + customerEmail + '\n\nClick OK to also open it now.');
                    window.open(downloadLink, '_blank');
                } else {
                    alert('🎉 Payment Successful!\n\nPayment ID: ' + paymentId + '\n\n⚠️ Download link not configured (but your purchase is recorded). Please contact support.');
                }
            } else {
                alert('🎉 Payment Successful!\n\nPayment ID: ' + paymentId + '\n\n⚠️ No valid email provided. Please contact support to receive your download.');
                if (downloadLink && downloadLink !== 'YOUR_DRIVE_LINK_HERE') {
                    window.open(downloadLink, '_blank');
                }
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
 * Send product purchase email to customer via Brevo (replaces EmailJS)
 * Free tier: 300 emails/day = 9,000/month
 */
async function sendProductEmail(customerEmail, productName, paymentId, downloadLink) {
    const FORMSPREE_ID = 'mjgozran';

    console.log('📧 sendProductEmail called with:', customerEmail);

    // Send to CUSTOMER via Brevo
    const config = getBrevoConfig();
    if (config.apiKey && config.apiKey !== 'xkeysib-your-api-key-here') {
        console.log('📧 Attempting to send via Brevo...');

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">🎉 Thank you for your purchase!</h2>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p><strong>📦 Product:</strong> ${productName}</p>
                <p><strong>🆔 Payment ID:</strong> ${paymentId}</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p><strong>📥 Download your product:</strong></p>
                <a href="${downloadLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Download Now</a>
                <p style="margin-top: 20px; color: #6b7280;">If you have any questions, simply reply to this email.</p>
                <p style="color: #6b7280;">Best regards,<br>${BUSINESS_NAME}</p>
            </div>
        `;

        const textContent = `🎉 Thank you for your purchase!

Product: ${productName}
Payment ID: ${paymentId}

Download your product here: ${downloadLink}

If you have any questions, simply reply to this email.

Best regards,
${BUSINESS_NAME}`;

        try {
            const result = await sendEmailWithBrevo(
                customerEmail,
                `Your Purchase: ${productName}`,
                htmlContent,
                textContent
            );

            if (result.success) {
                console.log('✅ Brevo SUCCESS: Email sent to', customerEmail);
            } else {
                console.error('❌ Brevo FAILED:', result.error);
            }
        } catch (error) {
            console.error('❌ Brevo email failed:', error);
        }
    } else {
        console.log('⚠️ Brevo API key not configured. Skipping customer email.');
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

        // Default to INR basics
        let payAmount = window.currentProductInrPrice || parseInt(priceText.replace(/[^\d]/g, ''));
        let payCurrency = 'INR';
        let logAmountInr = payAmount; // For database stats

        // CHECK 1: International Currency Mode?
        if (window.currentProductIsLocalCurrency && window.currentProductLocalPrice) {
            payCurrency = window.currentProductLocalPrice.currency.code;
            payAmount = window.currentProductLocalPrice.amount;
            console.log(`🌍 International Mode: Paying in ${payCurrency}`, payAmount);
        }

        // CHECK 2: Coupon Applied?
        // We use activeModalCoupon because currentDiscountedPrice is often INR-only
        if (window.activeModalCoupon && window.activeModalCoupon.percent > 0) {
            const discountPercent = window.activeModalCoupon.percent;

            // Calculate discounted Pay Amount
            const originalPayAmount = payAmount;
            const discountValue = (originalPayAmount * discountPercent) / 100;
            payAmount = originalPayAmount - discountValue;

            // Calculate discounted Log Amount (INR)
            const originalLogAmount = logAmountInr;
            const logDiscountValue = (originalLogAmount * discountPercent) / 100;
            logAmountInr = originalLogAmount - logDiscountValue;

            console.log('🎟️ Coupon applied:', {
                percent: discountPercent,
                originalPay: originalPayAmount,
                finalPay: payAmount,
                currency: payCurrency
            });
        }

        // Round amounts to 2 decimal places for payment (standard currency precision)
        // However, Razorpay expects 'amount' argument to be in MAJOR units (e.g., Doctors Fees 500)
        // which it then multiplies by 100 in initRazorpayCheckout.
        // So we keep it as integer or float major units.

        // Ensure we don't send crazy floats
        payAmount = parseFloat(payAmount.toFixed(2));
        logAmountInr = Math.round(logAmountInr); // Database stores integer INR

        console.log('🚀 Final Payment Config:', { payAmount, payCurrency, logAmountInr });

        if (isNaN(payAmount)) {
            alert('Error parsing price. Please try again.');
            return;
        }

        // Allow 0 for free products, initiate checkout flow (handler will separate free vs paid)
        if (payAmount < 0) {
            alert('Invalid price detected.');
            return;
        }

        document.getElementById('productModal').classList.remove('active');
        document.body.style.overflow = '';

        console.log('Calling initRazorpayCheckout...');
        initRazorpayCheckout(productName, payAmount, payCurrency, logAmountInr);
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

// Session types (loaded dynamically from Supabase)
let SESSION_TYPES = {};

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
        bookingService.addEventListener('change', async function () {
            const value = this.value;
            if (value) {
                const [type, price, duration] = value.split('|');
                const priceValue = parseInt(price.trim());

                // Convert price to local currency
                const localPrice = await convertPrice(priceValue, userCountryCode);
                const isLocalCurrency = localPrice.currency.code !== 'INR';

                // Store for submit handler to avoid re-fetching
                window.selectedSessionLocalPrice = {
                    amount: isLocalCurrency ? localPrice.amount : priceValue,
                    currency: isLocalCurrency ? localPrice.currency.code : 'INR',
                    originalInr: priceValue,
                    isLocal: isLocalCurrency
                };

                if (isLocalCurrency) {
                    priceDisplay.textContent = formatPrice(localPrice);
                } else {
                    priceDisplay.textContent = '₹' + priceValue;
                }

                bookingPrice.style.display = 'flex';
            } else {
                bookingPrice.style.display = 'none';
                window.selectedSessionLocalPrice = null; // Clear on deselect
            }
        });
    }

    // Dynamic Time Slot Logic (Time Zone Conversion)
    if (bookingDate) {
        bookingDate.addEventListener('change', async function () {
            const dateValue = this.value;
            const timeSelect = document.getElementById('bookingTime');
            if (!dateValue || !timeSelect) return;

            timeSelect.innerHTML = '<option value="">Loading available slots...</option>';
            timeSelect.disabled = true;

            try {
                // 1. Detect User Timezone
                const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const dateObj = new Date(dateValue);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                // 2. Fetch Availability Pattern & Existing Bookings from Supabase
                let availability = null;
                let hasRecord = false;
                let existingBookings = [];

                if (window.supabaseClient) {
                    // Fetch slots availability
                    const { data: availData, error: availError } = await window.supabaseClient
                        .from('availability_patterns')
                        .select('*')
                        .eq('day_of_week', dayName)
                        .single();

                    if (availData) {
                        hasRecord = true;
                        if (availData.is_active) {
                            availability = availData;
                        }
                    }

                    // Fetch existing bookings for this date (to prevent collision)
                    // booking_date is DATE type, so we should query with YYYY-MM-DD
                    const { data: bookingsData, error: bookingsError } = await window.supabaseClient
                        .from('bookings')
                        .select('booking_time')
                        .eq('booking_date', dateValue); // Use dateValue (YYYY-MM-DD) directly

                    if (bookingsData) {
                        // DB returns booking_time as "14:00:00" (TIME type)
                        // We need to match it with our generated label "2:00 PM"
                        // So let's convert DB times to our display format for comparison
                        existingBookings = bookingsData.map(b => {
                            // b.booking_time is likely "14:00:00"
                            const [h, m] = b.booking_time.split(':');
                            const date = new Date();
                            date.setHours(parseInt(h), parseInt(m));
                            return date.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            });
                        });
                        console.log('📅 Existing bookings for ' + dateValue + ' (DB raw -> formatted):', bookingsData, existingBookings);
                    }
                }

                // Fallback only if no record exists for this day at all
                if (!availability && !hasRecord) {
                    availability = {
                        start_time: '10:00:00',
                        end_time: '18:00:00'
                    };
                    if (dayName === 'Sunday') availability = null;
                }

                timeSelect.innerHTML = '<option value="">Select time slot</option>';

                if (!availability) {
                    timeSelect.innerHTML = '<option value="" disabled>No slots available today</option>';
                    return;
                }

                // 3. Generate Slots (30-minute intervals)
                const startHour = parseInt(availability.start_time.split(':')[0]);
                const endHour = parseInt(availability.end_time.split(':')[0]);

                // Helper to format time
                const formatTime = (date) => {
                    return date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                };

                // Generate slots from startHour to endHour with 30 min intervals
                // Create a base date in IST (Mentor time)
                // We construct the start time: 
                let currentSlot = new Date(dateValue + `T${startHour.toString().padStart(2, '0')}:00:00+05:30`);
                const endTime = new Date(dateValue + `T${endHour.toString().padStart(2, '0')}:00:00+05:30`);

                while (currentSlot < endTime) {
                    // Convert to User Timezone for display
                    const displayTime = currentSlot.toLocaleTimeString('en-US', {
                        timeZone: userTimeZone,
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });

                    // Format timezone name (e.g., IST, GMT, EST)
                    const tzName = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone: userTimeZone }).formatToParts(currentSlot).find(p => p.type === 'timeZoneName')?.value || '';

                    const istTimeLabel = formatTime(currentSlot); // e.g. "10:00 AM" or "10:30 AM"

                    const option = document.createElement('option');
                    option.value = istTimeLabel;

                    // Check collision
                    const isBooked = existingBookings.includes(istTimeLabel);

                    if (isBooked) {
                        option.textContent = `${istTimeLabel} IST - Booked ❌`;
                        option.disabled = true;
                        option.style.color = '#ef4444'; // Red color
                    } else {
                        option.textContent = `${istTimeLabel} IST (${displayTime} ${tzName})`;
                    }

                    timeSelect.appendChild(option);

                    // Add 30 minutes
                    currentSlot.setMinutes(currentSlot.getMinutes() + 30);
                }

            } catch (err) {
                console.error('Error generating slots:', err);
                timeSelect.innerHTML = '<option value="">Error loading slots</option>';
            } finally {
                timeSelect.disabled = false;
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

        // Try to find session info from dynamic sessions
        let sessionInfo = null;

        if (window.dynamicSessions) {
            sessionInfo = window.dynamicSessions.find(s =>
                s.name.toLowerCase().replace(/\s+/g, '_') === sessionType ||
                s.name.toLowerCase() === sessionType.replace(/_/g, ' ')
            );
        }

        // If still not found, create session info from the dropdown text
        if (!sessionInfo) {
            const selectedOption = bookingService.options[bookingService.selectedIndex];
            if (selectedOption && selectedOption.text) {
                const match = selectedOption.text.match(/[🆓\s]*([^\(]+)/);
                const sessionName = match ? match[1].trim() : 'Session';
                sessionInfo = {
                    name: sessionName,
                    price: parseInt(price) || 0,
                    duration: parseInt(duration) || 60
                };
            }
        }

        if (!sessionInfo) {
            alert('Error: Invalid session type. Please refresh and try again.');
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

        // Prepare Payment Details
        let payAmount = sessionInfo.price;
        let payCurrency = 'INR';
        let logAmountInr = sessionInfo.price;

        // Check for Local Currency
        // We need to re-convert because we only have the INR price in sessionInfo
        // If we already displayed local price, we should re-fetch that conversion or just convert again to be safe
        try {
            if (userCountryCode && userCountryCode !== 'IN') {
                // We can re-use the convertPrice function
                // Note: convertPrice is async, so we wrap this block or just call it
                // But wait, the listener is async!
                const localPrice = await convertPrice(sessionInfo.price, userCountryCode);
                if (localPrice.currency.code !== 'INR') {
                    payAmount = localPrice.amount;
                    payCurrency = localPrice.currency.code;
                    console.log(`🌍 Booking International: Paying in ${payCurrency}`, payAmount);
                }
            }
        } catch (e) {
            console.warn('Currency conversion failed for booking, defaulting to INR', e);
        }

        // Store booking details for after payment
        window.pendingBooking = {
            name,
            email,
            phone,
            sessionType: sessionInfo.name,
            duration: sessionInfo.duration,
            price: Math.round(logAmountInr), // Store INR price in DB
            date: formattedDate,
            time,
            message
        };

        console.log('Opening Razorpay for session:', sessionDescription, 'Price:', payAmount, payCurrency);

        // Open Razorpay for session payment
        initSessionPayment(sessionDescription, payAmount, email, payCurrency, logAmountInr);
    });
}

/**
 * Initialize Razorpay for session booking payment
 */
// Initialize Razorpay for session booking payment
function initSessionPayment(description, amount, customerEmail, currency = 'INR', inrAmountForLogging = null) {
    // Handle FREE sessions (0 value)
    if (amount <= 0) {
        handleSessionPaymentSuccess({ razorpay_payment_id: 'FREE_SESSION_' + Date.now() });
        return;
    }

    if (RAZORPAY_KEY_ID === 'YOUR_RAZORPAY_KEY_ID_HERE') {
        alert('⚠️ Payment system not configured. Please contact the admin.');
        return;
    }

    // Smallest currency sub-unit multiplier (100 for INR/USD/GBP, 1 for JPY)
    const multiplier = (currency.toUpperCase() === 'JPY') ? 1 : 100;

    var options = {
        "key": RAZORPAY_KEY_ID,
        "amount": Math.round(amount * multiplier),
        "currency": currency,
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

    // Store booking in Supabase database
    console.log('📋 Attempting to store booking in Supabase...');
    console.log('📋 Booking data:', {
        email: booking.email,
        name: booking.name,
        phone: booking.phone,
        service_name: booking.sessionType,
        service_price: booking.price,
        service_duration: booking.duration,
        booking_date: booking.date,
        booking_time: booking.time,
        message: booking.message,
        status: 'upcoming',
        payment_id: paymentId
    });

    // Check if Supabase client is available
    if (!window.supabaseClient) {
        console.error('❌ window.supabaseClient is undefined! Cannot store booking.');
        alert('Error: Database connection not available. Please refresh the page and try again.');
    } else {
        console.log('✅ window.supabaseClient is defined, attempting insert...');
        try {
            const { data, error } = await window.supabaseClient
                .from('bookings')
                .insert({
                    email: booking.email,
                    name: booking.name,
                    phone: booking.phone,
                    service_name: booking.sessionType,
                    service_price: booking.price,
                    service_duration: booking.duration,
                    booking_date: booking.date,
                    booking_time: booking.time,
                    message: booking.message,
                    status: 'upcoming',
                    payment_id: paymentId
                })
                .select();

            if (error) {
                console.error('❌ Supabase insert failed:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                throw error;
            }

            console.log('✅ Booking stored in Supabase:', data);
        } catch (error) {
            console.error('❌ Error storing booking in database:', error);
            console.error('Full error:', error.message, error.stack);
            // Continue with email notifications even if database insert fails
        }
    }

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
        console.error('Formspree email failed:', error);
    }

    // Send Admin Notification via Brevo (Unified System)
    const adminHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #4f46e5;">🆕 New Session Booking</h2>
            <p><strong>Customer:</strong> ${booking.name}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Phone:</strong> ${booking.phone}</p>
            <hr>
            <p><strong>Session:</strong> ${booking.sessionType}</p>
            <p><strong>Price:</strong> ₹${booking.price}</p>
            <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
            <p><strong>Payment ID:</strong> ${paymentId}</p>
            <p><strong>Message:</strong> ${booking.message}</p>
            <hr>
            <p><strong>🔗 Meeting Link:</strong> <a href="${GOOGLE_MEET_LINK}">${GOOGLE_MEET_LINK}</a></p>
        </div>
    `;
    await sendAdminNotification(`New Booking: ${booking.name} - ${booking.sessionType}`, adminHtml, emailBody);

    // Send confirmation email to CUSTOMER with Meet link via Brevo
    console.log('📧 Sending session confirmation to customer:', booking.email);

    const config = getBrevoConfig();
    if (config.apiKey && config.apiKey !== 'xkeysib-your-api-key-here') {
        console.log('📧 Brevo is available, sending...');

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">🎉 Your session has been booked!</h2>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p><strong>📋 Session:</strong> ${booking.sessionType} (${booking.duration} mins)</p>
                <p><strong>📅 Date:</strong> ${booking.date}</p>
                <p><strong>⏰ Time:</strong> ${booking.time}</p>
                <p><strong>💰 Amount Paid:</strong> ₹${booking.price}</p>
                <p><strong>🆔 Payment ID:</strong> ${paymentId}</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p><strong>🔗 JOIN YOUR SESSION HERE:</strong></p>
                <a href="${GOOGLE_MEET_LINK}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Join Google Meet</a>
                <p style="margin-top: 20px;"><strong>🔄 Need to Reschedule?</strong></p>
                <p>Visit: <a href="${window.location.origin}/my-bookings.html">My Bookings</a></p>
                <p>Enter your email (${booking.email}) to view and reschedule your session.</p>
                <p style="margin-top: 20px; color: #6b7280;">Best regards,<br>${BUSINESS_NAME}</p>
            </div>
        `;

        const textContent = `🎉 Your session has been booked!

Session: ${booking.sessionType} (${booking.duration} mins)
Date: ${booking.date}
Time: ${booking.time}
Amount Paid: ₹${booking.price}
Payment ID: ${paymentId}

JOIN YOUR SESSION HERE:
${GOOGLE_MEET_LINK}

Need to Reschedule?
Visit: ${window.location.origin}/my-bookings.html
Enter your email (${booking.email}) to view and reschedule.

Best regards,
${BUSINESS_NAME}`;

        try {
            const result = await sendEmailWithBrevo(
                booking.email,
                `Booking Confirmed: ${booking.sessionType}`,
                htmlContent,
                textContent
            );

            if (result.success) {
                console.log('✅ Session confirmation SUCCESS via Brevo');
            } else {
                console.error('❌ Brevo session email FAILED:', result.error);
            }
        } catch (error) {
            console.error('❌ Session email failed:', error);
        }
    } else {
        console.log('⚠️ Brevo API key not configured - customer confirmation email not sent');
    }

    // Show success message to customer
    alert(`🎉 Session Booked Successfully!

Payment ID: ${paymentId}

📅 ${booking.sessionType}
📆 ${booking.date}
⏰ ${booking.time}

✅ Confirmation email with Google Meet link has been sent to ${booking.email}

🔄 Need to Reschedule?
Visit: ${window.location.origin}/my-bookings.html
Enter your email to view and reschedule your session.

Thank you for booking!`);

    // Reset form
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingPrice').style.display = 'none';

    // Calendar refresh removed (no longer used)
    // const month = currentDate.getMonth();
    // const year = currentDate.getFullYear();
    // renderCalendar(month, year);
}

// --- BLOG & RESOURCES LOGIC ---

async function loadBlogs() {
    console.log('📰 Attempting to load blogs from Supabase...');
    if (!window.supabaseClient) {
        console.error('❌ Supabase client not ready for blogs');
        return;
    }
    try {
        const { data, error } = await window.supabaseClient.from('blogs').select('*').eq('is_published', true).order('created_at', { ascending: false });
        if (error) {
            console.error('❌ Error fetching blogs:', error);
            return;
        }
        console.log(`📰 Blogs fetched: ${data?.length || 0} published articles found.`);
        if (data) displayBlogs(data);
    } catch (e) { console.error('Blog load error', e); }
}

function displayBlogs(blogs) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (blogs.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-muted)">Coming soon.</p>';
        return;
    }

    blogs.forEach(blog => {
        const div = document.createElement('div');
        div.className = 'product-card blog-card';
        div.style.cursor = 'pointer';
        div.onclick = () => openBlogModal(blog.id);

        div.innerHTML = `
            <div class="product-image" style="padding:0; aspect-ratio:16/9; overflow:hidden; background:#1e293b;">
                ${blog.cover_image_url ? `<img src="${blog.cover_image_url}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:gray;"><i class="fas fa-newspaper fa-3x"></i></div>`}
                <div class="product-badge" style="background:#8b5cf6;">ARTICLE</div>
            </div>
            <div class="product-content" style="display:flex; flex-direction:column;">
                <h3 class="product-title">${blog.title}</h3>
                <p class="product-description" style="flex:1; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${blog.excerpt || ''}</p>
                <div class="product-footer" style="margin-top:15px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
                     <span style="font-size:0.85em; color:var(--text-muted);">${new Date(blog.created_at).toLocaleDateString()}</span>
                     <span style="color:var(--accent); font-size:0.9em; font-weight:600;">Read &rarr;</span>
                </div>
            </div>
        `;
        grid.appendChild(div);
    });
}

// --- APPROVED TESTIMONIALS ---
async function loadApprovedTestimonials() {
    const grid = document.getElementById('approved-testimonials-grid');
    if (!grid) return;

    console.log('📣 Loading approved testimonials...');
    if (!window.supabaseClient) {
        console.log('⚠️ Supabase not available for testimonials');
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('testimonials')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching testimonials:', error);
            return;
        }

        console.log(`✅ Loaded ${data?.length || 0} approved testimonials`);
        displayApprovedTestimonials(data || []);
    } catch (e) {
        console.error('Testimonials load error:', e);
    }
}

function displayApprovedTestimonials(testimonials) {
    const grid = document.getElementById('approved-testimonials-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (testimonials.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:40px;">No reviews yet. Be the first to share your experience!</p>';
        return;
    }

    testimonials.forEach(t => {
        const stars = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
        const date = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        const div = document.createElement('div');
        div.className = 'testimonial-card';
        div.innerHTML = `
            <div class="testimonial-rating">${'★'.repeat(t.rating)}</div>
            <p class="testimonial-text">"${escapeHtml(t.review)}"</p>
            <div class="testimonial-author">
                <div class="author-avatar"><i class="fas fa-user"></i></div>
                <div class="author-info">
                    <span class="author-name">${escapeHtml(t.name)}</span>
                    <span class="author-role">${escapeHtml(t.title)}</span>
                </div>
            </div>
            <div class="verified-badge">
                <i class="fas fa-check-circle"></i> Verified • ${date}
            </div>
        `;
        grid.appendChild(div);
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global scope for HTML access
window.openBlogModal = async function (id) {
    const modal = document.getElementById('blogModal');
    if (!modal) { console.error('Blog Modal Not Found'); return; }

    // Reset & Show Loading
    document.getElementById('blogModalTitle').textContent = 'Loading...';
    document.getElementById('blogModalContent').innerHTML = '';
    document.getElementById('blogModalCover').style.display = 'none';
    modal.classList.add('active');
    modal.style.display = 'flex'; // Ensure display flex overrides any none

    try {
        const { data } = await window.supabaseClient.from('blogs').select('*').eq('id', id).single();
        if (data) {
            document.getElementById('blogModalTitle').textContent = data.title;
            document.getElementById('blogModalMeta').textContent = new Date(data.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            document.getElementById('blogModalContent').innerHTML = data.content;

            const cover = document.getElementById('blogModalCover');
            if (data.cover_image_url) {
                cover.style.display = 'block';
                cover.querySelector('img').src = data.cover_image_url;
            }
        }
    } catch (e) {
        document.getElementById('blogModalContent').textContent = 'Error loading article.';
    }
};

// Initialize Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Blogs now loaded in main init sequence above

    const blogClose = document.getElementById('blogModalClose');
    if (blogClose) {
        blogClose.onclick = () => {
            const m = document.getElementById('blogModal');
            m.classList.remove('active');
            m.style.display = 'none';
        }
    }

    window.addEventListener('click', (e) => {
        const m = document.getElementById('blogModal');
        if (e.target === m || (m && e.target.classList.contains('modal-overlay'))) {
            m.classList.remove('active');
            m.style.display = 'none';
        }
    });
});


// Clear pending booking
window.pendingBooking = null;


// --- REVIEW FORM HANDLER ---
document.addEventListener('DOMContentLoaded', function () {
    const reviewForm = document.getElementById('reviewForm');
    const reviewSuccess = document.getElementById('reviewSuccess');

    if (reviewForm) {
        reviewForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(reviewForm);
            const data = {
                name: formData.get('name'),
                title: formData.get('title'),
                rating: formData.get('rating'),
                review: formData.get('review'),
                product: formData.get('product') || 'Not specified',
                created_at: new Date().toISOString()
            };

            if (!data.name || !data.title || !data.rating || !data.review) {
                alert('Please fill in all required fields.');
                return;
            }

            try {
                if (window.supabaseClient) {
                    const { error } = await window.supabaseClient
                        .from('testimonials')
                        .insert([{
                            name: data.name,
                            title: data.title,
                            rating: parseInt(data.rating),
                            review: data.review,
                            product: data.product,
                            is_verified: false,
                            is_published: false,
                            created_at: data.created_at
                        }]);

                    if (error) {
                        console.error('Error submitting review:', error);
                        alert('There was an error submitting your review. Please try again.');
                        return;
                    }
                } else {
                    console.log('Supabase not available, storing review locally:', data);
                    let reviews = JSON.parse(localStorage.getItem('pendingReviews') || '[]');
                    reviews.push(data);
                    localStorage.setItem('pendingReviews', JSON.stringify(reviews));
                }

                reviewForm.style.display = 'none';
                reviewSuccess.classList.add('show');

            } catch (error) {
                console.error('Review submission error:', error);
                alert('There was an error submitting your review. Please try again.');
            }
        });
    }
});

// Helper to copy product link for social sharing
window.copyProductLink = function (id) {
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    const shareUrl = url.toString();

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('✅ Shareable link copied to clipboard!');
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
            prompt('Copy this link to share:', shareUrl);
        });
    } else {
        prompt('Copy this link to share:', shareUrl);
    }
};
