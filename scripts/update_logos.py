import os
import re

# List of files to update (excluding index.html and admin.html for now)
files_to_update = [
    'blog.html',
    'code-playground.html',
    'faq.html',
    'interview.html',
    'my-bookings.html',
    'privacy.html',
    'product.html',
    'refund.html',
    'resources.html',
    'terms.html',
    'testimonials.html'
]

base_dir = r"C:\Users\iitak\.gemini\antigravity\scratch\quant_notes\website"

# Regex pattern to find the logo link
# Matches <a href="index.html" class="logo">QuantMentor</a> with flexibility
pattern = re.compile(r'<a\s+href="index\.html"\s+class="logo"[^>]*>\s*QuantMentor\s*</a>', re.IGNORECASE)

# Replacement HTML
replacement = '''<a href="index.html" class="logo" style="text-decoration: none; display: flex; align-items: center; gap: 10px;">
                <img src="assets/images/quantmentor-logo-icon-QM-1024.png" alt="QuantMentor Logo" style="height: 32px; width: auto;">
                <span style="font-weight: 700; font-size: 1.2rem; background: linear-gradient(135deg, white 0%, #a5b4fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">QuantMentor</span>
            </a>'''

for filename in files_to_update:
    filepath = os.path.join(base_dir, filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename}: Not found")
        continue
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file has the pattern
        if pattern.search(content):
            new_content = pattern.sub(replacement, content)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename}")
        else:
            print(f"No match in {filename}")
            
    except Exception as e:
        print(f"Error updating {filename}: {e}")
