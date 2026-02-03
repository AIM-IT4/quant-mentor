# How to Add Your Logo

## Step 1: Save Your Logo
Save the QuantMentor logo image you uploaded as:
**`assets/images/logo.png`**

## Step 2: Verify It Works
After deployment, your logo will automatically appear as:
1. **Favicon** - In the browser tab
2. **Navbar** - In the top navigation (40x40px)
3. **Footer** - In the footer (32x32px)
4. **Social Sharing** - When sharing on LinkedIn/Twitter
5. **Apple Touch Icon** - When adding to iPhone home screen

## Step 3: Upload to Repository
```bash
# Add the logo file to your repo
git add assets/images/logo.png
git commit -m "Add QuantMentor logo"
git push origin main
```

## Logo Specifications
- **Format**: PNG (with or without transparency)
- **Recommended Size**: 512x512px or larger
- **Aspect Ratio**: Square (1:1)
- **Background**: Transparent preferred, or match website dark theme

## Fallback
If the logo doesn't load, the website automatically shows:
- **Navbar**: 📊 emoji icon
- **Footer**: 📊 emoji icon

This ensures the website always looks professional even if the logo image fails to load.

## Preview
Once added, visit:
- Main site: `your-domain.vercel.app`
- See logo in browser tab, navbar, and footer
- Share on social media to see preview with logo
