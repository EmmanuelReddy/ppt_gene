import os
import time
import random
import hashlib
import json
import re
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# Langchain imports
from langchain_community.document_loaders import PyPDFLoader, UnstructuredPowerPointLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings

import pexels_service

# -----------------------------------------------
# THEME: one palette per deck; "random" picks a new palette each generation
# -----------------------------------------------
RANDOM_THEME_POOL = [
    "neon_vc",
    "ember_capital",
    "midnight_data",
    "aurora_violet",
    "forest_gold",
    "sunset_rose",
    "carbon_amber",
    "ocean_mint",
    "gamma_mosaic",
    "canva_pop",
    "chronicle_paper",
    "modal_dusk",
    "moda_canvas",
    "studio_daylight",
]


def resolve_theme_pack(theme_pack: str) -> str:
    t = (theme_pack or "").strip().lower()
    if t in ("random", "auto", "shuffle"):
        return random.choice(RANDOM_THEME_POOL)
    return theme_pack


def _is_pitch_style_mode(founder_mode: str) -> bool:
    return founder_mode in ("fundraising", "gtm_narrative", "product_traction")


def _get_deck_mode_config(founder_mode: str) -> tuple[str, str]:
    """Returns (directive, slide_structure_hint) for content phase."""
    config: Dict[str, tuple[str, str]] = {
        "fundraising": (
            "Optimize for investor conviction, defensibility, traction, and clear ask.",
            "Slide flow hint: problem → insight → product → traction → market → model → competition → team → ask.",
        ),
        "gtm_narrative": (
            "Optimize for go-to-market clarity: ICP, channels, conversion loops, and revenue ramp.",
            "Slide flow hint: context → ICP → motion → channels → funnel → proof → scaling plan.",
        ),
        "product_traction": (
            "Optimize for product depth, retention, usage growth, and roadmap credibility.",
            "Slide flow hint: problem → product → users → metrics → roadmap → differentiation.",
        ),
        "enterprise_sales": (
            "Optimize for buyer pain, quantified outcomes, proof, deployment path, and commercial next step.",
            "Slide flow hint: hook → pain → outcome → solution map → proof → security/ops → ROI → next step.",
        ),
        "marketing_launch": (
            "Optimize for campaign narrative, audience, message pillars, channels, and KPIs.",
            "Slide flow hint: objective → audience insight → positioning → pillars → plan → measurement.",
        ),
        "product_roadmap": (
            "Optimize for milestones, dependencies, sequencing, and delivery risk.",
            "Slide flow hint: vision → current state → phases → milestones → owners/risks → success criteria.",
        ),
        "quarterly_review": (
            "Optimize for results vs plan, KPIs, highlights, blockers, and forward outlook.",
            "Slide flow hint: headline → KPI scorecard → wins → misses → learnings → outlook → priorities.",
        ),
        "research_report": (
            "Optimize for thesis, scope, methodology, findings, evidence, and implications.",
            "Slide flow hint: question → context → methods → findings → discussion → conclusions → next steps.",
        ),
        "education": (
            "Optimize for learning objectives, conceptual scaffolding, examples, and takeaways.",
            "Slide flow hint: outcomes → concepts → examples → recap → resources.",
        ),
        "brand_story": (
            "Optimize for narrative arc, differentiation, proof, and memorable positioning beyond raw metrics.",
            "Slide flow hint: why now → belief → proof points → craft → momentum → closing thought.",
        ),
    }
    fallback = (
        "Adapt structure to the user's topic with clear progression and concrete evidence.",
        "Slide flow hint: open with context, build a logical arc, end with a crisp takeaway.",
    )
    return config.get(founder_mode, fallback)


# -----------------------------------------------
# DEV_MODE MOCK (Bypasses ALL API calls)
# Set DEV_MODE=true in .env to enable
# -----------------------------------------------
MOCK_DECK = {
    "title": "HealthSync: The Billion-User Health OS",
    "slides": [
        {
            "title": "$10T Opportunity",
            "layout_type": "disruptor",
            "main_text": "Global healthcare is broken. We fix it at scale.",
            "power_number": "$10 Trillion",
            "bullets": None,
            "comparison_shift": None,
            "metrics_table": None,
        },
        {
            "title": "The Problem",
            "layout_type": "data_pivot",
            "main_text": "The world is shifting from reactive to proactive health management.",
            "power_number": None,
            "bullets": None,
            "comparison_shift": {
                "old_way": "Reactive care: expensive hospital visits after illness",
                "new_way": "Predictive AI: continuous monitoring, early intervention",
            },
            "metrics_table": None,
        },
        {
            "title": "Next Billion Users",
            "layout_type": "feature_grid",
            "main_text": "A generation rewriting consumption and ambition through digital-first habits.",
            "power_number": None,
            "bullets": None,
            "comparison_shift": None,
            "metrics_table": None,
            "grid_section_label": "TARGET CONSUMER",
            "headline_prefix": "India's Next Billion:",
            "headline_highlight": "Digital,",
            "headline_suffix": "Aspirational, Empowered",
            "circle_stat": "1 BILLION+",
            "circle_label": "Connected Citizens",
            "circle_footer": "A generation rewriting the rules of consumption and ambition",
            "feature_cards": [
                {"title": "Digitally Empowered", "body": "Connected youth shaping their lives through technology.", "emoji": None},
                {"title": "Aspirational Lifestyles", "body": "Seeking better urban living and self-improvement.", "emoji": None},
                {"title": "Purpose-Driven", "body": "Investing in passion economies: climate, fashion, food.", "emoji": None},
                {"title": "Future-Ready", "body": "Early adopters driving AI and new tech trends.", "emoji": None},
            ],
        },
        {
            "title": "Unit Economics",
            "layout_type": "roi_matrix",
            "main_text": "Capital doesn't build companies, commercialization does.",
            "power_number": None,
            "bullets": None,
            "comparison_shift": None,
            "metrics_table": [
                {"metric": "CAC (Customer Acq. Cost)", "value": "$1.20"},
                {"metric": "LTV (12-month)", "value": "$48"},
                {"metric": "LTV:CAC Ratio", "value": "40x"},
                {"metric": "Gross Margin", "value": "78%"},
            ],
        },
        {
            "title": "300% MoM",
            "layout_type": "disruptor",
            "main_text": "Fastest growing health platform in Southeast Asia.",
            "power_number": "300% MoM",
            "bullets": None,
            "comparison_shift": None,
            "metrics_table": None,
        },
        {
            "title": "2030 Vision",
            "layout_type": "data_pivot",
            "main_text": "Anthill-style commercialization engine — not just a product.",
            "power_number": None,
            "bullets": None,
            "comparison_shift": {
                "old_way": "Fragmented apps chasing downloads",
                "new_way": "HealthSync OS: the infrastructure layer for 1B users by 2030",
            },
            "metrics_table": None,
        },
        {
            "title": "The Ask",
            "layout_type": "roi_matrix",
            "main_text": "Seed round to accelerate commercialization across 5 markets.",
            "power_number": None,
            "bullets": None,
            "comparison_shift": None,
            "metrics_table": [
                {"metric": "Round Size", "value": "$2.5M"},
                {"metric": "Valuation", "value": "$12M pre-money"},
                {"metric": "18-Month Runway", "value": "5 markets live"},
                {"metric": "Target ARR", "value": "$8M"},
            ],
        },
    ],
}

# -----------------------------------------------
# KEY POOL
# -----------------------------------------------
def _load_key_pool() -> List[str]:
    candidates = [
        os.environ.get("GEMINI_API_KEY_CONTENT", "").strip(),
        os.environ.get("GEMINI_API_KEY_DESIGN", "").strip(),
        os.environ.get("GEMINI_KEY_1", "").strip(),
        os.environ.get("GEMINI_KEY_2", "").strip(),
        os.environ.get("GEMINI_API_KEY", "").strip(),
    ]
    seen = set()
    pool = []
    for k in candidates:
        if k and k not in seen:
            seen.add(k)
            pool.append(k)
    return pool

# -----------------------------------------------
# CACHE UTILITIES (opt-in only — no permanent disk cache by default)
# Set ENABLE_DISK_CACHE=true to reuse Gemini content/design JSON on disk.
# -----------------------------------------------
CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)


def _disk_cache_enabled() -> bool:
    return os.environ.get("ENABLE_DISK_CACHE", "").strip().lower() in ("1", "true", "yes", "on")


def _cache_key(prompt: str) -> str:
    return hashlib.md5(prompt.encode()).hexdigest()


def _read_cache(prompt: str) -> Optional[dict]:
    if not _disk_cache_enabled():
        return None
    path = os.path.join(CACHE_DIR, f"{_cache_key(prompt)}.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            print(f"[CACHE HIT] Returning cached response for prompt hash {_cache_key(prompt)[:8]}...")
            return json.load(f)
    return None


def _write_cache(prompt: str, data: dict):
    if not _disk_cache_enabled():
        return
    path = os.path.join(CACHE_DIR, f"{_cache_key(prompt)}.json")
    with open(path, "w") as f:
        json.dump(data, f)

# -----------------------------------------------
# RESILIENT API CALL (Key Rotation + Backoff)
# -----------------------------------------------
_LAST_GEMINI_CALL_AT = 0.0
# Lower = faster runs; raise (e.g. 1.2) if you hit 429 rate limits from Google.
_MIN_GEMINI_GAP_SECONDS = float(os.environ.get("GEMINI_MIN_GAP_SECONDS", "0.45"))
# ---------------------------------------------------------------------------
# Model routing: defaults use gemini-2.5-flash-lite for content + design (see _get_*_model).
# Full gemini-2.5-flash (non-lite) remains in GEMINI_MODEL_BLOCKLIST by default.
# Set GEMINI_PRIMARY_MODEL=tunedModels/... for a custom tuned model (tried first).
# GEMINI_CONTENT_MODEL / GEMINI_DESIGN_MODEL override per pipeline stage.
# GEMINI_FALLBACK_MODELS=comma-separated full chain (optional).
# GEMINI_MODEL_BLOCKLIST=comma-separated models to never use (default: gemini-2.5-flash).
# ---------------------------------------------------------------------------
_MODEL_CONFIG_LOGGED = False


def _parse_blocklist() -> set:
    raw = os.environ.get("GEMINI_MODEL_BLOCKLIST", "gemini-2.5-flash").strip()
    return {m.strip() for m in raw.split(",") if m.strip()}


def _strip_blocklisted(models: List[str]) -> List[str]:
    bl = _parse_blocklist()
    return [m for m in models if m not in bl]


def _default_content_fallback_chain() -> List[str]:
    return _strip_blocklisted(
        [
            "gemini-2.5-flash-lite",
            "gemini-3-flash-preview",
            "gemini-3.1-pro-preview",
            "gemini-3-pro-preview",
            "gemini-3.1-flash-lite-preview",
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash",
        ]
    )


def _default_design_fallback_chain() -> List[str]:
    return _strip_blocklisted(
        [
            "gemini-2.5-flash-lite",
            "gemini-3.1-flash-lite-preview",
            "gemini-3-flash-preview",
            "gemini-3.1-pro-preview",
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash",
        ]
    )


def _get_content_model() -> str:
    # Default: 2.5 Flash Lite — fast; upgrade via GEMINI_CONTENT_MODEL if you need heavier models.
    return (
        os.environ.get("GEMINI_CONTENT_MODEL", "").strip()
        or os.environ.get("GEMINI_PRIMARY_MODEL", "").strip()
        or "gemini-2.5-flash-lite"
    )


def _get_design_model() -> str:
    return (
        os.environ.get("GEMINI_DESIGN_MODEL", "").strip()
        or os.environ.get("GEMINI_PRIMARY_MODEL", "").strip()
        or "gemini-2.5-flash-lite"
    )


def _model_chain(preferred_model: str, role: str) -> List[str]:
    bl = _parse_blocklist()
    if preferred_model in bl:
        raise Exception(
            f"Preferred model '{preferred_model}' is in GEMINI_MODEL_BLOCKLIST. "
            "Change GEMINI_CONTENT_MODEL / GEMINI_DESIGN_MODEL / GEMINI_PRIMARY_MODEL or update the blocklist."
        )
    env_models = os.environ.get("GEMINI_FALLBACK_MODELS", "").strip()
    if env_models:
        parsed = [m.strip() for m in env_models.split(",") if m.strip()]
        if preferred_model not in parsed:
            parsed.insert(0, preferred_model)
        seen = set()
        chain: List[str] = []
        for m in parsed:
            if m not in seen:
                seen.add(m)
                chain.append(m)
        chain = _strip_blocklisted(chain)
    else:
        base = _default_content_fallback_chain() if role == "content" else _default_design_fallback_chain()
        chain = [preferred_model] + [m for m in base if m != preferred_model]
        seen = set()
        uniq: List[str] = []
        for m in chain:
            if m not in seen:
                seen.add(m)
                uniq.append(m)
        chain = _strip_blocklisted(uniq)

    if not chain:
        raise Exception(
            "GEMINI_MODEL_BLOCKLIST removed all models. Adjust GEMINI_MODEL_BLOCKLIST or set GEMINI_FALLBACK_MODELS."
        )
    return chain


def _log_model_config_once():
    global _MODEL_CONFIG_LOGGED
    if not _MODEL_CONFIG_LOGGED:
        print(
            f"[MODEL CONFIG] content={_get_content_model()} | design={_get_design_model()} | "
            f"blocklist={_parse_blocklist()}"
        )
        _MODEL_CONFIG_LOGGED = True


def _wait_for_min_gap():
    global _LAST_GEMINI_CALL_AT
    now = time.time()
    elapsed = now - _LAST_GEMINI_CALL_AT
    if elapsed < _MIN_GEMINI_GAP_SECONDS:
        time.sleep(_MIN_GEMINI_GAP_SECONDS - elapsed)
    _LAST_GEMINI_CALL_AT = time.time()


def _is_retryable_error(err_str: str) -> bool:
    lowered = err_str.lower()
    retryable_markers = [
        "429",
        "503",
        "resource_exhausted",
        "quota",
        "rate limit",
        "temporarily unavailable",
    ]
    return any(marker in lowered for marker in retryable_markers)


def _is_model_overload_error(err_str: str) -> bool:
    lowered = err_str.lower()
    return "503" in lowered or "unavailable" in lowered or "high demand" in lowered


def _is_model_not_found_error(err_str: str) -> bool:
    lowered = err_str.lower()
    return (
        "404" in lowered
        or "not found for api version" in lowered
        or "is not found" in lowered
        or "not supported for generatecontent" in lowered
        or "no longer available" in lowered
    )


def _call_with_rotation(prompt: str, schema, system_instruction: str, *, role: str = "content") -> str:
    _log_model_config_once()
    key_pool = _load_key_pool()
    if not key_pool:
        raise Exception("No Gemini API keys found in .env. Add GEMINI_API_KEY_CONTENT or GEMINI_API_KEY.")

    max_retries_per_key = 4
    last_error = None
    preferred = _get_content_model() if role == "content" else _get_design_model()
    models_to_try = _model_chain(preferred, role)

    for model_index, model_name in enumerate(models_to_try):
        print(f"[MODEL ROUTER] Trying model {model_name} ({model_index + 1}/{len(models_to_try)})")
        should_try_next_model = False

        for key_index, api_key in enumerate(key_pool):
            client = genai.Client(api_key=api_key)
            print(f"[KEY POOL] Trying key #{key_index + 1} of {len(key_pool)}...")

            for attempt in range(max_retries_per_key):
                try:
                    _wait_for_min_gap()
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=schema,
                            system_instruction=system_instruction,
                        ),
                    )
                    return response.text

                except Exception as e:
                    err_str = str(e)
                    last_error = e

                    if "400" in err_str and "key not valid" in err_str.lower():
                        print(f"[KEY POOL] Key #{key_index + 1} is INVALID — skipping to next key.")
                        break

                    elif _is_model_not_found_error(err_str):
                        print(f"[MODEL ROUTER] Model '{model_name}' unavailable/deprecated, trying next model.")
                        should_try_next_model = True
                        break

                    elif _is_model_overload_error(err_str):
                        wait = min((2 ** (attempt + 1)) + random.uniform(0.5, 2.0), 12.0)
                        print(
                            f"[MODEL ROUTER] Model '{model_name}' overloaded. "
                            f"Waiting {wait:.1f}s before retry (attempt {attempt + 1}/{max_retries_per_key})..."
                        )
                        time.sleep(wait)
                        if attempt == max_retries_per_key - 1:
                            should_try_next_model = True

                    elif _is_retryable_error(err_str):
                        wait = min((2 ** (attempt + 1)) + random.uniform(0.5, 2.0), 16.0)
                        print(f"[BACKOFF] Key #{key_index + 1} hit quota/transient issue. "
                              f"Waiting {wait:.1f}s (attempt {attempt + 1}/{max_retries_per_key})...")
                        time.sleep(wait)
                    else:
                        raise e

            if should_try_next_model:
                break

        if should_try_next_model:
            continue

    raise Exception(
        f"All models and {len(key_pool)} API keys exhausted after retries. "
        f"Last error: {last_error}. Wait and retry, or update fallback models/keys."
    )

# -----------------------------------------------
# SCHEMA DEFINITIONS
# -----------------------------------------------
class ContentSlide(BaseModel):
    title: str = Field(description="Max 3 word title")
    thesis: str = Field(description="A powerful overarching thesis — NOT a summary.")
    points: List[str] = Field(description="Bullet vectors.")

class ContentOutline(BaseModel):
    title: str = Field(description="Title of the presentation; must reflect the user's topic (no unrelated domains).")
    slides: List[ContentSlide] = Field(
        description="10–14 slides of core logic (8–10 only if density is concise). Every slide must support the user's stated topic."
    )

class ComparisonShift(BaseModel):
    old_way: str = Field(description="The legacy or outdated constraint.")
    new_way: str = Field(description="The proposed innovative solution.")

class MetricRow(BaseModel):
    metric: str = Field(description="The name of the parameter/target. E.g., Revenue")
    value: str = Field(description="The numeric focal value. E.g., $10M")


class FeatureCardItem(BaseModel):
    title: str = Field(description="Short card headline.")
    body: str = Field(description="One supporting sentence.")
    emoji: Optional[str] = Field(
        default=None,
        description="Single emoji ONLY if it clarifies the card; otherwise null (no decorative emoji).",
    )


class StoryStepItem(BaseModel):
    label: str = Field(description="Short stage label, e.g. Phase 1")
    title: str = Field(description="Step headline")
    detail: str = Field(description="One concise supporting sentence")


class DesignedSlide(BaseModel):
    title: str
    layout_type: str = Field(
        description=(
            "MUST be one of: 'disruptor', 'scaling_machine', 'data_pivot', 'roi_matrix', 'feature_grid', 'timeline_story', 'spotlight_frame', 'duo_cards'. "
            "Use 'feature_grid' for audience/persona/consumer pillars: left stat circle + 2x2 cards (Gamma/Chronicle style). "
            "Use 'timeline_story' for roadmap/process/journey narratives with 3-5 chronological steps. "
            "Use 'spotlight_frame' for quote-led narrative statement with concise support. "
            "Use 'duo_cards' for two-lens contrast (e.g., challenge vs response, present vs future). "
            "CRITICAL: If the slide contains a percentage or a dollar amount over $100M, "
            "you MUST assign 'disruptor' and extract a power_number."
        )
    )
    main_text: Optional[str] = Field(description="The primary thesis or description backing the slide.")
    power_number: Optional[str] = Field(description="The big focal metric. Mandatory for 'disruptor'.")
    bullets: Optional[List[str]] = Field(description="Exactly 3 bullets for 'scaling_machine'.")
    comparison_shift: Optional[ComparisonShift] = Field(description="Used ONLY for 'data_pivot'.")
    metrics_table: Optional[List[MetricRow]] = Field(description="Used ONLY for 'roi_matrix'.")
    visual_seed: Optional[str] = Field(
        default=None,
        description="Short visual style seed words (2-6 words) for background art generation."
    )
    emoji_char: Optional[str] = Field(
        default=None,
        description="Deprecated for auto-fill; leave null. Do not set decorative slide-level emoji.",
    )
    grid_section_label: Optional[str] = Field(
        default=None,
        description="Small caps label above headline (feature_grid only). E.g. TARGET CONSUMER.",
    )
    headline_prefix: Optional[str] = Field(default=None, description="feature_grid headline before highlight.")
    headline_highlight: Optional[str] = Field(default=None, description="feature_grid accent phrase (often one word).")
    headline_suffix: Optional[str] = Field(default=None, description="feature_grid headline after highlight.")
    circle_emoji: Optional[str] = Field(
        default=None,
        description="Single emoji in hero circle if meaningful (e.g. flag); else null.",
    )
    circle_stat: Optional[str] = Field(
        default=None,
        description="feature_grid REQUIRED: short stat or badge text in hero circle (e.g. 4 PILLARS, 99.9%). Never leave empty for feature_grid.",
    )
    circle_label: Optional[str] = Field(
        default=None,
        description="feature_grid REQUIRED: bold label under stat (e.g. TECHNOLOGY PILLAR). Never leave empty for feature_grid.",
    )
    circle_footer: Optional[str] = Field(
        default=None,
        description="feature_grid REQUIRED: one-line caption under the circle tied to this slide's thesis. Never leave empty for feature_grid.",
    )
    feature_cards: Optional[List[FeatureCardItem]] = Field(
        default=None,
        description="Exactly 4 items for feature_grid; otherwise null.",
    )
    story_steps: Optional[List[StoryStepItem]] = Field(
        default=None,
        description="For timeline_story only: 3-5 chronological steps with label/title/detail.",
    )
    pexels_search_query: Optional[str] = Field(
        default=None,
        description=(
            "2–8 words English phrase optimized for Pexels stock photo search that matches this slide "
            "(mood + scene, e.g. 'dark abstract technology network'). Leave empty only if unsure."
        ),
    )
    background_image_url: Optional[str] = Field(
        default=None,
        description="Filled by server from Pexels; do not invent URLs.",
    )
    pexels_photo_page_url: Optional[str] = Field(default=None, description="Pexels photo page URL; server fills.")
    pexels_photographer: Optional[str] = Field(default=None, description="Photographer name; server fills.")
    pexels_photographer_url: Optional[str] = Field(default=None, description="Photographer profile on Pexels; server fills.")

class PresentationDeck(BaseModel):
    title: str
    slides: List[DesignedSlide]
    applied_theme_pack: Optional[str] = Field(
        default=None,
        description="Resolved theme id for this deck (e.g. random → neon_vc).",
    )
    generation_id: Optional[int] = Field(
        default=None,
        description="Per-generation id so the client can refresh layout accents.",
    )


def strip_auto_slide_emojis(slides: List[DesignedSlide]) -> List[DesignedSlide]:
    """Do not attach automatic slide-level emojis; optional emojis belong in feature_cards only."""
    return [s.model_copy(update={"emoji_char": None}) for s in slides]


def _compose_pexels_query(slide: DesignedSlide, deck_prompt: str, slide_index: int) -> str:
    topic_hint = pexels_service.sanitize_search_query((deck_prompt or "")[:140])
    if slide.pexels_search_query and slide.pexels_search_query.strip():
        sq = pexels_service.sanitize_search_query(slide.pexels_search_query)
        if topic_hint and topic_hint not in sq:
            return pexels_service.sanitize_search_query(f"{topic_hint} {sq}")
        return sq
    parts = [
        slide.visual_seed or "",
        slide.title or "",
        (slide.main_text or "")[:160],
    ]
    blob = " ".join(p for p in parts if p)
    if blob.strip():
        merged = f"{topic_hint} {blob}" if topic_hint else blob
        return pexels_service.sanitize_search_query(merged)
    return pexels_service.sanitize_search_query(topic_hint or "pitch deck business")


def _clear_pexels_fields(slide: DesignedSlide) -> DesignedSlide:
    return slide.model_copy(
        update={
            "background_image_url": None,
            "pexels_photo_page_url": None,
            "pexels_photographer": None,
            "pexels_photographer_url": None,
        }
    )


def _should_use_photo_background(slide: DesignedSlide) -> bool:
    """Apply Pexels only where photography improves the slide, not dense data surfaces."""
    lt = (slide.layout_type or "").strip().lower()
    if lt in ("roi_matrix",):
        return False
    cue = " ".join(
        [
            slide.title or "",
            slide.main_text or "",
            slide.visual_seed or "",
            slide.pexels_search_query or "",
        ]
    ).lower()
    if any(tok in cue for tok in ("table", "spreadsheet", "matrix", "kpi", "financial model", "dense data")):
        return False
    return True


def attach_pexels_backgrounds(slides: List[DesignedSlide], deck_prompt: str) -> List[DesignedSlide]:
    key = (os.environ.get("PEXELS_API_KEY") or "").strip()
    if not key:
        return slides
    out: List[DesignedSlide] = []
    for i, s in enumerate(slides):
        if not _should_use_photo_background(s):
            out.append(_clear_pexels_fields(s))
            continue
        q = _compose_pexels_query(s, deck_prompt, i)
        data = pexels_service.fetch_background_for_slide(q, key, slide_index=i)
        if not data:
            out.append(_clear_pexels_fields(s))
            continue
        out.append(
            s.model_copy(
                update={
                    "background_image_url": data["image_url"],
                    "pexels_photo_page_url": data.get("photo_page_url") or None,
                    "pexels_photographer": data.get("photographer") or None,
                    "pexels_photographer_url": data.get("photographer_url") or None,
                }
            )
        )
    return out


def clear_pexels_server_fields(slides: List[DesignedSlide]) -> List[DesignedSlide]:
    """Remove any model-hallucinated Pexels URLs before server attach."""
    return [
        s.model_copy(
            update={
                "background_image_url": None,
                "pexels_photo_page_url": None,
                "pexels_photographer": None,
                "pexels_photographer_url": None,
            }
        )
        for s in slides
    ]


def _ensure_feature_grid_filled(slide: DesignedSlide, content: Optional[ContentSlide]) -> DesignedSlide:
    """Avoid empty hero circle and thin cards when the model omits fields."""
    blob = " ".join(
        [
            slide.title or "",
            slide.main_text or "",
            slide.headline_prefix or "",
            slide.headline_highlight or "",
            slide.headline_suffix or "",
        ]
    )
    stat = (slide.circle_stat or "").strip()
    label = (slide.circle_label or "").strip()
    footer = (slide.circle_footer or "").strip()
    if not stat:
        m = re.search(r"\$?\d+(?:\.\d+)?\s?(?:%|[BMK]|x)", blob, re.I)
        stat = m.group(0).upper() if m else "4 PILLARS"
    if not label:
        gl = (slide.grid_section_label or "").strip()
        label = (gl[:48] if gl else (slide.title or "STRATEGY").upper())[:48]
    if not footer:
        if content and (content.thesis or "").strip():
            t = content.thesis.strip()
            footer = (t[:150] + "…") if len(t) > 150 else t
        elif (slide.main_text or "").strip():
            t = slide.main_text.strip()
            footer = (t[:150] + "…") if len(t) > 150 else t
        else:
            footer = "Supporting detail aligned with your outline thesis."

    cards_in = list(slide.feature_cards or [])
    out_cards: List[FeatureCardItem] = []
    for i in range(4):
        if i < len(cards_in) and (cards_in[i].title or "").strip():
            c = cards_in[i]
            body = (c.body or "").strip()
            if not body:
                if content and len(content.points) > i:
                    body = content.points[i][:240]
                elif content and content.thesis:
                    body = content.thesis[:240]
                else:
                    body = (slide.main_text or "—")[:240]
            out_cards.append(FeatureCardItem(title=c.title.strip()[:72], body=body[:240], emoji=c.emoji))
        else:
            pt = ""
            if content and len(content.points) > i:
                pt = content.points[i]
            elif content and content.thesis:
                pt = content.thesis
            else:
                pt = slide.main_text or "Supporting point"
            if ":" in pt:
                t, _, b = pt.partition(":")
                title = (t.strip()[:72] or f"Pillar {i + 1}")
                body = (b.strip() or pt)[:220]
            else:
                title = (pt[:50] + ("…" if len(pt) > 50 else "")) if pt else f"Pillar {i + 1}"
                body = (pt if len(pt) <= 220 else pt[:217] + "…") or (slide.main_text or "—")[:220]
            out_cards.append(FeatureCardItem(title=title, body=body, emoji=None))

    return slide.model_copy(
        update={
            "circle_stat": stat,
            "circle_label": label,
            "circle_footer": footer,
            "feature_cards": out_cards,
        }
    )


def _post_process_deck_from_outline(outline: ContentOutline, deck: PresentationDeck) -> PresentationDeck:
    out_slides: List[DesignedSlide] = []
    for i, s in enumerate(deck.slides):
        content = outline.slides[i] if i < len(outline.slides) else None
        if s.layout_type == "feature_grid":
            out_slides.append(_ensure_feature_grid_filled(s, content))
        else:
            out_slides.append(s)
    return deck.model_copy(update={"slides": out_slides})


def _extract_power_number(text: str) -> Optional[str]:
    if not text:
        return None
    match = re.search(r"(\$?\d+(?:\.\d+)?\s?(?:[MBTK]|%|x))", text, flags=re.IGNORECASE)
    return match.group(1).upper() if match else None


def _pick_layout(slide: ContentSlide) -> str:
    text_blob = " ".join([slide.title, slide.thesis, *slide.points])
    low = text_blob.lower()
    if re.search(r"\$?\d+(?:\.\d+)?\s?(?:B|T|M|%)", text_blob, flags=re.IGNORECASE):
        return "disruptor"
    fg_tokens = (
        "consumer",
        "persona",
        "audience",
        "billion",
        "target",
        "icp",
        "empowered",
        "aspirational",
        "citizen",
        "generation",
        "market segment",
        "pillar",
        "technology",
        "capabilities",
        "engine",
        "platform",
        "stack",
        "module",
        "campaign",
        "channel",
        "messaging",
        "stakeholder",
        "lesson",
        "curriculum",
        "learning objective",
        "brand",
        "value prop",
    )
    if any(t in low for t in fg_tokens):
        return "feature_grid"
    timeline_tokens = (
        "timeline",
        "roadmap",
        "journey",
        "phase",
        "milestone",
        "sequence",
        "step",
        "implementation plan",
        "rollout",
    )
    if any(t in low for t in timeline_tokens):
        return "timeline_story"
    duo_tokens = ("vs", "versus", "tradeoff", "compare", "option", "either", "balance", "before and after")
    if any(t in low for t in duo_tokens):
        return "duo_cards"
    spotlight_tokens = ("thesis", "belief", "principle", "why now", "vision", "north star", "manifesto")
    if any(t in low for t in spotlight_tokens):
        return "spotlight_frame"
    if any(token in low for token in ["before", "after", "shift", "vs", "from", "to"]):
        return "data_pivot"
    if any(token in low for token in ["revenue", "margin", "ltv", "cac", "arr", "metric"]):
        return "roi_matrix"
    return "scaling_machine"


def _build_feature_grid_fallback(raw: ContentSlide) -> DesignedSlide:
    pts = list(raw.points) if raw.points else []
    while len(pts) < 4:
        pts.append(raw.thesis[:200] if raw.thesis else "High-conviction thesis.")
    cards: List[FeatureCardItem] = []
    for p in pts[:4]:
        line = (p or "").strip()
        if not line:
            line = raw.thesis[:120] if raw.thesis else "Strategic pillar"
        if ":" in line:
            head, rest = line.split(":", 1)
            cards.append(FeatureCardItem(title=head.strip()[:72], body=rest.strip()[:220]))
        else:
            cards.append(FeatureCardItem(title=line[:56], body=raw.thesis[:180] if raw.thesis else line))
    words = (raw.title or "Market").split()
    hl = words[-1] if len(words) > 1 else (words[0] if words else "Growth")
    prefix = " ".join(words[:-1]) if len(words) > 1 else ""
    return DesignedSlide(
        title=raw.title,
        layout_type="feature_grid",
        main_text=raw.thesis,
        grid_section_label="TARGET AUDIENCE",
        headline_prefix=prefix or None,
        headline_highlight=hl,
        headline_suffix=None,
        circle_stat="1B+",
        circle_label="CONNECTED USERS",
        circle_footer=(raw.thesis[:140] + "…") if len(raw.thesis or "") > 140 else raw.thesis,
        feature_cards=cards,
        visual_seed="editorial audience mosaic",
        pexels_search_query=pexels_service.sanitize_search_query(
            f"{raw.title} {raw.thesis} diverse audience urban technology"
        ),
    )


def _build_resilient_design_fallback(outline: ContentOutline) -> PresentationDeck:
    slides: List[DesignedSlide] = []
    layout_counts: Dict[str, int] = {}
    prev_layout: Optional[str] = None
    for i, raw in enumerate(outline.slides):
        layout = _pick_layout(raw)
        if prev_layout == layout and layout_counts.get(layout, 0) >= 2:
            if layout in ("scaling_machine", "roi_matrix"):
                layout = "feature_grid"
            elif layout == "feature_grid":
                layout = "timeline_story"
            elif layout == "data_pivot":
                layout = "scaling_machine"
            elif layout == "timeline_story":
                layout = "spotlight_frame"
            elif layout == "spotlight_frame":
                layout = "duo_cards"
        if i >= 4 and len({k for k, v in layout_counts.items() if v > 0}) < 2 and layout == prev_layout:
            layout = "feature_grid" if layout != "feature_grid" else "timeline_story"

        layout_counts[layout] = layout_counts.get(layout, 0) + 1
        prev_layout = layout
        if layout == "feature_grid":
            slides.append(_build_feature_grid_fallback(raw))
            continue
        if layout == "timeline_story":
            points = list(raw.points or [])
            while len(points) < 3:
                points.append(raw.thesis[:180] if raw.thesis else "Milestone detail")
            steps: List[StoryStepItem] = []
            for i, p in enumerate(points[:4]):
                line = (p or "").strip() or f"Step {i + 1} detail"
                if ":" in line:
                    step_title, _, step_detail = line.partition(":")
                    steps.append(
                        StoryStepItem(
                            label=f"PHASE {i + 1}",
                            title=step_title.strip()[:48] or f"Phase {i + 1}",
                            detail=(step_detail.strip() or line)[:200],
                        )
                    )
                else:
                    steps.append(
                        StoryStepItem(
                            label=f"PHASE {i + 1}",
                            title=(line[:56] + ("…" if len(line) > 56 else "")),
                            detail=(raw.thesis or line)[:200],
                        )
                    )
            slides.append(
                DesignedSlide(
                    title=raw.title,
                    layout_type="timeline_story",
                    main_text=raw.thesis,
                    story_steps=steps,
                    visual_seed=f"{raw.title} roadmap journey",
                    pexels_search_query=pexels_service.sanitize_search_query(f"{raw.title} timeline strategy"),
                )
            )
            continue
        if layout == "spotlight_frame":
            support = list(raw.points or [])
            while len(support) < 2:
                support.append(raw.thesis[:180] if raw.thesis else "Supporting point")
            slides.append(
                DesignedSlide(
                    title=raw.title,
                    layout_type="spotlight_frame",
                    main_text=raw.thesis,
                    bullets=support[:3],
                    visual_seed=f"{raw.title} editorial spotlight",
                    pexels_search_query=pexels_service.sanitize_search_query(f"{raw.title} abstract editorial"),
                )
            )
            continue
        if layout == "duo_cards":
            left = raw.points[0] if raw.points else "Current state constraints"
            right = raw.points[1] if len(raw.points) > 1 else "Proposed strategic response"
            slides.append(
                DesignedSlide(
                    title=raw.title,
                    layout_type="duo_cards",
                    main_text=raw.thesis,
                    comparison_shift=ComparisonShift(old_way=left, new_way=right),
                    visual_seed=f"{raw.title} dual perspective",
                    pexels_search_query=pexels_service.sanitize_search_query(f"{raw.title} business contrast"),
                )
            )
            continue
        point_1 = raw.points[0] if raw.points else "Legacy execution"
        point_2 = raw.points[1] if len(raw.points) > 1 else "Focused execution"
        metrics = [
            MetricRow(metric="Capital Efficiency", value="Top Quartile"),
            MetricRow(metric="Growth Quality", value="Compounding"),
            MetricRow(metric="Founder Readiness", value="High"),
        ]
        designed = DesignedSlide(
            title=raw.title,
            layout_type=layout,
            main_text=raw.thesis,
            power_number=_extract_power_number(f"{raw.title} {raw.thesis} {' '.join(raw.points)}") if layout == "disruptor" else None,
            bullets=(raw.points[:3] if raw.points else None) if layout == "scaling_machine" else None,
            comparison_shift=ComparisonShift(old_way=point_1, new_way=point_2) if layout == "data_pivot" else None,
            metrics_table=metrics if layout == "roi_matrix" else None,
            visual_seed=f"{raw.title} founders growth",
            pexels_search_query=pexels_service.sanitize_search_query(f"{raw.title} {raw.thesis}"),
        )
        slides.append(designed)

    return PresentationDeck(title=outline.title, slides=slides)

# -----------------------------------------------
# RAG PIPELINE
# -----------------------------------------------
def process_document(file_path: str, query: str) -> str:
    if file_path.lower().endswith(".pdf"):
        loader = PyPDFLoader(file_path)
    elif file_path.lower().endswith(".pptx"):
        loader = UnstructuredPowerPointLoader(file_path)
    else:
        return ""

    docs = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)

    if not splits:
        return ""

    embeddings_key = (os.environ.get("GEMINI_API_KEY_CONTENT") or os.environ.get("GEMINI_API_KEY") or "").strip()
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=embeddings_key)
    vectorstore = FAISS.from_documents(documents=splits, embedding=embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 8})
    relevant_docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in relevant_docs)

# -----------------------------------------------
# MAIN GENERATION PIPELINE
# -----------------------------------------------
def generate_presentation_outline(
    prompt: str,
    file_path: Optional[str] = None,
    founder_mode: str = "fundraising",
    density: str = "balanced",
    theme_pack: str = "neon_vc",
    deck_archetype: str = "auto",
    locked_layouts: Optional[Dict[int, str]] = None,
) -> PresentationDeck:
    resolved_theme = resolve_theme_pack(theme_pack)

    # --- DEV_MODE GATE ---
    if os.environ.get("DEV_MODE", "false").lower() == "true":
        print("[DEV_MODE] Returning hardcoded mock deck. No API calls made.")
        deck = PresentationDeck.model_validate(MOCK_DECK)
        slides = strip_auto_slide_emojis(deck.slides)
        slides = clear_pexels_server_fields(slides)
        slides = attach_pexels_backgrounds(slides, prompt)
        return deck.model_copy(
            update={
                "applied_theme_pack": resolved_theme,
                "generation_id": random.randint(1, 2_147_483_647),
                "slides": slides,
            }
        )

    # --- RAG enrichment ---
    context_text = ""
    if file_path and os.path.exists(file_path):
        try:
            extracted_context = process_document(file_path, prompt)
            if extracted_context:
                if _is_pitch_style_mode(founder_mode):
                    context_text = (
                        f"\n\nSource Document Context:\n{extracted_context}\n\n"
                        "EXTRACTION RULES:\n"
                        "- Hunt for vision-scale metrics and capital-efficient growth signals.\n"
                        "- If you find a percentage or dollar amount OVER $100M, that slide MUST use 'disruptor' layout.\n"
                        "- Extract the thesis (overarching philosophy, not just a summary)."
                    )
                else:
                    context_text = (
                        f"\n\nSource Document Context:\n{extracted_context}\n\n"
                        "EXTRACTION RULES:\n"
                        "- Pull facts, figures, dates, names, and structured lists relevant to the user's topic.\n"
                        "- Prefer concrete evidence over generic marketing language.\n"
                        "- Map extracted material to the deck profile's slide flow (not a single 'pitch' template)."
                    )
        except Exception as e:
            print(f"[RAG WARNING] Failed to process document: {e}")

    # --- Phase 1: Content Mining with Cache ---
    mode_directive, structure_hint = _get_deck_mode_config(founder_mode)
    archetype_hints = {
        "auto": "Let the model infer best flow from the prompt.",
        "title_agenda_deepdive_cta": (
            "Named flow: Title/Context -> Agenda -> 2-4 Deep Dive slides -> Proof/metrics -> CTA or next step."
        ),
        "problem_solution_traction_ask": (
            "Named flow: Problem -> Existing alternatives -> Solution -> Traction -> Business model -> Ask."
        ),
        "story_timeline": (
            "Named flow: Opening context -> past/current state -> 3-5 timeline phases -> destination/outcome."
        ),
        "report_brief": (
            "Named flow: Executive summary -> key findings -> evidence panels -> implications -> recommendations."
        ),
        "workshop_lesson": (
            "Named flow: Learning objectives -> concept modules -> worked examples -> recap -> action items."
        ),
    }
    archetype_hint = archetype_hints.get(deck_archetype, archetype_hints["auto"])
    density_directives = {
        "concise": "Use short, punchy lines. Max 2-3 bullets per slide and compact thesis.",
        "balanced": "Use 3 bullets and medium-length thesis statements.",
        "detailed": "Use richer detail with 4-5 points when appropriate, without fluff.",
    }
    slide_count_guide = {
        "concise": "Produce 8–10 slides total.",
        "balanced": "Produce 10–12 slides total.",
        "detailed": "Produce 12–15 slides total.",
    }
    topic_snippet = (prompt or "").strip()[:800]
    deck_kind = (
        "Create a data-centric pitch deck"
        if _is_pitch_style_mode(founder_mode)
        else "Create a professional, presentation-ready deck"
    )
    content_prompt = (
        f"USER TOPIC (single source of truth — stay on this subject; do not invent a different industry, product, or geography):\n"
        f"{topic_snippet}\n\n"
        f"{slide_count_guide.get(density, slide_count_guide['balanced'])}\n"
        f"The deck title MUST explicitly reflect this topic (reuse the user's domain keywords where natural).\n"
        f"Every slide title, thesis, and bullet must directly support this topic — no generic filler from unrelated domains.\n\n"
        f"{deck_kind} for the topic above.\n"
        f"Deck profile: {founder_mode}. {mode_directive}\n"
        f"Named slide archetype: {deck_archetype}. {archetype_hint}\n"
        f"{structure_hint}\n"
        f"Density: {density}. {density_directives.get(density, density_directives['balanced'])}"
        f"{context_text}"
    )
    cached = _read_cache(f"content::{content_prompt}")

    perf_log = os.environ.get("PERF_LOG", "true").strip().lower() in ("1", "true", "yes", "on")
    wall_start = time.perf_counter()

    if cached:
        raw_outline = ContentOutline(**cached)
        if perf_log:
            print("[PERF] content phase: disk cache hit (skipping Gemini)")
    else:
        t0 = time.perf_counter()
        content_voice = (
            "You are an expert pitch and GTM analyst. Extract strong thesis statements, metrics where possible, "
            "and capital-smart growth angles when relevant."
            if _is_pitch_style_mode(founder_mode)
            else "You are an expert business presentation strategist. Prioritize clarity, evidence, and audience-appropriate "
            "framing. Avoid VC-only jargon unless the topic is fundraising or venture-related."
        )
        raw_json = _call_with_rotation(
            prompt=content_prompt,
            schema=ContentOutline,
            system_instruction=(
                f"{content_voice} "
                "TOPIC FIDELITY: The user topic block in the prompt is the only source of truth. "
                "Do not substitute unrelated industries (e.g. legal tech if the user asked for climate finance). "
                "Use concrete, topic-specific language; avoid generic template examples. "
                "Do NOT write fluff. Every point must carry data or conviction tied to the user's topic."
            ),
            role="content",
        )
        if perf_log:
            print(f"[PERF] content API ({_get_content_model()}): {time.perf_counter() - t0:.2f}s")
        raw_outline = ContentOutline.model_validate_json(raw_json)
        _write_cache(f"content::{content_prompt}", raw_outline.model_dump())

    # --- Phase 2: Design Mapping with Cache ---
    slide_summaries = [
        f"Slide {i+1}: {s.title} | {s.thesis} | Points: {', '.join(s.points)}"
        for i, s in enumerate(raw_outline.slides)
    ]
    slides_text = "\n".join(slide_summaries)

    locked_layout_rules = ""
    if locked_layouts:
        locked_lines = [f"- Slide {idx + 1} MUST remain '{layout}'." for idx, layout in locked_layouts.items()]
        locked_layout_rules = "LOCKED LAYOUT CONSTRAINTS:\n" + "\n".join(locked_lines) + "\n"

    theme_rules = {
        "variety": (
            "Deck uses rotating visual palettes slide-to-slide (teal, ember, blue, violet, green/gold, rose, slate/amber, mint); "
            "keep each slide cohesive; visual_seed should hint at the mood of that slide only."
        ),
        "neon_vc": "Dark VC neon theme with teal/cyan accents and high contrast.",
        "ember_capital": "Dark warm theme with ember/orange accents and strong highlights.",
        "midnight_data": "Dark blue analytics theme with indigo/cyan accents and clean data surfaces.",
        "aurora_violet": "Dark theme with violet, magenta, and soft pink highlights; futuristic premium.",
        "forest_gold": "Dark theme with emerald/green and gold accents; growth and resilience.",
        "sunset_rose": "Dark theme with coral, rose, and warm pink highlights; human-centric.",
        "carbon_amber": "Dark slate/gray base with amber and warm gray highlights; serious and data-forward.",
        "ocean_mint": "Dark deep blue with teal and mint highlights; crisp and liquid.",
        "anthill_reference": (
            "Light editorial VC deck: warm gray/cream slide canvas, orange left accent bar, "
            "serif headline feel, white rounded cards, subtle shadows (Billion Impact style)."
        ),
        "gamma_mosaic": (
            "Gamma-style: diagonal warm gradient canvas, bold orange accent, left hero orb, 2x2 cards; "
            "minimal decoration; emoji only inside feature_cards when meaningful."
        ),
        "canva_pop": (
            "Canva-style: light canvas, soft shadows, rounded cards, playful but professional accent (coral/violet)."
        ),
        "chronicle_paper": (
            "Chronicle-style: newsprint cream, thin rules, serif headlines, restrained color (single accent)."
        ),
        "modal_dusk": (
            "Modal.app-style: deep dusk purple/slate, soft gradients, crisp white type, lilac highlights."
        ),
        "moda_canvas": (
            "Moda-inspired canvas: bold dusk-to-violet gradients, high-contrast type, playful but premium accents; "
            "feels like an editable design surface (social + slides)."
        ),
        "studio_daylight": (
            "Bright studio daylight: airy off-white canvas, cool blue/indigo accents, generous whitespace, "
            "editorial SaaS polish (Gamma/Chronicle landing-page calm)."
        ),
    }

    design_prompt = f"""
    You are the Senior Layout Architect for presentation decks (investor, sales, marketing, education, and more).
    Map each slide to the most impactful UI layout. All copy must match the outline (no new domains or products).
    Deck profile: {founder_mode} — favor layouts that fit this profile (e.g. sales: proof + ROI; education: clarity + progression).
    Named slide archetype: {deck_archetype}. {archetype_hint}
    Theme pack: {resolved_theme}. {theme_rules.get(resolved_theme, theme_rules['neon_vc'])}
    Style direction: prioritize Chronicle-like editorial clarity, visual hierarchy, and graphic storytelling.
    Avoid forcing Anthill/Billion-Impact motifs unless theme_pack is explicitly 'anthill_reference'.

    EMOJI POLICY: Do NOT use slide-level decorative emoji. Leave `emoji_char` null.
    For `feature_grid` only, you may set `emoji` on individual `feature_cards` items (or `circle_emoji`)
    ONLY when it clarifies meaning (e.g. flag for a country); otherwise omit (null).

    LAYOUT RULES (follow strictly):
    1. 'disruptor' → Hero slide. REQUIRED if slide contains a % or $ over $100M. Extract `power_number`.
    2. 'scaling_machine' → 3-column grid. Provide exactly 3 `bullets`.
    3. 'data_pivot' → Before/after shift. Fill `comparison_shift` (old_way → new_way).
    4. 'roi_matrix' → Financial data table. Fill `metrics_table` with rows.
    5. 'feature_grid' → Use for ICP, persona, audience, billion-user segments, technology pillars, or four capabilities.
       REQUIRED fields (never leave empty): `grid_section_label`, `headline_prefix`, `headline_highlight`, `headline_suffix` (optional),
       `circle_stat` (short badge e.g. 4 PILLARS or a metric), `circle_label` (bold line under stat), `circle_footer` (one-line caption),
       optional `circle_emoji`, and exactly four `feature_cards` with non-empty title AND body each.
       `pexels_search_query` must match this slide's subject (e.g. abstract AI for an AI slide, not legal imagery unless the slide is about law).
    6. 'timeline_story' → Use for journey, roadmap, rollout, milestones, process sequence.
       REQUIRED: `story_steps` with 3-5 items in chronological order; each step has `label`, `title`, `detail`.
    7. 'spotlight_frame' → Use for thesis/vision/quote-led moments. REQUIRED: `main_text` plus 2-3 concise `bullets`.
    8. 'duo_cards' → Use for two-lens contrast. REQUIRED: fill `comparison_shift` as left vs right narrative.
    9. Layout diversity rule: avoid repetitive runs. Do not use the same `layout_type` for more than 2 consecutive slides.
       Across decks with 8+ slides, use at least 4 distinct layout types.
    10. Readability rule: text must remain clearly readable over backgrounds. Prefer high contrast and restrained overlays.
    11. For every slide, add `visual_seed` in 2-6 words for dramatic founder-grade visual texture.
    12. For every slide, set `pexels_search_query`: a short English phrase (2-8 words) that would find a matching stock photo on Pexels
       (abstract mood + scene, e.g. "dark abstract data visualization", "business team collaboration office").
       Align it with the slide thesis and theme pack. Avoid obscure proper nouns and brand names.
       Do NOT set `background_image_url` or other Pexels URL fields (server fills those).
    {locked_layout_rules}

    Slides:
    {slides_text}
    """
    cached_design = _read_cache(f"design::{design_prompt}")

    if cached_design:
        final_deck = PresentationDeck(**cached_design)
        if perf_log:
            print("[PERF] design phase: disk cache hit (skipping Gemini)")
    else:
        try:
            t1 = time.perf_counter()
            design_json = _call_with_rotation(
                prompt=design_prompt,
                schema=PresentationDeck,
                system_instruction=(
                    "Map content to layout schemas. Fill all layout-specific fields precisely. "
                    "Favor Chronicle-like editorial visual direction and clear contrast for readability. "
                    "Never use decorative emojis; feature_grid card emoji only when it adds meaning. "
                    "For feature_grid always fill circle_stat, circle_label, circle_footer, and four complete feature_cards. "
                    "For timeline_story always produce 3-5 ordered story_steps with label/title/detail. "
                    "For spotlight_frame always provide main_text and 2-3 bullets. "
                    "For duo_cards always provide comparison_shift with a crisp left-right contrast. "
                    "Keep layout variety across slides; avoid repetitive structure loops. "
                    "Always set pexels_search_query per slide for imagery aligned to that slide's topic; never invent image URLs."
                ),
                role="design",
            )
            if perf_log:
                print(f"[PERF] design API ({_get_design_model()}): {time.perf_counter() - t1:.2f}s")
            final_deck = PresentationDeck.model_validate_json(design_json)
            _write_cache(f"design::{design_prompt}", final_deck.model_dump())
        except Exception as design_error:
            print(f"[DESIGN FALLBACK] Gemini design mapping failed: {design_error}")
            final_deck = _build_resilient_design_fallback(raw_outline)

    final_deck = _post_process_deck_from_outline(raw_outline, final_deck)

    slides = strip_auto_slide_emojis(final_deck.slides)
    slides = clear_pexels_server_fields(slides)
    t_px = time.perf_counter()
    slides = attach_pexels_backgrounds(slides, prompt)
    if perf_log and (os.environ.get("PEXELS_API_KEY") or "").strip():
        print(f"[PERF] pexels backgrounds: {time.perf_counter() - t_px:.2f}s")
    if perf_log:
        print(f"[PERF] total generate_presentation_outline: {time.perf_counter() - wall_start:.2f}s")

    return final_deck.model_copy(
        update={
            "title": raw_outline.title,
            "slides": slides,
            "applied_theme_pack": resolved_theme,
            "generation_id": random.randint(1, 2_147_483_647),
        }
    )


def regenerate_slide(
    prompt: str,
    slide_index: int,
    existing_deck: dict,
    founder_mode: str = "fundraising",
    density: str = "balanced",
    theme_pack: str = "neon_vc",
    lock_layout: bool = False,
) -> PresentationDeck:
    deck = PresentationDeck(**existing_deck)
    if slide_index < 0 or slide_index >= len(deck.slides):
        raise Exception("Invalid slide index for regeneration.")

    target = deck.slides[slide_index]
    locked_instruction = (
        f"Keep layout_type fixed to '{target.layout_type}'." if lock_layout else
        "You may choose a better layout_type if needed."
    )
    regenerate_prompt = f"""
    Rebuild only one high-quality presentation slide for this prompt:
    {prompt}

    Slide title: {target.title}
    Current layout: {target.layout_type}
    Founder mode: {founder_mode}
    Density: {density}
    Theme pack: {theme_pack}
    Rule: {locked_instruction}
    Visual direction: Chronicle-like clarity, graphic storytelling, and strong text contrast.
    Set `pexels_search_query` (2-8 words) for a matching stock photo mood; do not set image URLs.
    """
    slide_json = _call_with_rotation(
        prompt=regenerate_prompt,
        schema=DesignedSlide,
        system_instruction=(
            "Generate a high-quality single slide in JSON. "
            "Respect layout-specific required fields and keep language concise. "
            "Include pexels_search_query for imagery; never invent image URLs."
        ),
        role="design",
    )
    rebuilt = DesignedSlide.model_validate_json(slide_json)
    if lock_layout:
        rebuilt.layout_type = target.layout_type
    rebuilt = rebuilt.model_copy(update={"emoji_char": None})
    rebuilt = clear_pexels_server_fields([rebuilt])[0]
    key = (os.environ.get("PEXELS_API_KEY") or "").strip()
    if key:
        data = pexels_service.fetch_background_for_slide(
            _compose_pexels_query(rebuilt, prompt, slide_index),
            key,
            slide_index=slide_index,
        )
        if data:
            rebuilt = rebuilt.model_copy(
                update={
                    "background_image_url": data["image_url"],
                    "pexels_photo_page_url": data.get("photo_page_url") or None,
                    "pexels_photographer": data.get("photographer") or None,
                    "pexels_photographer_url": data.get("photographer_url") or None,
                }
            )
    deck.slides[slide_index] = rebuilt
    return deck
