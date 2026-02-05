# Security Guide: API Key Protection

## ⚠️ URGENT: Exposed API Keys Detected

Your repository currently contains exposed API keys that pose a **critical security risk**. This guide will help you secure them immediately.

## Currently Exposed Keys

The following sensitive credentials are hardcoded in your source files and visible on GitHub:

### 1. Supabase Service Role Key (CRITICAL - HIGH RISK)
- **Location**: `admin.html:615`
- **Risk**: Full database access, can read/modify/delete ALL data
- **Impact**: Attackers can access all user data, bookings, products

### 2. Supabase Anon Key (MEDIUM RISK)
- **Location**: `script.js:17`
- **Risk**: Public access to database (limited by RLS policies)

### 3. EmailJS Credentials (MEDIUM RISK)
- **Location**: `script.js:362-364` and `admin.html:25-28`
- **Risk**: Email spoofing, potential email abuse

### 4. Formspree ID (LOW RISK)
- **Location**: `script.js:1012`
- **Risk**: Form spam

### 5. Admin Password (HIGH RISK)
- **Location**: `admin.html:622`
- **Current Value**: `admin123` (very weak!)
- **Risk**: Unauthorized admin access

## Immediate Actions Required (Do These NOW!)

### Step 1: Rotate ALL API Keys (Within 24 hours)

1. **Supabase Service Role Key**:
   - Go to Supabase Dashboard → Project Settings → API
   - Click "Reveal" next to service_role key
   - Copy the new key
   - **Immediately** change the key in `admin.html` line 615
   - ⚠️ The old key should be considered compromised

2. **Supabase Anon Key**:
   - Same location as above
   - This key has less risk but should still be rotated

3. **EmailJS**:
   - Go to EmailJS Dashboard → Account → Security
   - Generate new User ID and update templates

4. **Change Admin Password**:
   - Edit `admin.html` line 622
   - Change from `admin123` to a strong password (16+ characters)

### Step 2: Clean Git History (Critical!)

Even after changing keys, they remain in Git history. You must scrub them:

```bash
# Install git-filter-repo (if not already installed)
pip install git-filter-repo

# Remove sensitive files from history
git filter-repo --path script.js --path admin.html --invert-paths

# Or use BFG Repo-Cleaner (easier for beginners)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt

# Force push (DESTRUCTIVE - backup first!)
git push origin --force --all
```

**Alternative**: If scrubbing is too complex, delete the repository and recreate it after fixing the keys.

## Long-term Solution: Proper Key Management

Since this is a static HTML site, you have limited options for hiding API keys. Here are your best approaches:

### Option 1: Backend Proxy (Recommended)

Create a simple backend (Node.js/Express, Python/Flask, or serverless functions) that:
- Stores API keys server-side
- Proxies requests from frontend to Supabase/EmailJS
- Validates requests before forwarding

**Pros**: Keys are completely hidden from frontend  
**Cons**: Requires hosting a backend

### Option 2: Netlify/Vercel Environment Variables

If deploying to Netlify or Vercel:

1. Set environment variables in dashboard
2. Use build scripts to inject them at build time
3. Or use Netlify Functions/Vercel Serverless Functions

**Example with Netlify Functions**:
```javascript
// netlify/functions/supabase-proxy.js
exports.handler = async (event) => {
  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  // Proxy request to Supabase
};
```

### Option 3: Restrict Supabase RLS Policies

Since keys will always be visible in frontend JavaScript, strengthen Row Level Security:

```sql
-- Example: Only allow users to see their own bookings
CREATE POLICY "Users can only view their own bookings"
  ON bookings FOR SELECT
  USING (email = current_setting('request.jwt.claims')::json->>'email');
```

## Best Practices Going Forward

1. **Never commit `.env` files** (already added to `.gitignore`)
2. **Use `.env.example`** for documentation (already created)
3. **Regular key rotation** (every 90 days)
4. **Monitor Supabase logs** for suspicious activity
5. **Enable Supabase MFA** for dashboard access
6. **Use IP restrictions** in Supabase if possible

## Quick Reference: What to Change

### In `script.js`:
```javascript
// Lines 16-18 - Supabase config
const SUPABASE_URL = 'YOUR_URL_HERE';
const SUPABASE_KEY = 'YOUR_ANON_KEY_HERE';

// Lines 362-364 - EmailJS config
const EMAILJS_USER_ID = 'YOUR_USER_ID';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

// Line 1012 - Formspree
const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';
```

### In `admin.html`:
```javascript
// Line 615 - Service Role Key (CRITICAL!)
const SUPABASE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';

// Line 622 - Admin password
if (pwd === 'YOUR_STRONG_PASSWORD_HERE') {
```

## Need Help?

If you're unsure how to:
- Rotate Supabase keys: https://supabase.com/docs/guides/api#api-keys
- Clean Git history: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
- Set up a backend proxy: Consider hiring a developer or using a managed service

## Security Checklist

- [ ] Rotated Supabase Service Role Key
- [ ] Rotated Supabase Anon Key
- [ ] Rotated EmailJS credentials
- [ ] Changed admin password to strong unique password
- [ ] Scrubbed keys from Git history OR recreated repository
- [ ] Added `.env` to `.gitignore`
- [ ] Tested site still works with new keys
- [ ] Enabled MFA on Supabase dashboard
- [ ] Reviewed Supabase RLS policies
- [ ] Set up monitoring/alerts for suspicious activity

**Remember**: Security is an ongoing process, not a one-time fix!
