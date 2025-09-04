import base64
import io
from PIL import Image
from typing import Optional, Dict, Any

def validate_base64_image(base64_string: str) -> bool:
    """
    Validate if a string is a valid base64 encoded image
    """
    try:
        if base64_string.startswith('data:'):
            # Extract base64 part from data URL
            base64_part = base64_string.split(',', 1)[1] if ',' in base64_string else base64_string
        else:
            base64_part = base64_string
            
        # Try to decode and open as image
        image_data = base64.b64decode(base64_part)
        image = Image.open(io.BytesIO(image_data))
        image.verify()  # Verify it's a valid image
        return True
        
    except Exception:
        return False

def get_image_mime_type(base64_string: str) -> str:
    """
    Detect MIME type of base64 encoded image
    """
    try:
        if base64_string.startswith('data:'):
            # Extract MIME type from data URL
            if ';' in base64_string:
                return base64_string.split(';')[0].replace('data:', '')
        
        # Try to detect from image data
        if base64_string.startswith('data:'):
            base64_part = base64_string.split(',', 1)[1] if ',' in base64_string else base64_string
        else:
            base64_part = base64_string
            
        image_data = base64.b64decode(base64_part)
        image = Image.open(io.BytesIO(image_data))
        
        format_mapping = {
            'JPEG': 'image/jpeg',
            'PNG': 'image/png',
            'GIF': 'image/gif',
            'WEBP': 'image/webp'
        }
        
        return format_mapping.get(image.format, 'image/jpeg')
        
    except Exception:
        return 'image/jpeg'  # Default fallback

def ensure_data_url_format(image_data: str) -> str:
    """
    Ensure image data is in proper data URL format
    """
    if image_data.startswith('data:'):
        return image_data
    
    # Detect MIME type and add data URL prefix
    mime_type = get_image_mime_type(image_data)
    return f"data:{mime_type};base64,{image_data}"