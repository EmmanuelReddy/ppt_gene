import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  FileText,
  Download,
  Loader2,
  ArrowRight,
  UploadCloud,
  Layers,
  LayoutGrid,
  Share2,
} from 'lucide-react';
import { generateContent, downloadPresentation, regenerateSlide } from './api';
import SlidePreview from './components/SlidePreview';
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
  const [deckArchetype, setDeckArchetype] = useState('auto');
  const [lockedLayouts, setLockedLayouts] = useState({});
  const [regeneratingSlideIndex, setRegeneratingSlideIndex] = useState(null);
  const { theme, motionMode } = useTheme();
  const isLight = theme === 'aurora-frost';
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || motionMode === 'reduced') return;
    const onMove = (event) => {
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--mx', `${x.toFixed(2)}%`);
      el.style.setProperty('--my', `${y.toFixed(2)}%`);
      el.style.setProperty('--px', `${nx.toFixed(4)}`);
      el.style.setProperty('--py', `${ny.toFixed(4)}`);
    };
    const onLeave = () => {
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '45%');
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [motionMode]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (motionMode === 'reduced') return;
    root.classList.add('motion-enhanced');

    const revealTargets = Array.from(root.querySelectorAll('.reveal-on-scroll'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' }
    );
    revealTargets.forEach((el) => observer.observe(el));

    const magneticNodes = Array.from(root.querySelectorAll('.magnetic'));
    const cleanups = magneticNodes.map((node) => {
      const onMove = (e) => {
        const rect = node.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        node.style.setProperty('--tx', `${(x * 10).toFixed(2)}px`);
        node.style.setProperty('--ty', `${(y * 8).toFixed(2)}px`);
      };
      const onLeave = () => {
        node.style.setProperty('--tx', '0px');
        node.style.setProperty('--ty', '0px');
      };
      node.addEventListener('pointermove', onMove);
      node.addEventListener('pointerleave', onLeave);
      return () => {
        node.removeEventListener('pointermove', onMove);
        node.removeEventListener('pointerleave', onLeave);
      };
    });

    return () => {
      root.classList.remove('motion-enhanced');
      observer.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, [motionMode]);

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
        deckArchetype,
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

  const heroTitleClass = isLight
    ? 'text-slate-900'
    : 'text-white';
  const heroMutedClass = isLight ? 'text-slate-600' : 'text-gray-300';
  const accentGradient = isLight
    ? 'from-teal-600 to-indigo-600'
    : 'from-brand-500 to-orange-400';

  return (
    <div
      ref={rootRef}
      className={`min-h-screen ${theme} bg-theme-primary flex flex-col relative overflow-hidden transition-colors duration-300`}
      style={{ '--mx': '50%', '--my': '45%', '--px': '0', '--py': '0' }}
    >
      <div className="interactive-grid-bg" />
      <div className={`hero-parallax-layer layer-a ${isLight ? 'is-light' : ''}`} />
      <div className={`hero-parallax-layer layer-b ${isLight ? 'is-light' : ''}`} />
      <div className={`hero-parallax-layer layer-c ${isLight ? 'is-light' : ''}`} />
      <div className={`interactive-cursor-glow ${isLight ? 'is-light' : ''}`} />
      <div className={`hero-orb hero-orb-a ${isLight ? 'is-light' : ''}`} />
      <div className={`hero-orb hero-orb-b ${isLight ? 'is-light' : ''}`} />

      <header className="w-full max-w-6xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between gap-4 z-20 relative">
        <a href="/" className="flex items-center gap-2 group">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-teal-600 text-white' : 'bg-brand-600/90 text-white'
            } shadow-lg`}
          >
            <Layers className="w-5 h-5" aria-hidden />
          </span>
          <span className={`font-display font-bold text-lg tracking-tight ${heroTitleClass}`}>
            Deck Studio
          </span>
        </a>
        <span
          className={`text-xs md:text-sm px-3 py-1.5 rounded-full border ${
            isLight ? 'bg-white/80 border-slate-200 text-slate-600' : 'bg-white/[0.03] border-white/10 text-gray-300'
          }`}
        >
          AI presentation studio
        </span>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-6 md:py-10 flex flex-col items-center justify-start z-10 relative">
        <div
          className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full blur-[120px] pointer-events-none ${
            isLight ? 'bg-teal-400/15' : 'bg-brand-600/20'
          }`}
        />
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none ${
            isLight ? 'bg-indigo-400/10' : 'bg-brand-500/10'
          }`}
        />

        {!outline && (
          <>
            <div className="text-center w-full max-w-3xl mb-10 md:mb-14 animate-slide-up reveal-on-scroll">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm mb-6 backdrop-blur-sm shadow-sm relative z-10 floating-chip ${
                  isLight
                    ? 'bg-white/90 border-slate-200 text-teal-700'
                    : 'bg-theme-secondary/80 border-glass text-brand-600 dark:text-brand-100'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-brand-500'}`} />
                <span className="font-medium tracking-wide">AI layouts, themes & export — one flow</span>
              </div>
              <h1
                className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-display drop-shadow-sm ${heroTitleClass}`}
              >
                Presentations that feel{' '}
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${accentGradient}`}>
                  designed — not templated
                </span>
              </h1>
              <p className={`text-lg md:text-xl max-w-2xl mx-auto tracking-wide leading-relaxed ${heroMutedClass}`}>
                Start from a prompt or document. Choose a narrative profile and visual theme, then get slides with
                strong hierarchy, optional stock imagery, and a clean export path — inspired by the polish of modern
                deck tools, tuned for your topic (not one fixed VC story).
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {['Chronicle-grade clarity', 'Canvas-style visuals', 'Interactive workflow'].map((item) => (
                  <span
                    key={item}
                    className={`rounded-full px-4 py-2 text-xs md:text-sm border ${
                      isLight
                        ? 'bg-white/85 border-slate-200 text-slate-700'
                        : 'bg-white/[0.04] border-white/10 text-gray-300'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <section
              id="features"
              className="w-full max-w-5xl mb-14 md:mb-20 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in reveal-on-scroll"
              style={{ animationDelay: '0.1s' }}
            >
              {[
                {
                  icon: UploadCloud,
                  title: 'Start from anywhere',
                  body: 'Paste notes, an outline, or upload PDF / PPTX so the model grounds copy in your material.',
                },
                {
                  icon: LayoutGrid,
                  title: 'Flexible structure',
                  body: 'Pick sales, marketing, research, education, and more — slide arcs adapt to the profile.',
                },
                {
                  icon: Share2,
                  title: 'Share-ready output',
                  body: 'Preview in the browser, lock layouts per slide, regenerate, then export to PowerPoint.',
                },
              ].map((feature) => {
                const Ico = feature.icon;
                return (
                <div
                  key={feature.title}
                  className={`rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg futuristic-card magnetic ${
                    isLight
                      ? 'bg-white border-slate-200/80 shadow-sm hover:border-teal-200'
                      : 'glass-card border-glass bg-theme-secondary/40'
                  }`}
                >
                  <Ico
                    className={`w-8 h-8 mb-4 ${isLight ? 'text-teal-600' : 'text-brand-500'}`}
                    strokeWidth={1.75}
                  />
                  <h2 className={`font-display font-bold text-lg mb-2 ${heroTitleClass}`}>{feature.title}</h2>
                  <p className={`text-sm leading-relaxed ${heroMutedClass}`}>{feature.body}</p>
                </div>
                );
              })}
            </section>
          </>
        )}

        <div
          id="create"
          className="w-full max-w-3xl animate-fade-in mb-16 relative z-10 scroll-mt-20"
          style={{ animationDelay: outline ? '0s' : '0.2s' }}
        >
          {!outline && (
            <h2 className={`font-display font-bold text-2xl mb-4 text-center ${heroTitleClass}`}>
              Create your deck
            </h2>
          )}
          <form
            onSubmit={handleGenerate}
            className={`glass-panel rounded-2xl p-3 flex flex-col gap-3 transition-all focus-within:border-brand-500/50 focus-within:shadow-[0_0_30px_rgba(32,178,170,0.2)] ${
              isLight ? 'bg-white/95 border-slate-200' : 'bg-theme-secondary/95'
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-3 w-full min-h-[140px]">
              <div
                className={`sm:w-1/3 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors relative overflow-hidden ${
                  file
                    ? isLight
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-brand-500 bg-brand-500/5'
                    : isLight
                      ? 'border-slate-300 hover:border-teal-400'
                      : 'border-glass hover:border-brand-500/50'
                }`}
              >
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept=".pdf,.pptx"
                />
                <UploadCloud
                  className={`w-8 h-8 mx-auto mb-3 transition-colors ${
                    file
                      ? isLight
                        ? 'text-teal-600'
                        : 'text-brand-500'
                      : isLight
                        ? 'text-slate-400'
                        : 'text-gray-400'
                  }`}
                />
                <span className={`text-sm font-semibold mb-1 relative z-0 ${heroTitleClass}`}>
                  {file ? file.name : 'Add source file'}
                </span>
                {!file && (
                  <span className={`text-xs relative z-0 ${heroMutedClass}`}>(Optional) PDF, PPTX</span>
                )}
              </div>

              <div
                className={`flex-1 flex flex-col rounded-xl ${
                  isLight ? 'bg-slate-50/80' : 'bg-theme-primary/40'
                }`}
              >
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Q1 business review for our B2B SaaS — wins, KPIs, blockers, next quarter priorities…"
                  className={`w-full h-full bg-transparent border-0 resize-none p-5 focus:ring-0 outline-none text-lg font-sans placeholder:text-slate-400 ${
                    isLight ? 'text-slate-900' : 'text-white placeholder:text-gray-500'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-1">
              <select
                value={founderMode}
                onChange={(e) => setFounderMode(e.target.value)}
                className={`rounded-lg px-3 py-2 text-sm border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900'
                    : 'bg-theme-primary/60 border-glass text-white'
                }`}
              >
                <optgroup label="Venture &amp; product">
                  <option value="fundraising">Narrative: Fundraising</option>
                  <option value="gtm_narrative">Narrative: GTM</option>
                  <option value="product_traction">Narrative: Product &amp; traction</option>
                </optgroup>
                <optgroup label="Go-to-market &amp; ops">
                  <option value="enterprise_sales">Narrative: Enterprise sales</option>
                  <option value="marketing_launch">Narrative: Marketing launch</option>
                  <option value="quarterly_review">Narrative: Quarterly review</option>
                </optgroup>
                <optgroup label="Story &amp; depth">
                  <option value="product_roadmap">Narrative: Roadmap &amp; delivery</option>
                  <option value="research_report">Narrative: Research report</option>
                  <option value="education">Narrative: Education / training</option>
                  <option value="brand_story">Narrative: Brand story</option>
                </optgroup>
              </select>

              <select
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className={`rounded-lg px-3 py-2 text-sm border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900'
                    : 'bg-theme-primary/60 border-glass text-white'
                }`}
              >
                <option value="concise">Density: Concise</option>
                <option value="balanced">Density: Balanced</option>
                <option value="detailed">Density: Detailed</option>
              </select>

              <select
                value={deckArchetype}
                onChange={(e) => setDeckArchetype(e.target.value)}
                className={`rounded-lg px-3 py-2 text-sm border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900'
                    : 'bg-theme-primary/60 border-glass text-white'
                }`}
              >
                <option value="auto">Archetype: Auto</option>
                <option value="title_agenda_deepdive_cta">Archetype: Title → Agenda → Deep dive → CTA</option>
                <option value="problem_solution_traction_ask">Archetype: Problem → Solution → Traction → Ask</option>
                <option value="story_timeline">Archetype: Story timeline</option>
                <option value="report_brief">Archetype: Report brief</option>
                <option value="workshop_lesson">Archetype: Workshop lesson</option>
              </select>

              <select
                value={themePack}
                onChange={(e) => setThemePack(e.target.value)}
                className={`rounded-lg px-3 py-2 text-sm border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900'
                    : 'bg-theme-primary/60 border-glass text-white'
                }`}
              >
                <option value="random">Theme: Random</option>
                <option value="variety">Theme: Mix (per slide)</option>
                <option value="neon_vc">Theme: Neon VC</option>
                <option value="ember_capital">Theme: Ember Capital</option>
                <option value="midnight_data">Theme: Midnight Data</option>
                <option value="aurora_violet">Theme: Aurora</option>
                <option value="forest_gold">Theme: Forest &amp; Gold</option>
                <option value="sunset_rose">Theme: Sunset Rosé</option>
                <option value="carbon_amber">Theme: Carbon &amp; Amber</option>
                <option value="ocean_mint">Theme: Ocean Mint</option>
                <option value="anthill_reference">Theme: Light VC</option>
                <option value="gamma_mosaic">Theme: Gamma Mosaic</option>
                <option value="canva_pop">Theme: Canva Pop</option>
                <option value="chronicle_paper">Theme: Chronicle Paper</option>
                <option value="modal_dusk">Theme: Modal Dusk</option>
                <option value="moda_canvas">Theme: Moda Canvas</option>
                <option value="studio_daylight">Theme: Studio Daylight</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className={`px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full tracking-wide shadow-lg pulse-button magnetic ${
                  isLight
                    ? 'bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white'
                    : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-[0_0_20px_rgba(32,178,170,0.4)]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    Generate deck <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
          {error && (
            <div
              className={`mt-6 p-4 rounded-xl border text-sm flex items-center justify-center font-medium shadow-sm ${
                isLight
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {error}
            </div>
          )}
        </div>

        {outline && (
          <div className="w-full mt-4 animate-slide-up relative z-10 w-full mb-16 reveal-on-scroll">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-glass gap-4">
              <div>
                <h2
                  className={`text-2xl md:text-3xl font-display font-bold flex items-center gap-3 drop-shadow-md ${heroTitleClass}`}
                >
                  <FileText className={`w-7 h-7 ${isLight ? 'text-teal-600' : 'text-brand-500'}`} />
                  {outline.title.toUpperCase()}
                </h2>
                <p className={`mt-3 text-lg font-sans ${heroMutedClass}`}>
                  {outline.slides.length} slides · Theme:{' '}
                  <span className={isLight ? 'text-teal-700 font-medium' : 'text-brand-400 font-medium'}>
                    {(outline.applied_theme_pack || themePack || '').replace(/_/g, ' ')}
                  </span>
                  {outline.generation_id != null && (
                    <span className={`text-sm ml-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                      #{outline.generation_id}
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl min-w-[220px] border-2 magnetic ${
                  isLight
                    ? 'bg-white text-slate-900 border-slate-200 hover:border-teal-500 hover:bg-slate-50'
                    : 'bg-theme-primary/90 text-white border-glass hover:border-brand-500 hover:bg-theme-secondary'
                }`}
              >
                {isDownloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className={`w-5 h-5 ${isLight ? 'text-teal-600' : 'text-brand-500'}`} />
                )}
                {isDownloading ? 'Rendering…' : 'Export to PPTX'}
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

      <footer
        className={`w-full max-w-6xl mx-auto px-6 py-10 mt-auto border-t border-glass/50 ${
          isLight ? 'border-slate-200 text-slate-500' : 'text-gray-500'
        }`}
      >
        <p className="text-sm text-center">
          Deck Studio — structured layouts, premium motion interactions, and reliable export for professional decks.
        </p>
      </footer>
    </div>
  );
}

export default App;
