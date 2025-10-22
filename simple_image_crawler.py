#!/usr/bin/env python3
"""
Simple Image Crawler using only built-in Python modules
Downloads images from a specific website
"""

import urllib.request
import urllib.parse
import urllib.error
import os
import re
import json
from pathlib import Path

def download_image(url, filename, download_dir):
    """Download a single image"""
    try:
        filepath = download_dir / filename
        
        # Handle duplicate filenames
        counter = 1
        original_filepath = filepath
        while filepath.exists():
            stem = original_filepath.stem
            suffix = original_filepath.suffix
            filepath = download_dir / f"{stem}_{counter}{suffix}"
            counter += 1
        
        urllib.request.urlretrieve(url, filepath)
        print(f"Downloaded: {filepath.name}")
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

def extract_images_from_html(html_content, base_url):
    """Extract image URLs from HTML content"""
    images = []
    
    # Find img tags
    img_pattern = r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>'
    matches = re.findall(img_pattern, html_content, re.IGNORECASE)
    
    for match in matches:
        # Convert relative URLs to absolute
        if match.startswith('//'):
            full_url = 'https:' + match
        elif match.startswith('/'):
            full_url = base_url + match
        elif match.startswith('http'):
            full_url = match
        else:
            full_url = base_url + '/' + match
        
        images.append(full_url)
    
    return images

def crawl_wix_site():
    """Crawl the specific Wix site for images"""
    base_url = "https://jungegesellschaft.wixsite.com/junge-gesellschaft-p/blank-3"
    download_dir = Path("gallery_images")
    download_dir.mkdir(exist_ok=True)
    
    print(f"Crawling: {base_url}")
    print(f"Download directory: {download_dir.absolute()}")
    
    try:
        # Create request with proper headers
        req = urllib.request.Request(
            base_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        
        # Fetch the page
        with urllib.request.urlopen(req) as response:
            html_content = response.read().decode('utf-8')
        
        # Extract image URLs
        image_urls = extract_images_from_html(html_content, base_url)
        
        print(f"Found {len(image_urls)} image URLs")
        
        # Download images
        downloaded_count = 0
        for i, img_url in enumerate(image_urls):
            print(f"Processing {i+1}/{len(image_urls)}: {img_url}")
            
            # Generate filename
            parsed = urllib.parse.urlparse(img_url)
            filename = os.path.basename(parsed.path)
            
            if not filename or '.' not in filename:
                filename = f"image_{i+1}.jpg"
            
            # Download the image
            if download_image(img_url, filename, download_dir):
                downloaded_count += 1
        
        print(f"\nDownload completed!")
        print(f"Successfully downloaded {downloaded_count} images")
        print(f"Images saved to: {download_dir.absolute()}")
        
    except Exception as e:
        print(f"Error crawling site: {e}")

if __name__ == "__main__":
    crawl_wix_site()
