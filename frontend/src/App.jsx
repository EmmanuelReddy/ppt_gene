import React, { useState } from 'react';
import { Sparkles, FileText, Download, Loader2, ArrowRight, UploadCloud } from 'lucide-react';
import { generateContent, downloadPresentation, regenerateSlide } from './api';
import SlidePreview from './components/SlidePreview';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './ThemeContext';

function App() {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [outline, setOutline] = useState(null);
  const [error, setError] = useState('');
  const [founderMode, setFounderMode] = useState('fundraising');
  const [density, setDensity] = useState('balanced');
  const [themePack, setThemePack] = useState('random');
  const [lockedLayouts, setLockedLayouts] = useState({});
  const [regeneratingSlideIndex, setRegeneratingSlideIndex] = useState(null);
  const { theme } = useTheme();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError('');
    setOutline(null);

    try {
      const result = await generateContent(prompt, file, {
        founderMode,
        density,
        themePack,
        lockedLayouts,
      });
      setOutline(result);
    } catch (err) {
      setError(err.message || 'Failed to generate presentation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleLayoutLock = (slideIndex, currentLayout) => {
    setLockedLayouts((prev) => {
      if (prev[slideIndex]) {
        const next = { ...prev };
        delete next[slideIndex];
        return next;
      }
      return { ...prev, [slideIndex]: currentLayout };
    });
  };

  const handleRegenerateSlide = async (slideIndex) => {
    if (!outline) return;
    setRegeneratingSlideIndex(slideIndex);
    setError('');
    try {
      const updatedDeck = await regenerateSlide({
        prompt,
        slide_index: slideIndex,
        deck: outline,
        founder_mode: founderMode,
        density,
        theme_pack: outline.applied_theme_pack || themePack,
        lock_layout: Boolean(lockedLayouts[slideIndex]),
      });
      setOutline(updatedDeck);
    } catch (err) {
      setError(err.message || 'Failed to regenerate slide.');
    } finally {
      setRegeneratingSlideIndex(null);
    }
  };

  const handleDownload = async () => {
    if (!outline || !outline.slides) return;

    setIsDownloading(true);
    setError('');

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await new Promise((r) => {
        requestAnimationFrame(() => requestAnimationFrame(r));
      });

      const { default: html2canvas } = await import('html2canvas');
      const images = [];

      const waitForImages = (root) => {
        const imgs = root.querySelectorAll('img');
        return Promise.all(
          Array.from(imgs).map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete && img.naturalHeight > 0) {
                  resolve();
                  return;
                }
                const done = () => resolve();
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
              })
          )
        );
      };

      for (let i = 0; i < outline.slides.length; i++) {
        const slideEl = document.getElementById(`slide-${i}`);
        if (slideEl) {
          slideEl.scrollIntoView({ block: 'nearest' });
          await waitForImages(slideEl);
          await new Promise((r) => requestAnimationFrame(r));

          const canvas = await html2canvas(slideEl, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: null,
            imageTimeout: 20000,
            foreignObjectRendering: false,
            ignoreElements: (el) => {
              try {
                return typeof el?.closest === 'function' && Boolean(el.closest('.slide-export-ignore'));
              } catch {
                return false;
              }
            },
          });
          images.push(canvas.toDataURL('image/png'));
        }
      }

      await downloadPresentation(outline.title, images);
    } catch (err) {
      setError(err.message || 'Failed to export presentation components.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme} bg-theme-primary flex flex-col relative overflow-hidden transition-colors duration-300`}>
      <ThemeToggle />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col items-center justify-start z-10 relative">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="text-center w-full max-w-3xl mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-secondary/80 border border-glass text-sm text-brand-600 dark:text-brand-100 mb-6 backdrop-blur-sm shadow-sm relative z-10">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span className="font-medium tracking-wide">Founder-First AI Pitch Deck Builder</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 font-display drop-shadow-md">
            Founder Narrative <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-orange-400">
              meets Investor-Grade Design
            </span>
          </h1>
          <p className="text-xl text-gray-300 font-sans max-w-2xl mx-auto tracking-wide">
            Share your startup story or attach a file. We generate dark-theme, capital-efficient decks with cleaner structure and stronger visual hierarchy.
          </p>
        </div>

        <div className="w-full max-w-3xl animate-fade-in mb-16 relative z-10" style={{ animationDelay: '0.2s' }}>
          <form onSubmit={handleGenerate} className="glass-panel rounded-2xl p-3 flex flex-col gap-3 transition-all focus-within:border-brand-500/50 focus-within:shadow-[0_0_30px_rgba(32,178,170,0.2)] bg-theme-secondary/95">
            <div className="flex flex-col sm:flex-row gap-3 w-full min-h-[140px]">
              <div className={`sm:w-1/3 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors relative overflow-hidden ${file ? 'border-brand-500 bg-brand-500/5' : 'border-glass hover:border-brand-500/50'}`}>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept=".pdf,.pptx"
                />
                <UploadCloud className={`w-8 h-8 mx-auto mb-3 transition-colors ${file ? 'text-brand-500' : 'text-gray-400'}`} />
                <span className="text-sm font-semibold text-white mb-1 relative z-0">
                  {file ? file.name : "Inject Thesis Data"}
                </span>
                {!file && (
                  <span className="text-xs text-gray-400 relative z-0">(Optional) PDF, PPTX</span>
                )}
              </div>

              <div className="flex-1 flex flex-col bg-theme-primary/40 rounded-xl">
                 <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Map out a 10-slide VC Pitch highlighting our unit economic scaling... "
                  className="w-full h-full bg-transparent border-0 text-white placeholder:text-gray-500 resize-none p-5 focus:ring-0 outline-none text-lg font-sans"
                 />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-1">
              <select
                value={founderMode}
                onChange={(e) => setFounderMode(e.target.value)}
                className="bg-theme-primary/60 border border-glass rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="fundraising">Founder Mode: Fundraising</option>
                <option value="gtm_narrative">Founder Mode: GTM Narrative</option>
                <option value="product_traction">Founder Mode: Product + Traction</option>
              </select>

              <select
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className="bg-theme-primary/60 border border-glass rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="concise">Density: Concise</option>
                <option value="balanced">Density: Balanced</option>
                <option value="detailed">Density: Detailed</option>
              </select>

              <select
                value={themePack}
                onChange={(e) => setThemePack(e.target.value)}
                className="bg-theme-primary/60 border border-glass rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="random">Theme: Random (new palette each run)</option>
                <option value="variety">Theme: Mix (rotate per slide)</option>
                <option value="neon_vc">Theme: Neon VC (teal)</option>
                <option value="ember_capital">Theme: Ember Capital (warm)</option>
                <option value="midnight_data">Theme: Midnight Data (blue)</option>
                <option value="aurora_violet">Theme: Aurora (violet / pink)</option>
                <option value="forest_gold">Theme: Forest &amp; Gold</option>
                <option value="sunset_rose">Theme: Sunset Rosé</option>
                <option value="carbon_amber">Theme: Carbon &amp; Amber</option>
                <option value="ocean_mint">Theme: Ocean Mint</option>
                <option value="anthill_reference">Theme: Reference (light VC)</option>
                <option value="gamma_mosaic">Theme: Gamma Mosaic (editorial)</option>
                <option value="canva_pop">Theme: Canva Pop (light)</option>
                <option value="chronicle_paper">Theme: Chronicle Paper (light)</option>
                <option value="modal_dusk">Theme: Modal Dusk (purple)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full shadow-[0_0_20px_rgba(32,178,170,0.4)] tracking-wide"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mining Intelligence...
                  </>
                ) : (
                  <>
                    Synthesize Pitch Deck <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm flex items-center justify-center font-medium shadow-sm">
              {error}
            </div>
          )}
        </div>

        {outline && (
          <div className="w-full mt-4 animate-slide-up relative z-10 w-full mb-16">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-glass gap-4">
              <div>
                <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3 drop-shadow-md">
                  <FileText className="w-7 h-7 text-brand-500" />
                  {outline.title.toUpperCase()}
                </h2>
                <p className="text-gray-400 mt-3 text-lg font-sans">
                  {outline.slides.length} slides · Applied theme:{' '}
                  <span className="text-brand-400 font-medium">
                    {(outline.applied_theme_pack || themePack || '').replace(/_/g, ' ')}
                  </span>
                  {outline.generation_id != null && (
                    <span className="text-gray-500 text-sm ml-2">#{outline.generation_id}</span>
                  )}
                </p>
              </div>
              
              <button
                 onClick={handleDownload}
                 disabled={isDownloading}
                 className="px-8 py-4 rounded-xl bg-theme-primary/90 text-white border-2 border-glass hover:border-brand-500 hover:bg-theme-secondary font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl min-w-[220px]"
              >
                 {isDownloading ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                   <Download className="w-5 h-5 text-brand-500" />
                 )}
                 {isDownloading ? 'Rendering Data Layers...' : 'Export to PPTX'}
              </button>
            </div>

            <SlidePreview
              outline={outline}
              themePack={outline.applied_theme_pack || themePack}
              generationId={outline.generation_id ?? 0}
              lockedLayouts={lockedLayouts}
              onToggleLayoutLock={handleToggleLayoutLock}
              onRegenerateSlide={handleRegenerateSlide}
              isRegeneratingSlide={regeneratingSlideIndex}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
