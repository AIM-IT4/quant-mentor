# QuantMentor - Expert Quant Mentorship Platform

A comprehensive platform for booking 1-on-1 mentorship sessions and purchasing digital resources (Notes, Guides) for aspiring quantitative finance professionals.

## 🚀 Features

-   **Mentorship Booking System**: Custom 1-on-1 session booking with dynamic time slots (30-min intervals) and conflict detection.
-   **Digital Product Store**: Purchase crash courses, interview guides, and utility tools directly.
-   **Free Resources**: Direct access to free study materials and cheat sheets.
-   **Payment Integration**: Secure payments via **Razorpay**.
-   **Automated Emails**: Instant booking confirmations and product delivery via **Brevo** (formerly Sendinblue).
-   **Admin Panel**:
    -   View upcoming and past bookings.
    -   Approve/Reject rescheduling requests.
    -   Analytics dashboard (Revenue, Total Bookings).
    -   Secure file uploading for digital products.
-   **Dynamic Content**: All products and sessions are managed via **Supabase**.
-   **Professional UI**: Dark-themed, responsive design with glassmorphism effects.

## 🛠️ Tech Stack

-   **Frontend**: HTML5, CSS3 (Custom Variables), JavaScript (Vanilla ES6+).
-   **Backend / Database**: **Supabase** (PostgreSQL) for booking data, product management, and file storage.
-   **Payments**: **Razorpay** Payment Gateway.
-   **Email Service**: **Brevo** (SMTP/API) for transactional emails.
-   **Hosting**: Vercel (Front-end).

## 📂 Project Structure

```
website/
├── index.html        # Main Landing Page (Booking & Products)
├── admin.html        # Admin Dashboard (Protected)
├── my-bookings.html  # Customer Booking Management
├── styles.css        # Global Styles & Design System
├── script.js         # Core Logic (Booking, Payments, Emails)
├── config.js         # Configuration (Supabase Keys - Not tracked)
├── assets/           # Images and static assets
└── README.md         # Project Documentation
```

## ⚙️ Setup & Configuration

### 1. Supabase Setup
This project uses Supabase for database and storage.
1.  Create a project on [Supabase](https://supabase.com).
2.  Run the provided SQL scripts in the SQL Editor to set up tables (`bookings`, `products`, `sessions`).
3.  Add your Supabase URL and Anon Key to `config.js` or environment variables.

### 2. Razorpay Integration
1.  Create an account on [Razorpay](https://razorpay.com).
2.  Generate Test Mode API Keys.
3.  Update the `RAZORPAY_KEY` in `script.js`.

### 3. Email Automation (Brevo)
1.  Sign up on [Brevo](https://brevo.com).
2.  Get your API Key.
3.  Configure the email sending logic in `script.js` (currently using client-side API call or serverless function for security recommended in production).

### 4. Running Locally
Simply open `index.html` in your browser or use a live server extension.

```bash
# Clone the repository
git clone https://github.com/AIM-IT4/quant-mentor.git

# Navigate to directory
cd quant-mentor/website

# Open in browser (e.g., using python simple server)
python -m http.server 8000
```

## 🔐 Admin Access
The `admin.html` page implements a basic client-side passcode check. For production, ensure strictly secure authentication via Supabase Auth is enabled or `admin.html` is protected by edge functions.

---
**QuantMentor** &copy; 2026. All rights reserved.
