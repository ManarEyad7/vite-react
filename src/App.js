import { useMemo, useState, useRef, useEffect } from "react";

/** ====== DEMO DATA (edit to your actual files) ======
 * Put these MP4s in: public/
 *   - /long_video.mp4
 *   - /mbts_out1/clips/clip1.mp4 ... clipN.mp4
 * Optionally posters in /posters/*.jpg
 */
const DEMO = {
  videoId: "Fighting050_x264",
  duration: 875.51, // seconds
  longVideoSrc: "/long_video.mp4",
  clips: [
    { id: "c1",  start: 4.1,   end: 18.3,  caption: "Two men confront each other near a parked car.", src: "/mbts_out1/clips/clip1.mp4",  poster: "/posters/clip1.jpg" },
    { id: "c2",  start: 82.6,  end: 93.1,  caption: "A person runs across the street.",               src: "/mbts_out1/clips/clip2.mp4",  poster: "/posters/clip2.jpg" },
    { id: "c3",  start: 134.7, end: 168.9, caption: "Crowd gathers; pushing and shoving starts.",     src: "/mbts_out1/clips/clip3.mp4",  poster: "/posters/clip3.jpg" },
    { id: "c4",  start: 191.4, end: 201.5, caption: "Vehicle arrives quickly and stops abruptly.",    src: "/mbts_out1/clips/clip4.mp4",  poster: "/posters/clip4.jpg" },
    { id: "c5",  start: 234.5, end: 247.0, caption: "Two individuals exchange punches.",              src: "/mbts_out1/clips/clip5.mp4",  poster: "/posters/clip5.jpg" },
    { id: "c6",  start: 380.3, end: 395.5, caption: "Bystanders intervene to separate the fight.",    src: "/mbts_out1/clips/clip6.mp4",  poster: "/posters/clip6.jpg" },
    { id: "c7",  start: 436.3, end: 448.3, caption: "One person flees the scene.",                    src: "/mbts_out1/clips/clip7.mp4",  poster: "/posters/clip7.jpg" },
    { id: "c8",  start: 495.3, end: 505.7, caption: "Police car passes by the area.",                 src: "/mbts_out1/clips/clip8.mp4",  poster: "/posters/clip8.jpg" },
    { id: "c9",  start: 545.7, end: 561.1, caption: "Individuals regroup; tension decreases.",        src: "/mbts_out1/clips/clip9.mp4",  poster: "/posters/clip9.jpg" },
    { id: "c10", start: 597.8, end: 610.4, caption: "Paramedics approach the location.",              src: "/mbts_out1/clips/clip10.mp4", poster: "/posters/clip10.jpg" },
    { id: "c11", start: 632.8, end: 650.4, caption: "Area begins to clear out.",                      src: "/mbts_out1/clips/clip11.mp4", poster: "/posters/clip11.jpg" },
    { id: "c12", start: 728.2, end: 750.8, caption: "Final check by security personnel.",             src: "/mbts_out1/clips/clip12.mp4", poster: "/posters/clip12.jpg" },
  ],
};

function secondsToHMS(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return [h > 0 ? String(h).padStart(2, "0") : null, String(m).padStart(2, "0"), String(sec).padStart(2, "0")]
    .filter(Boolean)
    .join(":");
}

function pct(n) {
  return (n * 100).toFixed(1) + "%";
}

/** ====== SmartVideo (shows a real frame immediately) ======
 * - Seeks to startAt (e.g., first action time) once metadata is ready
 * - Briefly plays muted to force frame render, then pauses
 * - Prevents the gray placeholder look
 */
function SmartVideo({ src, poster, startAt = 0, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    let seekedOnce = false;

    const onLoadedMeta = () => {
      // Seek to a meaningful frame (e.g., first action start)
      try {
        v.currentTime = Math.max(0, startAt);
      } catch {}
    };

    const onSeeked = async () => {
      if (seekedOnce) return;
      seekedOnce = true;
      // Autoplay muted to draw the frame, then pause
      try { await v.play(); } catch {}
      setTimeout(() => {
        try { v.pause(); } catch {}
      }, 60);
    };

    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("seeked", onSeeked);

    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMeta);
      v.removeEventListener("seeked", onSeeked);
    };
  }, [src, startAt]);

  return (
    <video
      key={src + "|" + startAt}      // ensure fresh mount when source/seek changes
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      controls
      preload="auto"
      muted
      playsInline
    />
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [activeClipId, setActiveClipId] = useState(null);     // hover highlight
  const [selectedClipId, setSelectedClipId] = useState(null); // click-to-view

  const selectedClip = useMemo(
    () => DEMO.clips.find((c) => c.id === selectedClipId) || null,
    [selectedClipId]
  );

  const totalActionSeconds = useMemo(
    () => DEMO.clips.reduce((acc, c) => acc + (c.end - c.start), 0),
    []
  );
  const timeSaved = Math.max(DEMO.duration - totalActionSeconds, 0);

  const filteredClips = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO.clips;
    return DEMO.clips.filter((c) => c.caption.toLowerCase().includes(q));
  }, [query]);

  // If no clip is selected, show a frame from the first action segment
  const defaultPreviewTime = DEMO.clips[0]?.start ?? 0.1;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Surveillance Demo — From Hours to Moments</h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2">
          Input: one long video → Output: AI-segmented <b>action clips</b> with <b>captions</b>.
        </p>
      </header>

      {/* Hero: Long video + search/stats */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: long video + timeline */}
          <div className="lg:col-span-9 xl:col-span-9">
            <div className="rounded-2xl border border-white/10 bg-slate-800 shadow-sm p-4 lg:p-5 lg:sticky lg:top-6">
              <div className="text-base font-semibold text-slate-100">Original Long Video</div>

              {/* Player that shows a real frame immediately */}
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black">
                <SmartVideo
                  src={selectedClip ? selectedClip.src : DEMO.longVideoSrc}
                  poster={selectedClip ? selectedClip.poster : "/posters/long_video.jpg"}
                  startAt={selectedClip ? 0 : defaultPreviewTime}
                  className="w-full aspect-video"
                />
              </div>

              {/* Timeline with click-to-select */}
              <div className="mt-4">
                <Timeline
                  duration={DEMO.duration}
                  segments={DEMO.clips.map((c) => ({ start: c.start, end: c.end, id: c.id }))}
                  activeId={activeClipId}
                  onHover={(id) => setActiveClipId(id)}
                  onLeave={() => setActiveClipId(null)}
                  onSelect={(id) => { setSelectedClipId(id); setActiveClipId(id); }}
                />
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-400" /> Action segments
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> Hovered / selected
                  </span>
                </div>
              </div>

              {/* Selected clip caption + meta */}
              {selectedClip ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-slate-900 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-100">{selectedClip.caption}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Start: {secondsToHMS(selectedClip.start)} · End: {secondsToHMS(selectedClip.end)} · Len:{" "}
                        {secondsToHMS(selectedClip.end - selectedClip.start)}
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedClipId(null); setActiveClipId(null); }}
                      className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                      title="Back to full video"
                    >
                      Full video
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                <span><b className="text-slate-200">Duration:</b> {secondsToHMS(DEMO.duration)}</span>
                <span><b className="text-slate-200">Action total:</b> {secondsToHMS(totalActionSeconds)}</span>
                <span><b className="text-slate-200">Time saved:</b> {secondsToHMS(timeSaved)} ({pct(timeSaved / DEMO.duration)})</span>
                <span><b className="text-slate-200">Clips:</b> {DEMO.clips.length}</span>
              </div>
            </div>
          </div>

          {/* Right: search + stats */}
          <div className="lg:col-span-8 xl:col-span-8">
            <div className="rounded-2xl border border-white/10 bg-slate-800 shadow-sm p-4 lg:p-5">
              <div className="text-base font-semibold text-slate-100">Search Clips</div>
              <input
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Try: fight, car, police, running…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <ul className="mt-3 flex flex-wrap gap-2">
                {["fight", "car", "police", "running", "crowd", "security"].map((t) => (
                  <li key={t}>
                    <button
                      onClick={() => setQuery(t)}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/5"
                    >
                      {t}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard label="Review Speed-Up" value={`≈ ${Math.max(1, Math.round(DEMO.duration / Math.max(totalActionSeconds, 1)))}×`} />
                <StatCard label="Coverage (Recall-ish)" value={pct(totalActionSeconds / DEMO.duration)} />
                <StatCard label="Clip Count" value={String(DEMO.clips.length)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results gallery */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
        <h2 className="text-lg font-semibold text-slate-100">Action Clips & Captions</h2>
        <p className="text-sm text-slate-400 mt-1">Each card is a short, review-ready segment with an auto-generated caption.</p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              duration={DEMO.duration}
              onHover={() => setActiveClipId(clip.id)}
              onLeave={() => setActiveClipId(null)}
            />
          ))}

          {filteredClips.length === 0 && (
            <div className="col-span-full rounded-xl border border-white/10 bg-slate-800 p-6 text-center text-sm text-slate-300">
              No clips match “{query}”. Try a different keyword.
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 lg:px-8 pb-8">
        <small className="text-slate-500">
          Demo UI only. Model outputs are pre-rendered for presentation purposes.
        </small>
      </footer>
    </div>
  );
}

/** ====== Timeline Component ====== */
function Timeline({ duration, segments, activeId, onHover, onLeave, onSelect }) {
  return (
    <div className="relative h-3 w-full rounded-full bg-slate-700">
      {segments.map((s) => {
        const left = (s.start / duration) * 100;
        const width = ((s.end - s.start) / duration) * 100;
        const isActive = activeId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            className={`absolute top-0 h-3 rounded-full ${
              isActive ? "bg-emerald-400 ring-2 ring-emerald-300/60" : "bg-indigo-400"
            } transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400/60`}
            style={{ left: `${left}%`, width: `${width}%` }}
            title={`Clip: ${secondsToHMS(s.start)} — ${secondsToHMS(s.end)}`}
            onMouseEnter={() => onHover?.(s.id)}
            onMouseLeave={onLeave}
            onClick={() => onSelect?.(s.id)}
          />
        );
      })}
    </div>
  );
}

/** ====== Clip Card ====== */
function ClipCard({ clip, duration, onHover, onLeave }) {
  const len = clip.end - clip.start;

  return (
    <div
      className="rounded-2xl border border-white/10 bg-slate-800 shadow-sm hover:shadow-md transition p-3"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="relative overflow-hidden rounded-xl border border-white/10">
        <video
          className="w-full aspect-video"
          src={clip.src}
          controls
          preload="metadata"
          poster={clip.poster}
        />
        <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-medium text-white">
          Clip
        </div>
        <div className="pointer-events-none absolute right-2 bottom-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
          {secondsToHMS(len)}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-sm font-medium text-slate-100">{clip.caption}</div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
          <span><b className="font-semibold text-slate-200">Start:</b> {secondsToHMS(clip.start)}</span>
          <span><b className="font-semibold text-slate-200">End:</b> {secondsToHMS(clip.end)}</span>
          <span><b className="font-semibold text-slate-200">% of video:</b> {pct(len / duration)}</span>
        </div>
      </div>
    </div>
  );
}

/** ====== Stat Card ====== */
function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800 p-4 text-center">
      <div className="text-xl font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}
