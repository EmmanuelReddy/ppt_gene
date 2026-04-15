from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
from dotenv import load_dotenv
import os
import shutil

import ai_service
import generator

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Pitch Deck Generator (Text/Data First)")

# Comma-separated origins for deployed frontend(s), e.g.
# FRONTEND_ORIGINS=https://your-frontend.onrender.com,https://www.yourdomain.com
raw_origins = (os.getenv("FRONTEND_ORIGINS") or "").strip()
env_origins = [o.strip().rstrip("/") for o in raw_origins.split(",") if o.strip()]
default_local_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
allow_origins = env_origins if env_origins else default_local_origins

# Configure CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    # Keep localhost regex only for local-dev convenience when using default origins.
    allow_origin_regex=None if env_origins else r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"],
)

@app.post("/api/generate-content")
async def generate_content(
    prompt: str = Form(...),
    founder_mode: str = Form("fundraising"),
    density: str = Form("balanced"),
    theme_pack: str = Form("random"),
    deck_archetype: str = Form("auto"),
    locked_layouts: str = Form(""),
    file: UploadFile = File(None)
):
    try:
        if not prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
        file_path = None
        if file and file.filename:
            # Save uploaded file to temp path
            upload_dir = "uploads"
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
        # Generate complete deck mapping locally through Gemini (Content + Design Dual-Pass)
        parsed_locked_layouts: Optional[Dict[int, str]] = None
        if locked_layouts.strip():
            import json
            loaded = json.loads(locked_layouts)
            parsed_locked_layouts = {int(k): v for k, v in loaded.items()}

        outline = ai_service.generate_presentation_outline(
            prompt=prompt,
            file_path=file_path,
            founder_mode=founder_mode,
            density=density,
            theme_pack=theme_pack,
            deck_archetype=deck_archetype,
            locked_layouts=parsed_locked_layouts,
        )
        
        # Cleanup
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            
        return outline
    except Exception as e:
        import traceback
        traceback.print_exc()
        err = str(e).lower()
        if "429" in err or "resource_exhausted" in err or "quota" in err:
            raise HTTPException(
                status_code=429,
                detail="Gemini rate limit reached. Please retry in a few seconds."
            )
        raise HTTPException(status_code=500, detail=str(e))

class DownloadRequest(BaseModel):
    title: str = "Pitch_Deck"
    images: List[str]


class RegenerateSlideRequest(BaseModel):
    prompt: str
    slide_index: int
    deck: dict
    founder_mode: str = "fundraising"
    density: str = "balanced"
    theme_pack: str = "neon_vc"
    lock_layout: bool = False

@app.post("/api/download-pptx")
def download_pptx(req: DownloadRequest):
    try:
        if not req.images:
            raise HTTPException(status_code=400, detail="No payload images provided for presentation.")
            
        ppt_stream = generator.create_presentation_from_images(req.images)
        
        filename = req.title.replace(" ", "_").lower() + ".pptx"
        
        return StreamingResponse(
            ppt_stream,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"Error generating pptx: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/regenerate-slide")
def regenerate_slide(req: RegenerateSlideRequest):
    try:
        updated = ai_service.regenerate_slide(
            prompt=req.prompt,
            slide_index=req.slide_index,
            existing_deck=req.deck,
            founder_mode=req.founder_mode,
            density=req.density,
            theme_pack=req.theme_pack,
            lock_layout=req.lock_layout,
        )
        return updated
    except Exception as e:
        err = str(e).lower()
        if "429" in err or "resource_exhausted" in err or "quota" in err:
            raise HTTPException(status_code=429, detail="Gemini rate limit reached during slide regeneration.")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
