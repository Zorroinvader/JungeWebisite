#!/usr/bin/env python3
"""
Website Image Crawler
A respectful web crawler that downloads all images from a given website
while following robots.txt rules and implementing rate limiting.
"""

import requests
import os
import time
import urllib.parse
import urllib.robotparser
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import argparse
import logging
from pathlib import Path
import mimetypes
from typing import Set, List, Optional
import hashlib

class WebsiteImageCrawler:
    def __init__(self, base_url: str, download_dir: str = "downloaded_images", 
                 delay: float = 1.0, max_pages: int = 100):
        """
        Initialize the crawler
        
        Args:
            base_url: The base URL to start crawling from
            download_dir: Directory to save downloaded images
            delay: Delay between requests in seconds
            max_pages: Maximum number of pages to crawl
        """
        self.base_url = base_url.rstrip('/')
        self.domain = urlparse(base_url).netloc
        self.download_dir = Path(download_dir)
        self.delay = delay
        self.max_pages = max_pages
        
        # Create download directory
        self.download_dir.mkdir(exist_ok=True)
        
        # Track visited URLs and downloaded images
        self.visited_urls: Set[str] = set()
        self.downloaded_images: Set[str] = set()
        self.pages_to_visit: List[str] = [base_url]
        
        # Setup logging
        self.setup_logging()
        
        # Setup session with headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Initialize robots.txt parser
        self.robot_parser = urllib.robotparser.RobotFileParser()
        self.load_robots_txt()
        
        # Supported image extensions
        self.image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'}
        
        self.logger.info(f"Initialized crawler for {base_url}")
        self.logger.info(f"Download directory: {self.download_dir.absolute()}")
        self.logger.info(f"Delay between requests: {delay}s")

    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('crawler.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def load_robots_txt(self):
        """Load and parse robots.txt"""
        try:
            robots_url = urljoin(self.base_url, '/robots.txt')
            self.robot_parser.set_url(robots_url)
            self.robot_parser.read()
            self.logger.info(f"Loaded robots.txt from {robots_url}")
        except Exception as e:
            self.logger.warning(f"Could not load robots.txt: {e}")

    def is_allowed(self, url: str) -> bool:
        """Check if URL is allowed by robots.txt"""
        try:
            return self.robot_parser.can_fetch(self.session.headers['User-Agent'], url)
        except Exception:
            # If robots.txt check fails, assume it's allowed
            return True

    def is_same_domain(self, url: str) -> bool:
        """Check if URL belongs to the same domain"""
        return urlparse(url).netloc == self.domain

    def is_image_url(self, url: str) -> bool:
        """Check if URL points to an image"""
        parsed = urlparse(url)
        path = parsed.path.lower()
        
        # Check file extension
        for ext in self.image_extensions:
            if path.endswith(ext):
                return True
        
        # Check content-type in URL parameters
        if 'image' in url.lower():
            return True
            
        return False

    def get_image_filename(self, url: str, content_type: str = None) -> str:
        """Generate a safe filename for the image"""
        parsed = urlparse(url)
        path = parsed.path
        
        # Extract filename from URL
        filename = os.path.basename(path)
        
        # If no filename or extension, try to determine from content-type
        if not filename or not any(filename.lower().endswith(ext) for ext in self.image_extensions):
            if content_type and content_type.startswith('image/'):
                ext = mimetypes.guess_extension(content_type)
                if ext:
                    # Create filename based on URL hash
                    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
                    filename = f"image_{url_hash}{ext}"
            else:
                # Default extension
                filename = f"image_{hashlib.md5(url.encode()).hexdigest()[:8]}.jpg"
        
        # Sanitize filename
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        return filename

    def download_image(self, img_url: str) -> bool:
        """Download a single image"""
        try:
            # Skip if already downloaded
            if img_url in self.downloaded_images:
                return True
                
            # Check if allowed by robots.txt
            if not self.is_allowed(img_url):
                self.logger.info(f"Skipping {img_url} - blocked by robots.txt")
                return False
            
            # Make request
            response = self.session.get(img_url, timeout=10, stream=True)
            response.raise_for_status()
            
            # Check if it's actually an image
            content_type = response.headers.get('content-type', '').lower()
            if not content_type.startswith('image/'):
                self.logger.info(f"Skipping {img_url} - not an image (content-type: {content_type})")
                return False
            
            # Generate filename
            filename = self.get_image_filename(img_url, content_type)
            filepath = self.download_dir / filename
            
            # Handle duplicate filenames
            counter = 1
            original_filepath = filepath
            while filepath.exists():
                stem = original_filepath.stem
                suffix = original_filepath.suffix
                filepath = self.download_dir / f"{stem}_{counter}{suffix}"
                counter += 1
            
            # Download and save image
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            self.downloaded_images.add(img_url)
            self.logger.info(f"Downloaded: {filename} ({len(response.content)} bytes)")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to download {img_url}: {e}")
            return False

    def extract_images_from_page(self, url: str) -> List[str]:
        """Extract all image URLs from a webpage"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            images = []
            
            # Find all img tags
            for img in soup.find_all('img'):
                src = img.get('src')
                if src:
                    # Convert relative URLs to absolute
                    absolute_url = urljoin(url, src)
                    images.append(absolute_url)
                
                # Also check data-src and other common lazy loading attributes
                for attr in ['data-src', 'data-lazy', 'data-original']:
                    lazy_src = img.get(attr)
                    if lazy_src:
                        absolute_url = urljoin(url, lazy_src)
                        images.append(absolute_url)
            
            # Find images in CSS background-image properties
            for element in soup.find_all(style=True):
                style = element.get('style', '')
                bg_matches = re.findall(r'background-image:\s*url\(["\']?([^"\')\s]+)["\']?\)', style)
                for match in bg_matches:
                    absolute_url = urljoin(url, match)
                    images.append(absolute_url)
            
            # Find images in CSS files (basic approach)
            for link in soup.find_all('link', rel='stylesheet'):
                css_url = link.get('href')
                if css_url:
                    try:
                        css_url = urljoin(url, css_url)
                        css_response = self.session.get(css_url, timeout=10)
                        css_content = css_response.text
                        
                        # Extract URLs from CSS
                        url_matches = re.findall(r'url\(["\']?([^"\')\s]+)["\']?\)', css_content)
                        for match in url_matches:
                            absolute_url = urljoin(css_url, match)
                            if self.is_image_url(absolute_url):
                                images.append(absolute_url)
                    except Exception as e:
                        self.logger.warning(f"Could not fetch CSS file {css_url}: {e}")
            
            return images
            
        except Exception as e:
            self.logger.error(f"Failed to extract images from {url}: {e}")
            return []

    def extract_links_from_page(self, url: str) -> List[str]:
        """Extract all links from a webpage for further crawling"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            links = []
            
            for link in soup.find_all('a', href=True):
                href = link.get('href')
                absolute_url = urljoin(url, href)
                
                # Only follow same-domain links
                if self.is_same_domain(absolute_url) and absolute_url not in self.visited_urls:
                    links.append(absolute_url)
            
            return links
            
        except Exception as e:
            self.logger.error(f"Failed to extract links from {url}: {e}")
            return []

    def crawl(self):
        """Main crawling function"""
        self.logger.info("Starting website crawl...")
        
        pages_crawled = 0
        
        while self.pages_to_visit and pages_crawled < self.max_pages:
            current_url = self.pages_to_visit.pop(0)
            
            # Skip if already visited
            if current_url in self.visited_urls:
                continue
            
            # Check if allowed by robots.txt
            if not self.is_allowed(current_url):
                self.logger.info(f"Skipping {current_url} - blocked by robots.txt")
                continue
            
            self.logger.info(f"Crawling page {pages_crawled + 1}/{self.max_pages}: {current_url}")
            
            try:
                # Extract and download images
                image_urls = self.extract_images_from_page(current_url)
                images_downloaded = 0
                
                for img_url in image_urls:
                    if self.download_image(img_url):
                        images_downloaded += 1
                
                self.logger.info(f"Downloaded {images_downloaded} images from {current_url}")
                
                # Extract links for further crawling
                if pages_crawled < self.max_pages - 1:  # Don't extract links from the last page
                    new_links = self.extract_links_from_page(current_url)
                    # Add new links to the queue (limit to prevent memory issues)
                    self.pages_to_visit.extend(new_links[:10])
                
                self.visited_urls.add(current_url)
                pages_crawled += 1
                
                # Rate limiting
                time.sleep(self.delay)
                
            except Exception as e:
                self.logger.error(f"Error crawling {current_url}: {e}")
                continue
        
        self.logger.info(f"Crawling completed!")
        self.logger.info(f"Pages crawled: {pages_crawled}")
        self.logger.info(f"Images downloaded: {len(self.downloaded_images)}")
        self.logger.info(f"Download directory: {self.download_dir.absolute()}")

def main():
    """Main function with command line argument parsing"""
    parser = argparse.ArgumentParser(description='Website Image Crawler')
    parser.add_argument('url', help='Base URL to start crawling from')
    parser.add_argument('-d', '--download-dir', default='downloaded_images',
                       help='Directory to save downloaded images (default: downloaded_images)')
    parser.add_argument('--delay', type=float, default=1.0,
                       help='Delay between requests in seconds (default: 1.0)')
    parser.add_argument('--max-pages', type=int, default=100,
                       help='Maximum number of pages to crawl (default: 100)')
    
    args = parser.parse_args()
    
    # Validate URL
    if not args.url.startswith(('http://', 'https://')):
        args.url = 'https://' + args.url
    
    # Create and run crawler
    crawler = WebsiteImageCrawler(
        base_url=args.url,
        download_dir=args.download_dir,
        delay=args.delay,
        max_pages=args.max_pages
    )
    
    try:
        crawler.crawl()
    except KeyboardInterrupt:
        print("\nCrawling interrupted by user.")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
