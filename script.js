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
        } else {
            console.error('❌ Supabase SDK not loaded');
            console.log('⚠️ Continuing without Supabase - using default links');
        }
    } catch (e) {
        console.error('Supabase initialization failed:', e);
        console.log('⚠️ Continuing without Supabase - using default links');
    }
}, 500);

// Load and display products from Supabase
async function loadProductsFromSupabase() {
    try {
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }

        const { data, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading products from Supabase:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('📦 Loading ' + data.length + ' products from Supabase:');
            displaySupabaseProducts(data);
        }
    } catch (err) {
        console.error('Failed to load products:', err);
    }
}

// Display products from Supabase in the products grid
function displaySupabaseProducts(products) {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    // Clear existing products (keep only hardcoded ones we want to keep)
    const existingCards = productsGrid.querySelectorAll('.product-card');
    const hardcodedProducts = []; // No hardcoded products to keep

    existingCards.forEach(card => {
        const productName = card.querySelector('.btn-product')?.dataset.product;
        if (!hardcodedProducts.includes(productName)) {
            card.remove();
        }
    });

    // Add products from Supabase
    products.forEach(product => {
        console.log(`📦 Adding product: ${product.name} - ₹${product.price}`);

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.category = 'notes'; // You can adjust this based on product type

        const discountPercent = product.discount_percentage || 0;

        productCard.innerHTML = `
            <div class="product-image">
                <div class="product-placeholder" style="background: linear-gradient(135deg, #6366f1, #a855f7);">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="product-badge">PDF</div>
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description || 'Premium digital product for quant professionals.'}</p>
                ${product.coupon_code && discountPercent > 0 ? `<div class="product-coupon" style="font-size: .8rem; color: #22c55e;">Coupon ${product.coupon_code}: ${discountPercent}% off</div>` : ''}
                <div class="product-meta">
                    <span><i class="fas fa-file-pdf"></i> ${product.file_url.includes('.pdf') ? 'PDF Document' : 'Digital File'}</span>
                    <span><i class="fas fa-check"></i> Instant Download</span>
                </div>
                <div class="product-footer">
                    <div class="product-price">₹${product.price}</div>
                    <button class="btn btn-product" data-product="${product.name}" data-price="${product.price}" data-coupon-code="${product.coupon_code || ''}" data-coupon-percent="${discountPercent}">
                        Buy Now
                    </button>
                </div>
            </div>
        `;

        productsGrid.appendChild(productCard);

        // Add event listener for the new button
        const buyButton = productCard.querySelector('.btn-product');
        if (buyButton) {
            buyButton.addEventListener('click', function () {
                console.log('🖱️ Supabase product button clicked:', this.dataset.product);
                const productName = this.dataset.product;
                const price = this.dataset.price;
                const couponCode = this.dataset.couponCode || '';
                const couponPercent = parseInt(this.dataset.couponPercent) || 0;

                const modal = document.getElementById('productModal');
                const modalTitle = document.getElementById('modalTitle');
                const modalDescription = document.getElementById('modalDescription');
                const modalPrice = document.getElementById('modalPrice');

                if (!modal) {
                    console.error('❌ Modal not found in DOM');
                    alert('Error: Product modal not found. Please refresh the page.');
                    return;
                }

                modalTitle.textContent = productName;
                modalDescription.textContent = product.description || 'Premium digital product for quant professionals.';
                modalPrice.textContent = '₹' + price;

                // Set the active coupon for this product
                window.currentDiscountedPrice = undefined;
                window.activeModalCoupon = {
                    code: couponCode,
                    percent: couponPercent
                };

                // Clear coupon input
                const couponInput = document.getElementById('couponInput');
                if (couponInput) couponInput.value = '';

                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                console.log('✅ Modal opened for Supabase product:', productName, 'Coupon:', window.activeModalCoupon);
            });
        }
    });
}

// Load Sessions from Supabase and Update Services Section
async function loadSessionsFromSupabase() {
    try {
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }

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
            updateServicesSection(data);
            updateBookingForm(data);
        }
    } catch (err) {
        console.error('Failed to load sessions:', err);
    }
}

// Update Services Section with Dynamic Sessions
function updateServicesSection(sessions) {
    const servicesContainer = document.querySelector('.services-grid');
    if (!servicesContainer) {
        console.error('Services container not found');
        return;
    }

    // Clear existing services (except hardcoded structure, we'll replace content)
    servicesContainer.innerHTML = '';

    sessions.forEach((session, index) => {
        const serviceCard = document.createElement('div');
        serviceCard.className = session.is_popular ? 'service-card popular' : 'service-card';

        // Generate features HTML
        const featuresHtml = session.features ? session.features.map(feature =>
            `<li><i class="fas fa-check" style="color: #22c55e; margin-right: 8px;"></i>${feature}</li>`
        ).join('') : '';

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
                    ${session.price === 0 ? '<span class="price-free">FREE</span>' : `₹${session.price}`}
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
    });

    console.log('✅ Services section updated with ' + sessions.length + ' sessions');
}

// Update Booking Form with Dynamic Sessions
function updateBookingForm(sessions) {
    const bookingSelect = document.getElementById('bookingService');
    if (!bookingSelect) {
        console.error('Booking select not found');
        return;
    }

    // Clear existing options (keep placeholder)
    const placeholder = bookingSelect.options[0];
    bookingSelect.innerHTML = '';
    bookingSelect.appendChild(placeholder);

    sessions.forEach(session => {
        const option = document.createElement('option');
        const valueType = session.name.toLowerCase().replace(/\s+/g, '_');
        option.value = `${valueType}|${session.price}|${session.duration}`;
        option.innerHTML = session.price === 0
            ? `🆓 ${session.name} (${session.duration} min) - FREE`
            : `${session.name} (${session.duration} min) - ₹${session.price}`;
        option.style.color = session.price === 0 ? '#22c55e' : '';

        bookingSelect.appendChild(option);
    });

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
                console.log(`🔗 Link updated for: ${product.name}`);
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
                <td style="padding:8px 6px;">${p.id ?? ''}</td>
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
        script.onload = function () {
            alert('✅ Payment system loaded!\nPlease click "Buy Now" again.');
        };
        script.onerror = function () {
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

        // Use discounted price if coupon applied
        let price = parseInt(priceText.replace(/[^\d]/g, ''));
        if (typeof window.currentDiscountedPrice !== 'undefined' && window.currentDiscountedPrice != null) {
            price = window.currentDiscountedPrice;
        }
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
        console.log('Debug: serviceValue =', serviceValue, 'sessionType =', sessionType);

        // Try to find session info from multiple sources
        let sessionInfo = SESSION_TYPES[sessionType];

        // If not found in hardcoded types, try to find by matching session name in dynamic sessions
        if (!sessionInfo && window.dynamicSessions) {
            sessionInfo = window.dynamicSessions.find(s =>
                s.name.toLowerCase().replace(/\s+/g, '_') === sessionType ||
                s.name.toLowerCase() === sessionType.replace(/_/g, ' ')
            );
        }

        // If still not found, create session info from the dropdown text
        if (!sessionInfo) {
            const selectedOption = bookingService.options[bookingService.selectedIndex];
            if (selectedOption && selectedOption.text) {
                // Extract session name from option text (format: "🆓 Session Name (duration min) - Price")
                const match = selectedOption.text.match(/[🆓\s]*([^\(]+)/);
                const sessionName = match ? match[1].trim() : 'Session';
                sessionInfo = {
                    name: sessionName,
                    price: parseInt(price) || 0,
                    duration: parseInt(duration) || 60
                };
            }
        }

        // Check if session info was found
        if (!sessionInfo) {
            alert('Error: Invalid session type. Please refresh and try again.');
            console.error('Session type not found:', sessionType, 'Available:', Object.keys(SESSION_TYPES), 'Service value:', serviceValue);
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

🔄 NEED TO RESCHEDULE?
Visit: ${window.location.origin}/my-bookings.html
Enter your email (${booking.email}) to view and reschedule your session.

Or reply to this email with your request.

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

🔄 Need to Reschedule?
Visit: ${window.location.origin}/my-bookings.html
Enter your email to view and reschedule your session.

Thank you for booking!`);

    // Reset form
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingPrice').style.display = 'none';

    // Clear pending booking
    window.pendingBooking = null;
}
