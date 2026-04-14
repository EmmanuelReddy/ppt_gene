"""
Pexels API — stock photos for slide backgrounds.
Docs: https://www.pexels.com/api/documentation/
Auth: Authorization header with PEXELS_API_KEY from the environment.
"""

from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional

PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"


def sanitize_search_query(text: str, max_words: int = 8) -> str:
    if not text or not text.strip():
        return "abstract business technology"
    cleaned = re.sub(r"[^\w\s\-]", " ", text, flags=re.UNICODE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip().lower()
    words = cleaned.split()[:max_words]
    if not words:
        return "abstract business technology"
    return " ".join(words)


def search_photo(
    query: str,
    api_key: str,
    slide_index: int = 0,
    orientation: str = "landscape",
    size: str = "large",
    per_page: int = 15,
) -> Optional[Dict[str, Any]]:
    """
    Returns dict with keys: image_url, photo_page_url, photographer, photographer_url
    or None on failure / empty results.
    Uses landscape src when available (good for 16:9 slides).
    """
    if not api_key or not query.strip():
        return None

    q = sanitize_search_query(query)
    page = (slide_index % 3) + 1
    params = {
        "query": q,
        "per_page": str(min(max(per_page, 1), 80)),
        "page": str(page),
        "orientation": orientation,
        "size": size,
    }
    url = f"{PEXELS_SEARCH_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": api_key, "User-Agent": "ppt_gene/1.0"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8")
        data = json.loads(raw)
    except urllib.error.HTTPError as e:
        print(f"[PEXELS] HTTP {e.code}: {e.reason} for query={q!r}")
        return None
    except json.JSONDecodeError as e:
        print(f"[PEXELS] bad JSON: {e}")
        return None
    except Exception as e:
        print(f"[PEXELS] request failed: {e}")
        return None

    photos = data.get("photos") or []
    if not photos:
        return None

    pick = photos[slide_index % len(photos)]
    src = pick.get("src") or {}
    image_url = (
        src.get("landscape")
        or src.get("large2x")
        or src.get("large")
        or src.get("medium")
    )
    if not image_url:
        return None

    return {
        "image_url": image_url,
        "photo_page_url": pick.get("url") or "",
        "photographer": pick.get("photographer") or "",
        "photographer_url": pick.get("photographer_url") or "",
    }


def fetch_background_for_slide(
    search_query: str,
    api_key: str,
    slide_index: int = 0,
) -> Optional[Dict[str, Any]]:
    """Small gap between calls to stay polite under rate limits."""
    if slide_index > 0:
        time.sleep(0.08)
    return search_photo(search_query, api_key, slide_index=slide_index)
