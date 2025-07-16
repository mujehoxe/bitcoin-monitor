#!/usr/bin/env python3
"""
Python service for fetching news using the gnews package
This service runs as a separate microservice and provides news via HTTP API
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import sys
import os

try:
    from gnews import GNews
except ImportError:
    print("gnews package not found. Installing...")
    os.system("pip install gnews")
    from gnews import GNews

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GNewsService:
    def __init__(self):
        self.gnews = GNews()
        self.gnews.period = "1d"  # Last 24 hours
        self.gnews.max_results = 20
        self.gnews.language = "en"
        self.gnews.country = "US"

    def search_bitcoin_news(self) -> List[Dict[str, Any]]:
        """Fetch Bitcoin-related news"""
        try:
            news = self.gnews.get_news("bitcoin OR cryptocurrency OR BTC")
            return self._format_news(news, "bitcoin")
        except Exception as e:
            logger.error(f"Error fetching Bitcoin news: {e}")
            return self._get_demo_bitcoin_news()

    def search_crypto_news(self) -> List[Dict[str, Any]]:
        """Fetch general cryptocurrency news"""
        try:
            news = self.gnews.get_news("cryptocurrency")
            return self._format_news(news, "crypto")
        except Exception as e:
            logger.error(f"Error fetching crypto news: {e}")
            return self._get_demo_crypto_news()

    def _format_news(
        self, news_items: List[Dict[str, Any]], category: str
    ) -> List[Dict[str, Any]]:
        """Format gnews results to match our NewsArticle interface"""
        formatted = []

        for item in news_items:
            try:
                # Parse the published date
                pub_date = item.get("published date", "")
                if pub_date:
                    # Convert string date to ISO format
                    try:
                        date_obj = datetime.strptime(
                            pub_date, "%a, %d %b %Y %H:%M:%S %Z"
                        )
                        published_at = date_obj.isoformat()
                    except:
                        published_at = datetime.now().isoformat()
                else:
                    published_at = datetime.now().isoformat()

                formatted.append(
                    {
                        "id": f"gnews-{category}-{hash(item.get('title', ''))}",
                        "title": item.get("title", "No title"),
                        "description": item.get("description", "No description"),
                        "content": item.get("description", "No content"),
                        "publishedAt": published_at,
                        "source": item.get("publisher", {}).get("title", "GNews"),
                        "url": item.get("url", ""),
                        "author": item.get("publisher", {}).get("title", "Unknown"),
                        "urlToImage": item.get("image", ""),
                    }
                )
            except Exception as e:
                logger.error(f"Error formatting news item: {e}")
                continue

        return formatted

    def _get_demo_bitcoin_news(self) -> List[Dict[str, Any]]:
        """Return demo Bitcoin news when API fails"""
        return [
            {
                "id": "gnews-bitcoin-demo-1",
                "title": "Bitcoin Reaches New All-Time High Amid Institutional Adoption",
                "description": "Bitcoin surges past $70,000 as major corporations announce Bitcoin treasury additions.",
                "content": "The cryptocurrency market sees unprecedented institutional interest with multiple Fortune 500 companies adding Bitcoin to their balance sheets.",
                "publishedAt": datetime.now().isoformat(),
                "source": "GNews Bitcoin",
                "url": "https://example.com/bitcoin-news-1",
                "author": "GNews",
                "urlToImage": None,
            },
            {
                "id": "gnews-bitcoin-demo-2",
                "title": "Global Bank Launches Bitcoin Custody Services",
                "description": "Leading international bank introduces comprehensive Bitcoin custody solutions for institutional clients.",
                "content": "The new service provides secure storage and management of Bitcoin assets for large institutional investors.",
                "publishedAt": (datetime.now() - timedelta(hours=2)).isoformat(),
                "source": "GNews Bitcoin",
                "url": "https://example.com/bitcoin-news-2",
                "author": "GNews",
                "urlToImage": None,
            },
        ]

    def _get_demo_crypto_news(self) -> List[Dict[str, Any]]:
        """Return demo crypto news when API fails"""
        return [
            {
                "id": "gnews-crypto-demo-1",
                "title": "Ethereum Layer 2 Solutions See Explosive Growth",
                "description": "Ethereum's Layer 2 scaling solutions are experiencing unprecedented adoption rates.",
                "content": "Recent data shows that Layer 2 solutions are processing more transactions than ever...",
                "publishedAt": datetime.now().isoformat(),
                "source": "GNews Crypto",
                "url": "https://example.com/crypto-news-1",
                "author": "GNews",
                "urlToImage": None,
            }
        ]


class GNewsRequestHandler(BaseHTTPRequestHandler):
    gnews_service = GNewsService()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        query_params = parse_qs(parsed_url.query)

        try:
            if parsed_url.path == "/bitcoin":
                news = self.gnews_service.search_bitcoin_news()
            elif parsed_url.path == "/crypto":
                news = self.gnews_service.search_crypto_news()
            else:
                news = []

            response_data = {
                "articles": news,
                "totalArticles": len(news),
                "source": "gnews-python",
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())

        except Exception as e:
            logger.error(f"Error handling request: {e}")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode())
            query = data.get("query", "bitcoin")

            if "bitcoin" in query.lower():
                news = self.gnews_service.search_bitcoin_news()
            else:
                news = self.gnews_service.search_crypto_news()

            response_data = {
                "articles": news,
                "totalArticles": len(news),
                "source": "gnews-python",
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())

        except Exception as e:
            logger.error(f"Error handling POST request: {e}")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())


def run_server(port=8000):
    """Run the GNews Python service"""
    server = HTTPServer(("localhost", port), GNewsRequestHandler)
    logger.info(f"GNews Python service running on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down GNews Python service")
        server.shutdown()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
