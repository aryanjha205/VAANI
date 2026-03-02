from PIL import Image, ImageDraw, ImageFont
import os

def create_icons():
    dir_path = 'static/img'
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
    
    # 512x512
    primary_color = (139, 92, 246) # Premium Violet
    img512 = Image.new('RGBA', (512, 512), color=(0, 0, 0, 0))
    draw = ImageDraw.Draw(img512)
    
    # Outer circle for premium feel
    draw.ellipse([20, 20, 492, 492], fill=primary_color)
    
    # Simple chat bubble shape inside
    draw.ellipse([120, 150, 392, 380], fill=(255, 255, 255))
    draw.polygon([(160, 340), (120, 420), (220, 340)], fill=(255, 255, 255))
    
    img512 = img512.convert('RGB')
    img512.save(os.path.join(dir_path, 'icon-512.png'))
    
    # 192x192
    img192 = img512.resize((192, 192))
    img192.save(os.path.join(dir_path, 'icon-192.png'))
    
    print("Icons generated successfully!")

if __name__ == "__main__":
    create_icons()
