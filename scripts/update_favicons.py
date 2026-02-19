import os
import re

root_dir = r"C:\Users\iitak\.gemini\antigravity\scratch\quant_notes\website"
new_logo_path = "assets/images/quantmentor-logo-icon-QM-1024.png"

# Regex for href with logo.png (favicon)
# Matches href="anything/logo.png"
regex = r'href="[^"]*logo\.png"'
replacement = f'href="{new_logo_path}"'

count = 0
for filename in os.listdir(root_dir):
    if filename.endswith(".html"):
        filepath = os.path.join(root_dir, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = re.sub(regex, replacement, content)
            
            if new_content != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated favicon in {filename}")
                count += 1
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print(f"Total files updated: {count}")
