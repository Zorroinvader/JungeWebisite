#!/usr/bin/env python3
"""
Example usage of the Website Image Crawler
"""

from website_crawler import WebsiteImageCrawler

def main():
    """Example usage of the crawler"""
    
    # Example 1: Basic usage
    print("Example 1: Basic crawling")
    crawler = WebsiteImageCrawler(
        base_url="https://example.com",
        download_dir="example_images",
        delay=1.0,
        max_pages=10
    )
    
    # Uncomment to run:
    # crawler.crawl()
    
    print("\nExample 2: Custom settings")
    crawler2 = WebsiteImageCrawler(
        base_url="https://picsum.photos",  # Lorem Ipsum photo site
        download_dir="picsum_images",
        delay=2.0,  # 2 second delay between requests
        max_pages=5  # Only crawl 5 pages
    )
    
    # Uncomment to run:
    # crawler2.crawl()
    
    print("Examples created. Uncomment the crawler.crawl() lines to run them.")
    print("\nCommand line usage:")
    print("python website_crawler.py https://example.com")
    print("python website_crawler.py https://example.com -d my_images --delay 2.0 --max-pages 50")

if __name__ == "__main__":
    main()
