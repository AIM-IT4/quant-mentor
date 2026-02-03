# QuantMentor Website - Deployment Guide

A professional website for quant mentorship services and digital products.
**100% free to host and deploy.**

## Quick Start

### Option 1: Open Locally
Simply double-click `index.html` to preview in your browser.

### Option 2: Deploy to Netlify (FREE)

1. Go to [netlify.com](https://netlify.com) and sign up (free)
2. Drag and drop this entire `website` folder to Netlify
3. Get your live URL instantly: `yourname.netlify.app`

### Option 3: Deploy to Vercel (FREE)

1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Import from your local folder or GitHub
3. Get your live URL: `yourname.vercel.app`

---

## Customization Checklist

### 1. Personal Info (index.html)
- [ ] Update name in profile card (line ~100)
- [ ] Update tagline and bio
- [ ] Add your social media links (LinkedIn, GitHub, Twitter)
- [ ] Update email in contact section
- [ ] Add your profile photo in `assets/images/`

### 2. Pricing (index.html)
- [ ] Update session prices (Quick: ₹499, Deep: ₹999, Interview: ₹1,499)
- [ ] Update product prices

### 3. Testimonials (index.html)
- [ ] Replace placeholder testimonials with real ones
- [ ] Update names and roles

---

## Payment Integration (Razorpay - FREE)

1. Sign up at [razorpay.com](https://razorpay.com) (no monthly fees)
2. Create Payment Links for each product
3. Replace the alert() in `script.js` with your payment links

### Example:
```javascript
// In script.js, update modalPayBtn.onclick:
modalPayBtn.href = 'https://rzp.io/l/your-payment-link';
```

---

## Booking Integration (Cal.com - FREE)

1. Sign up at [cal.com](https://cal.com) (free tier)
2. Set your availability
3. Add embed code to your contact section:
```html
<script src="https://cal.com/embed.js"></script>
```

---

## Form Handling (FREE Options)

### Formspree (Recommended)
1. Go to [formspree.io](https://formspree.io) (50 submissions/month free)
2. Create a form, get your endpoint
3. Update form action:
```html
<form action="https://formspree.io/f/YOUR_ID" method="POST">
```

### Netlify Forms
Add `netlify` attribute to your form tag - forms are handled automatically!

---

## File Structure

```
website/
├── index.html      ← Main page (edit your content here)
├── styles.css      ← Styling (change colors/fonts)
├── script.js       ← Interactivity (payment links)
├── assets/
│   └── images/     ← Add your profile photo here
└── README.md       ← This file
```

---

## Free Domain Options

- `yourname.netlify.app` (free with Netlify)
- `yourname.vercel.app` (free with Vercel)
- [freenom.com](https://freenom.com) for free .tk, .ml domains
- Or purchase a `.com` (~₹700/year)

---

## Need Help?

Contact the developer or refer to:
- Netlify Docs: [docs.netlify.com](https://docs.netlify.com)
- Razorpay Docs: [razorpay.com/docs](https://razorpay.com/docs)
- Cal.com Docs: [cal.com/docs](https://cal.com/docs)
