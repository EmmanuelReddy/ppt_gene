"""
API Ninjas Emoji API — https://api.api-ninjas.com/v1/emoji
Auth: header X-Api-Key

Env (either name works):
  API_NINJAS_KEY   — primary
  EMOJI_API_KEY    — alias
"""

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import List, Optional

EMOJI_API_BASE = "https://api.api-ninjas.com/v1/emoji"

# When name search is weak, rotate these (max ~30 results per call; offset supported)
NAME_FALLBACKS: List[str] = [
    "rocket",
    "chart",
    "lightning",
    "gem",
    "fire",
    "star",
    "target",
    "briefcase",
    "rocket",
    "trophy",
]

UNICODE_FALLBACK = ["🚀", "📊", "💡", "🎯", "⚡", "🌐", "💎", "🔥", "📈", "🧭"]


def _api_key() -> Optional[str]:
    return (os.environ.get("API_NINJAS_KEY") or os.environ.get("EMOJI_API_KEY") or "").strip() or None


def _first_word_from_title(title: str) -> Optional[str]:
    if not title:
        return None
    words = re.findall(r"[A-Za-z]{3,}", title)
    return words[0].lower() if words else None


def fetch_emoji_by_name(name: str, offset: int = 0) -> Optional[dict]:
    """Returns first matching emoji object from API or None."""
    key = _api_key()
    if not key:
        return None
    params = urllib.parse.urlencode({"name": name[:48], "offset": max(0, offset)})
    url = f"{EMOJI_API_BASE}?{params}"
    req = urllib.request.Request(url, headers={"X-Api-Key": key})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw = resp.read().decode()
            data = json.loads(raw)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        print(f"[EMOJI API] {name!r}: {e}")
        return None

    if isinstance(data, list) and data:
        return data[0]
    if isinstance(data, dict) and data.get("character"):
        return data
    return None


def _char_from_item(item: Optional[dict]) -> Optional[str]:
    if not item:
        return None
    return item.get("character") or item.get("emoji") or item.get("char")


def emoji_for_slide(title: str, slide_index: int) -> Optional[str]:
    """
    Pick one emoji per slide: search by title keyword, then fallbacks / unicode.
    Works without API key (unicode only).
    """
    key = _api_key()
    name = _first_word_from_title(title)
    if not name or len(name) < 2:
        name = NAME_FALLBACKS[slide_index % len(NAME_FALLBACKS)]

    if key:
        item = fetch_emoji_by_name(name, offset=0)
        ch = _char_from_item(item)
        if ch:
            return ch
        # second try: rotate fallback name + offset for variety per iteration
        alt = NAME_FALLBACKS[(slide_index + 3) % len(NAME_FALLBACKS)]
        item = fetch_emoji_by_name(alt, offset=(slide_index % 3) * 5)
        ch = _char_from_item(item)
        if ch:
            return ch

    return UNICODE_FALLBACK[slide_index % len(UNICODE_FALLBACK)]
