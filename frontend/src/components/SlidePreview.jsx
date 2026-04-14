import React from 'react';
import { Network, Database, Zap, ArrowRightCircle, TrendingUp } from 'lucide-react';
import { resolveSlideTheme, getSlideBackgroundImgSrc } from '../theme/slideThemes';

const SlidePreview = ({
  outline,
  themePack = 'neon_vc',
  generationId = 0,
  lockedLayouts = {},
  onToggleLayoutLock,
  onRegenerateSlide,
  isRegeneratingSlide = null,
}) => {
  if (!outline || !outline.slides) return null;

  const hasPexelsBg = outline.slides?.some((s) => s.background_image_url);

  return (
    <div className="flex flex-col gap-16 w-full max-w-5xl mx-auto pb-16">
      {outline.slides.map((slide, index) => (
        <SlideCard
          key={`${generationId}-${index}-${slide.title}`}
          slide={slide}
          index={index}
          themePack={themePack}
          generationId={generationId}
          isLocked={Boolean(lockedLayouts[index])}
          onToggleLayoutLock={onToggleLayoutLock}
          onRegenerateSlide={onRegenerateSlide}
          isRegenerating={isRegeneratingSlide === index}
        />
      ))}
      {hasPexelsBg && (
        <p className="text-center text-xs text-gray-500 -mt-8">
          <a
            href="https://www.pexels.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brand-400"
          >
            Photos provided by Pexels
          </a>
        </p>
      )}
    </div>
  );
};

const SlideCard = ({
  slide,
  index,
  themePack,
  generationId = 0,
  isLocked,
  onToggleLayoutLock,
  onRegenerateSlide,
  isRegenerating,
}) => {
  const layout = slide.layout_type || 'disruptor';
  const tokens = resolveSlideTheme(themePack, index);
  const visualSeed = slide.visual_seed || `${slide.title || 'Founder Deck'} momentum`;
  const isFeatureGrid = layout === 'feature_grid';
  const photoUrl = slide.background_image_url;
  const usePhotoBg = Boolean(photoUrl);
  const useEditorialCanvas = isFeatureGrid && tokens.featureGridCanvas && !usePhotoBg;
  const svgBgSrc =
    !usePhotoBg && !useEditorialCanvas ? getSlideBackgroundImgSrc(visualSeed, layout, tokens) : null;
  const light = tokens.isLight;
  const frameBg =
    usePhotoBg
      ? '#0a0a0b'
      : useEditorialCanvas
        ? tokens.featureGridCanvas
        : light
          ? tokens.canvasBg || '#ebe8e4'
          : tokens.canvasBg || '#0A0A0B';
  const radiusClass = ['rounded-2xl', 'rounded-[1.35rem]', 'rounded-3xl'][
    (index + (generationId % 97)) % 3
  ];
  const frameClass = light
    ? 'border border-gray-200/80 shadow-xl ring-1 ring-black/5'
    : 'border border-white/10 shadow-2xl ring-1 ring-white/[0.06]';

  return (
    <div
      id={`slide-${index}`}
      className={`w-full aspect-video overflow-hidden flex flex-col relative group transition-all duration-500 isolate ${radiusClass} ${frameClass}`}
      style={{ background: frameBg }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
        {usePhotoBg && (
          <>
            <img
              alt=""
              src={photoUrl}
              crossOrigin="anonymous"
              decoding="async"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: light
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.45) 45%, rgba(250,250,249,0.75) 100%)'
                  : 'linear-gradient(135deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.72) 100%)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/5" />
          </>
        )}
        {!usePhotoBg && !useEditorialCanvas && svgBgSrc && (
          <img
            alt=""
            src={svgBgSrc}
            decoding="async"
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${light ? 'opacity-95' : 'opacity-70'}`}
          />
        )}
        {!usePhotoBg && !light && !useEditorialCanvas && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/45 to-black/70" />
        )}
        {!usePhotoBg && light && !useEditorialCanvas && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-amber-50/20" />
        )}
        {!usePhotoBg && useEditorialCanvas && (
          <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-white/10" />
        )}
      </div>

      <div className="slide-export-ignore absolute top-4 left-4 z-[110] flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleLayoutLock && onToggleLayoutLock(index, layout)}
          className={`text-xs px-3 py-1 rounded-full border transition ${
            light
              ? isLocked
                ? 'bg-orange-100 border-orange-400 text-orange-900'
                : 'bg-white/90 border-gray-300 text-gray-700'
              : isLocked
                ? 'bg-brand-500/20 border-brand-500 text-brand-100'
                : 'bg-black/50 border-white/10 text-gray-300'
          }`}
        >
          {isLocked ? 'Layout Locked' : 'Lock Layout'}
        </button>
        <button
          type="button"
          onClick={() => onRegenerateSlide && onRegenerateSlide(index)}
          className={`text-xs px-3 py-1 rounded-full border ${
            light ? 'border-gray-300 bg-white/90 text-gray-800' : 'border-white/10 bg-black/50 text-gray-200'
          }`}
          disabled={isRegenerating}
        >
          {isRegenerating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {/* Layout label on hover — omitted from PPTX raster */}
      <div
        className={`slide-export-ignore absolute top-4 right-4 text-xs font-mono px-3 py-1 rounded-full z-[100] shadow-sm backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity ${
          light ? 'text-orange-700 bg-white/90 border border-orange-200' : 'bg-black/80 border border-white/5'
        }`}
        style={!light ? { color: tokens.accent } : undefined}
      >
        {tokens.id?.replace(/_/g, ' ').toUpperCase()} · {layout.toUpperCase()} · Slide {index + 1}
      </div>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        {layout === 'disruptor'       && <DisruptorSlide slide={slide} tokens={tokens} />}
        {layout === 'scaling_machine' && <ScalingMachineSlide slide={slide} tokens={tokens} />}
        {layout === 'data_pivot'      && <DataPivotSlide slide={slide} tokens={tokens} />}
        {layout === 'roi_matrix'      && <ROIMatrixSlide slide={slide} tokens={tokens} />}
        {layout === 'feature_grid'    && <FeatureGridSlide slide={slide} tokens={tokens} />}

        {!['disruptor', 'scaling_machine', 'data_pivot', 'roi_matrix', 'feature_grid'].includes(layout) && (
          <DisruptorSlide slide={slide} tokens={tokens} />
        )}
      </div>

      {usePhotoBg && slide.pexels_photographer && (
        <a
          href={slide.pexels_photo_page_url || 'https://www.pexels.com'}
          target="_blank"
          rel="noopener noreferrer"
          className={`absolute bottom-3 right-3 z-[120] max-w-[min(100%,14rem)] text-right text-[10px] leading-tight drop-shadow-md ${
            light ? 'text-gray-800/90 hover:text-gray-950' : 'text-white/85 hover:text-white'
          }`}
        >
          Photo by {slide.pexels_photographer} on Pexels
        </a>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   1. DISRUPTOR — Hero metric (theme tokens drive color / glow)
───────────────────────────────────────────────────── */
const DisruptorSlide = ({ slide, tokens }) => {
  const light = tokens.isLight;
  const rgb = tokens.accentRgb || '32,178,170';

  return (
    <div className="relative flex min-h-0 h-full w-full flex-col items-center justify-center overflow-hidden p-12 text-center z-10">
      {!light && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(${rgb},0.14), transparent)`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 30% 30% at 50% 50%, rgba(${rgb},0.07), transparent)`,
            }}
          />
        </>
      )}
      {light && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_40%,rgba(234,88,12,0.08),transparent)] pointer-events-none" />
      )}

      <div
        className="absolute top-0 left-0 w-full h-[2px] pointer-events-none"
        style={
          light
            ? { background: 'linear-gradient(90deg, transparent, #ea580c, transparent)' }
            : { background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)` }
        }
      />

      {slide.power_number && (
        <div
          className={
            light
              ? 'font-serif font-bold text-orange-600 mb-6 leading-none tracking-tight drop-shadow-sm'
              : 'font-display font-black mb-6 leading-none tracking-tight'
          }
          style={
            light
              ? { fontSize: 'clamp(4rem, 10vw, 7rem)' }
              : {
                  fontSize: 'clamp(5rem, 12vw, 9rem)',
                  ...tokens.power,
                }
          }
        >
          {slide.power_number}
        </div>
      )}

      <h2
        className={`mb-6 font-extrabold uppercase tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] ${tokens.titleClass || 'font-display text-white'}`}
        style={{ fontSize: 'clamp(1.2rem, 3vw, 2.2rem)', flexWrap: 'nowrap' }}
      >
        {slide.title}
      </h2>

      {slide.main_text && (
        <p
          className={`font-sans max-w-2xl leading-relaxed ${tokens.bodyMuted || 'text-gray-400'}`}
          style={{ fontSize: 'clamp(1rem, 2vw, 1.4rem)' }}
        >
          {slide.main_text}
        </p>
      )}

      <div
        className="absolute bottom-6 left-8 w-12 h-12 border-l-2 border-b-2"
        style={light ? { borderColor: 'rgb(253 186 170)' } : { borderColor: `rgba(${rgb},0.35)` }}
      />
      <div
        className="absolute top-6 right-8 w-12 h-12 border-r-2 border-t-2"
        style={light ? { borderColor: 'rgb(253 186 170)' } : { borderColor: `rgba(${rgb},0.35)` }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   2. SCALING MACHINE — 3-Column Service Blocks
───────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────
   FEATURE GRID — Persona / audience (Gamma / editorial)
───────────────────────────────────────────────────── */
const FeatureGridSlide = ({ slide, tokens }) => {
  const light = tokens.isLight;
  const rgb = tokens.accentRgb || '251,146,60';
  const raw = slide.feature_cards || [];
  const cards = [];
  for (let i = 0; i < 4; i++) {
    const c = raw[i];
    if (c) {
      cards.push({
        title: c.title,
        body: c.body,
        emoji: c.emoji || null,
      });
    } else {
      cards.push({
        title: `Pillar ${i + 1}`,
        body: slide.main_text || '—',
        emoji: null,
      });
    }
  }
  const gridLabel = slide.grid_section_label || 'MARKET';
  const prefix = slide.headline_prefix || '';
  const highlight = slide.headline_highlight || '';
  const suffix = slide.headline_suffix || '';
  const useSplitHeadline = prefix || highlight || suffix;
  const circleStat =
    (slide.circle_stat && String(slide.circle_stat).trim()) ||
    (slide.title ? slide.title.split(/\s+/).slice(0, 2).join(' ').toUpperCase() : 'FOCUS');
  const circleLabel =
    (slide.circle_label && String(slide.circle_label).trim()) || gridLabel || 'STRATEGY';
  const circleFooter =
    (slide.circle_footer && String(slide.circle_footer).trim()) ||
    (slide.main_text ? String(slide.main_text).slice(0, 160) : '');

  return (
    <div className="relative flex min-h-0 h-full w-full flex-row gap-6 px-8 py-6 z-10">
      <div className="flex w-[32%] min-w-0 max-w-[36%] shrink-0 flex-col items-center justify-center self-center">
        <div
          className="relative flex flex-col items-center justify-center rounded-full w-44 h-44 sm:w-52 sm:h-52 border-2 p-4 text-center"
          style={{
            borderColor: `rgba(${rgb},0.85)`,
            boxShadow: light
              ? '0 0 0 1px rgba(0,0,0,0.06), 0 20px 50px rgba(0,0,0,0.08)'
              : `0 0 40px rgba(${rgb},0.25), inset 0 0 60px rgba(0,0,0,0.35)`,
            background: light ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.35)',
          }}
        >
          {slide.circle_emoji && (
            <span className="text-3xl sm:text-4xl leading-none mb-1" aria-hidden>
              {slide.circle_emoji}
            </span>
          )}
          <span
            className={`text-xs sm:text-sm font-bold tracking-widest ${light ? 'text-gray-800' : 'text-white/90'}`}
          >
            {circleStat}
          </span>
          <span
            className="text-lg sm:text-xl font-black mt-1 leading-tight"
            style={{ color: tokens.accent }}
          >
            {circleLabel}
          </span>
        </div>
        {circleFooter && (
          <p
            className={`mt-4 text-center text-xs sm:text-sm max-w-[14rem] leading-snug ${
              light ? 'text-gray-600' : 'text-gray-400'
            }`}
          >
            {circleFooter}
          </p>
        )}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
        <span
          className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase mb-2"
          style={{ color: tokens.accent }}
        >
          {gridLabel}
        </span>
        <h2
          className={`font-black leading-tight mb-4 sm:mb-6 ${tokens.titleClass || 'font-display text-white'}`}
          style={{ fontSize: 'clamp(1.25rem, 2.8vw, 2.25rem)' }}
        >
          {useSplitHeadline ? (
            <>
              {prefix && <span className={light ? 'text-gray-900' : 'text-white'}>{prefix} </span>}
              {highlight && (
                <span style={{ color: tokens.accent }} className="font-black">
                  {highlight}{' '}
                </span>
              )}
              {suffix && (
                <span className={light ? 'text-gray-900' : 'text-white/95'}>{suffix}</span>
              )}
            </>
          ) : (
            slide.title
          )}
        </h2>

        <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 sm:gap-4">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all ${
                light
                  ? 'border-gray-200/90 bg-white/90 shadow-sm'
                  : 'border-white/10 bg-black/25 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-start gap-2 mb-1">
                {card.emoji && (
                  <span className="text-xl sm:text-2xl leading-none shrink-0" aria-hidden>
                    {card.emoji}
                  </span>
                )}
                <h3
                  className={`font-bold text-sm sm:text-base leading-snug ${
                    light ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  {card.title}
                </h3>
              </div>
              <p
                className={`text-xs sm:text-sm leading-relaxed pl-0 ${light ? 'text-gray-600' : 'text-gray-400'}`}
              >
                {card.body}
              </p>
            </div>
          ))}
        </div>

        {slide.main_text && (
          <p
            className={`mt-4 text-xs sm:text-sm max-w-prose ${tokens.bodyMuted || 'text-gray-400'}`}
          >
            {slide.main_text}
          </p>
        )}
      </div>
    </div>
  );
};

const ScalingMachineSlide = ({ slide, tokens }) => {
  const light = tokens.isLight;
  const rgb = tokens.accentRgb || '32,178,170';
  const blocks = (slide.bullets || []).slice(0, 3);
  const icons = [
    <Network className="w-7 h-7" style={!light ? { color: tokens.accent } : { color: '#ea580c' }} />,
    <Database className="w-7 h-7" style={!light ? { color: tokens.accent } : { color: '#ea580c' }} />,
    <Zap className="w-7 h-7" style={!light ? { color: tokens.accent } : { color: '#ea580c' }} />,
  ];

  return (
    <div className="flex min-h-0 h-full w-full flex-col px-7 pb-6 pt-5 z-10">
      <div
        className={`flex shrink-0 items-center gap-4 border-b pb-4 mb-4 ${light ? 'border-gray-200' : 'border-white/5'}`}
      >
        <div
          className="h-14 w-1 shrink-0 rounded-full"
          style={
            light
              ? { background: 'linear-gradient(to bottom, #f97316, #c2410c)' }
              : { background: tokens.headerPillar }
          }
        />
        <div className="min-w-0">
          <h2
            className={`font-black uppercase tracking-wider leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] ${tokens.titleClass || 'font-display text-white'}`}
            style={{ fontSize: 'clamp(1.35rem, 3.2vw, 2.75rem)' }}
          >
            {slide.title}
          </h2>
          {slide.main_text && (
            <p
              className={`font-sans mt-2 text-base leading-snug drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)] sm:text-lg ${tokens.bodyMuted || 'text-gray-400'}`}
            >
              {slide.main_text}
            </p>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-3 sm:gap-4">
        {blocks.map((pt, i) => (
          <div
            key={i}
            className={`group/card relative flex min-h-0 flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300 sm:p-6 ${
              light
                ? 'border-gray-200 bg-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                : `${tokens.borderSubtle || 'border-white/5'} ${tokens.cardBg || 'bg-white/[0.03]'} ${tokens.cardHover || 'hover:bg-white/[0.06]'} hover:-translate-y-1`
            }`}
          >
            <div
              className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r to-transparent"
              style={light ? { background: 'linear-gradient(90deg, rgba(251,146,60,0.85), transparent)' } : { background: `linear-gradient(90deg, ${tokens.accent}99, transparent)` }}
            />
            {!light && (
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none"
                style={{ background: `rgba(${rgb},0.12)` }}
              />
            )}

            <div
              className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border sm:mb-5 sm:h-14 sm:w-14"
              style={
                light
                  ? { borderColor: '#fed7aa', backgroundColor: '#fff7ed', color: '#ea580c' }
                  : { borderColor: `rgba(${rgb},0.35)`, backgroundColor: `rgba(${rgb},0.08)`, color: tokens.accent }
              }
            >
              {icons[i]}
            </div>

            <p
              className={`min-w-0 font-sans text-base leading-snug sm:text-lg ${light ? 'text-gray-800' : tokens.bodyStrong === 'text-white' ? 'text-gray-200' : 'text-gray-200'}`}
            >
              {pt}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   3. DATA PIVOT — "The Pivot" (User Acq → Unit Economics)
   Vertical-flow · high-contrast · old → new
───────────────────────────────────────────────────── */
const DataPivotSlide = ({ slide, tokens }) => {
  const light = tokens.isLight;
  const rgb = tokens.accentRgb || '32,178,170';
  const shift = slide.comparison_shift || {
    old_way: 'Legacy Approach',
    new_way: 'The Anthill Vector',
  };

  return (
    <div className="relative flex min-h-0 h-full w-full flex-col justify-between overflow-hidden p-8 sm:p-10 z-10">
      <div
        className={`absolute inset-0 pointer-events-none ${light ? 'opacity-[0.06]' : 'opacity-[0.03]'}`}
        style={{
          backgroundImage: light
            ? 'repeating-linear-gradient(45deg, #9a3412 0, #9a3412 1px, transparent 0, transparent 50%)'
            : `repeating-linear-gradient(45deg, rgba(${rgb},0.55) 0, rgba(${rgb},0.55) 1px, transparent 0, transparent 50%)`,
          backgroundSize: '20px 20px',
        }}
      />

      <div className="z-10">
        <h2
          className={`mb-2 font-black uppercase tracking-[0.15em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] ${tokens.titleClass || 'font-display text-white'}`}
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2.75rem)', flexWrap: 'nowrap' }}
        >
          {slide.title}
        </h2>
        {slide.main_text && (
          <p
            className="font-sans text-xl font-medium"
            style={light ? { color: '#c2410c' } : { color: tokens.accent }}
          >
            {slide.main_text}
          </p>
        )}
      </div>

      <div className="z-10 my-4 flex min-h-0 flex-1 flex-col justify-center gap-3 sm:my-6 sm:gap-4">
        <div
          className={`flex items-center gap-6 p-6 rounded-xl border ${
            light ? 'border-red-200 bg-red-50/80' : 'border-red-500/10 bg-red-500/[0.04]'
          }`}
        >
          <div className={`w-3 h-3 rounded-full shrink-0 ${light ? 'bg-red-400' : 'bg-red-500/50'}`} />
          <div>
            <span
              className={`text-xs tracking-widest uppercase block mb-1 ${light ? 'text-red-700' : 'text-red-400/70'}`}
            >
              Before
            </span>
            <p
              className={`font-sans line-through ${light ? 'text-gray-600 decoration-red-300' : 'text-gray-400 decoration-red-500/30'}`}
              style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
            >
              {shift.old_way}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-4">
          <ArrowRightCircle
            className="w-8 h-8 rotate-90"
            style={
              light
                ? { color: '#ea580c' }
                : { color: tokens.accent, filter: `drop-shadow(0 0 6px rgba(${rgb},0.7))` }
            }
          />
          <div
            className="h-[1px] flex-1 bg-gradient-to-r to-transparent"
            style={{ background: `linear-gradient(90deg, ${tokens.accent}66, transparent)` }}
          />
        </div>

        <div
          className={`flex items-center gap-6 p-6 rounded-xl border ${
            light ? 'border-orange-200 bg-orange-50/90' : 'border-white/10'
          }`}
          style={light ? undefined : { background: `rgba(${rgb},0.08)`, borderColor: `rgba(${rgb},0.35)` }}
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={
              light
                ? { backgroundColor: '#ea580c' }
                : { backgroundColor: tokens.accent, boxShadow: `0 0 12px rgba(${rgb},0.7)` }
            }
          />
          <div>
            <span
              className="text-xs tracking-widest uppercase block mb-1"
              style={{ color: light ? '#9a3412' : `${tokens.accent}cc` }}
            >
              The Shift
            </span>
            <p
              className={`font-sans font-semibold ${light ? 'text-gray-900' : 'text-white'}`}
              style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
            >
              {shift.new_way}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   4. ROI MATRIX — Financial Projections Table
───────────────────────────────────────────────────── */
const ROIMatrixSlide = ({ slide, tokens }) => {
  const light = tokens.isLight;
  const rgb = tokens.valueGlowRgb || tokens.accentRgb || '32,178,170';
  const metrics = slide.metrics_table || [];

  return (
    <div className="flex min-h-0 min-w-0 h-full w-full flex-row z-10">
      <div
        className={`flex w-[38%] min-w-0 shrink-0 flex-col justify-center border-r p-8 sm:p-10 ${
          light ? 'border-gray-200 bg-stone-100/80' : 'border-white/5 bg-white/[0.02]'
        }`}
      >
        <TrendingUp
          className="w-10 h-10 mb-6"
          style={light ? { color: '#ea580c' } : { color: tokens.accent, filter: `drop-shadow(0 0 10px rgba(${rgb},0.45))` }}
        />
        <h2
          className={`mb-4 font-black uppercase leading-tight tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:mb-6 ${tokens.titleClass || 'font-display text-white'}`}
          style={{ fontSize: 'clamp(1.5rem, 3.2vw, 3rem)' }}
        >
          {slide.title}
        </h2>
        {slide.main_text && (
          <p
            className={`font-sans text-lg leading-relaxed border-l-2 pl-4 ${tokens.bodyMuted || 'text-gray-400'}`}
            style={light ? { borderColor: '#fb923c' } : { borderColor: `rgba(${tokens.accentRgb || rgb},0.5)` }}
          >
            {slide.main_text}
          </p>
        )}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center p-6 sm:p-8">
        <div className={`w-full rounded-2xl overflow-hidden border ${light ? 'border-gray-200 bg-white shadow-sm' : 'border-white/5'}`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className={`border-b ${light ? 'border-gray-200 bg-orange-50' : 'border-white/5'}`} style={light ? undefined : { background: tokens.tableHeaderBg }}>
                <th
                  className={`text-left p-5 tracking-widest text-sm uppercase ${light ? 'font-serif text-orange-800' : 'font-display'}`}
                  style={!light ? { color: tokens.tableHeaderText } : undefined}
                >
                  Vector
                </th>
                <th
                  className={`text-right p-5 tracking-widest text-sm uppercase ${light ? 'font-serif text-orange-800' : 'font-display'}`}
                  style={!light ? { color: tokens.tableHeaderText } : undefined}
                >
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((row, i) => {
                const keys = Object.keys(row);
                const label = row.metric || row[keys[0]] || '—';
                const value = row.value || row[keys[1]] || '—';

                return (
                  <tr
                    key={i}
                    className={`border-b last:border-0 transition-colors ${
                      light ? 'border-gray-100 hover:bg-stone-50' : 'border-white/5 hover:bg-white/[0.03]'
                    }`}
                  >
                    <td className={`p-5 font-sans text-xl ${light ? 'text-gray-800' : 'text-gray-300'}`}>{label}</td>
                    <td
                      className={`p-5 text-right font-black text-2xl ${light ? 'font-serif text-gray-900' : 'font-display text-white'}`}
                      style={
                        light ? undefined : { textShadow: `0 0 18px rgba(${rgb},0.35)` }
                      }
                    >
                      {value}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SlidePreview;
