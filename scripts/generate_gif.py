import os
from PIL import Image

def generate_scrolling_gif(image_path, output_path, viewport_height=1080, step=40, delay=50):
    """
    Slices a full-page screenshot into viewport-sized frames and creates a GIF.
    """
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found.")
        return

    full_img = Image.open(image_path)
    width, height = full_img.size
    
    frames = []
    
    # Scroll down
    for top in range(0, height - viewport_height, step):
        bottom = top + viewport_height
        frame = full_img.crop((0, top, width, bottom))
        frames.append(frame)
    
    # Add a final frame at the bottom
    frames.append(full_img.crop((0, height - viewport_height, width, height)))
    
    # Save as GIF
    if frames:
        frames[0].save(
            output_path,
            save_all=True,
            append_images=frames[1:],
            duration=delay,
            loop=0,
            optimize=True
        )
        print(f"GIF saved to {output_path}")

if __name__ == "__main__":
    SCREENSHOT_PATH = r"C:\Users\iitak\.gemini\antigravity\brain\dbe2af27-8fe2-4bae-ac34-34e0ac5bd137\real_full_screenshot.png"
    OUTPUT_PATH = r"C:\Users\iitak\.gemini\antigravity\brain\dbe2af27-8fe2-4bae-ac34-34e0ac5bd137\website_playback.gif"
    
    # Adjust step for speed and delay for frame-rate
    generate_scrolling_gif(SCREENSHOT_PATH, OUTPUT_PATH, viewport_height=900, step=60, delay=60)
