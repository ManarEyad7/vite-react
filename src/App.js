import { useEffect, useMemo, useRef, useState } from "react";

/** ====== DEMO DATA (replace with your outputs/files) ====== */
const DEMO = {
  videoId: "Fighting050_x264",
  duration: 875.51, // seconds
  longVideoSrc: "/long_video.mp4",
  clips: [
    { id: "c1", start: 4.1, end: 18.3, caption: "Two men confront each other near a parked car.", src: "/mbts_out1/clips/clip1.mp4", poster: "/posters/clip1.jpg" },
    { id: "c2", start: 82.6, end: 93.1, caption: "A person runs across the street.", src: "/mbts_out1/clips/clip2.mp4", poster: "/posters/clip2.jpg" },
    { id: "c3", start: 134.7, end: 168.9, caption: "Crowd gathers; pushing and shoving starts.", src: "/mbts_out1/clips/clip3.mp4", poster: "/posters/clip3.jpg" },
    { id: "c4", start: 191.4, end: 201.5, caption: "Vehicle arrives quickly and stops abruptly.", src: "/mbts_out1/clips/clip4.mp4", poster: "/posters/clip4.jpg" },
    { id: "c5", start: 234.5, end: 247.0, caption: "Two individuals exchange punches.", src: "/mbts_out1/clips/clip5.mp4", poster: "/posters/clip5.jpg" },
    { id: "c6", start: 380.3, end: 395.5, caption: "Bystanders intervene to separate the fight.", src: "/mbts_out1/clips/clip6.mp4", poster: "/posters/clip6.jpg" },
    { id: "c7", start: 436.3, end: 448.3, caption: "One person flees the scene.", src: "/mbts_out1/clips/clip7.mp4", poster: "/posters/clip7.jpg" },
    { id: "c8", start: 495.3, end: 505.7, caption: "Police car passes by the area.", src: "/mbts_out1/clips/clip8.mp4", poster: "/posters/clip8.jpg" },
    { id: "c9", start: 545.7, end: 561.1, caption: "Individuals regroup; tension decreases.", src: "/mbts_out1/clips/clip9.mp4", poster: "/posters/clip9.jpg" },
    { id: "c10", start: 597.8, end: 610.4, caption: "Paramedics approach the location.", src: "/mbts_out1/clips/clip10.mp4", poster: "/posters/clip10.jpg" },
    { id: "c11", start: 632.8, end: 650.4, caption: "Area begins to clear out.", src: "/mbts_out1/clips/clip11.mp4", poster: "/posters/clip11.jpg" },
    { id: "c12", start: 728.2, end: 750.8, caption: "Final check by security personnel.", src: "/mbts_out1/clips/clip12.mp4", poster: "/posters/clip12.jpg" },
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

/** SmartVideo — seeks to a meaningful frame, plays 1 tick then pauses */
function SmartVideo({ src, poster, startAt = 0, className = "", onError }) {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let seekedOnce = false;

    const onLoadedMeta = () => {
      try {
        v.currentTime = Math.max(0, startAt);
      } catch {}
    };

    const onSeeked = async () => {
      if (seekedOnce) return;
      seekedOnce = true;
      try { await v.play(); } catch {}
      setTimeout(() => {
        try { v.pause(); } catch {}
      }, 80);
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
      key={src + "|" + startAt}
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      controls
      preload="auto"
      muted
      playsInline
      onError={onError}
    />
  );
}

function SegmentationBar({ duration, segments, activeId, onHover, onLeave, onSelect }) {
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
            className={`absolute top-0 h-3 rounded-full transition focus:outline-none ${
              isActive ? "bg-emerald-400 ring-2 ring-emerald-300/60" : "bg-indigo-400 hover:bg-indigo-300 focus:ring-2 focus:ring-indigo-400/60"
            }`}
            style={{ left: `${left}%`, width: `${width}%` }}
            title={`${s.caption ? s.caption + " — " : "Clip: "}${secondsToHMS(s.start)} — ${secondsToHMS(s.end)}`}
            aria-label={`Segment from ${secondsToHMS(s.start)} to ${secondsToHMS(s.end)}`}
            onMouseEnter={() => onHover?.(s.id)}
            onMouseLeave={onLeave}
            onClick={() => onSelect?.(s.id)}
          />
        );
      })}
    </div>
  );
}

function SegmentationCard({ title, duration, videoSrc, poster, segments }) {
  const [activeId, setActiveId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [videoError, setVideoError] = useState(false);

  const selected = useMemo(() => segments.find((s) => s.id === selectedId) || null, [segments, selectedId]);
  const defaultPreviewTime = segments[0]?.start ?? 0.1;

  const coverage = useMemo(() => {
    const sum = segments.reduce((acc, s) => acc + (s.end - s.start), 0);
    return sum / duration;
  }, [segments, duration]);

  const selectedLen = selected ? selected.end - selected.start : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800 shadow-sm p-4 lg:p-5">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-slate-100">{title}</div>
        <div className="text-xs text-slate-400">Coverage: <span className="font-medium text-slate-200">{pct(coverage)}</span></div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black">
        <SmartVideo
          src={videoSrc}
          poster={poster}
          startAt={selected ? selected.start : defaultPreviewTime}
          className="w-full aspect-video"
          onError={() => setVideoError(true)}
        />
      </div>

      {videoError && (
        <div className="mt-2 text-xs text-red-300">Video failed to load. Check the URL, hosting CORS, or try another file.</div>
      )}

      <div className="mt-4">
        <SegmentationBar
          duration={duration}
          segments={segments}
          activeId={activeId}
          onHover={setActiveId}
          onLeave={() => setActiveId(null)}
          onSelect={(id) => { setSelectedId(id); setActiveId(id); }}
        />
        <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-indigo-400" /> Segment</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> Hover / Selected</span>
        </div>
      </div>

      {/* Caption panel (appears when a segment is selected) */}
      {selected && (
        <div
          className="mt-4 rounded-xl border border-white/10 bg-slate-900 p-4"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-100 truncate">
                {selected.caption || "Selected segment"}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Start: {secondsToHMS(selected.start)} · End: {secondsToHMS(selected.end)} · Len: {secondsToHMS(selectedLen)}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => { setSelectedId(null); setActiveId(null); }}
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
              >
                Reset
              </button>
              <a
                href={videoSrc}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-slate-800 border border-white/10 px-2 py-1 text-xs text-slate-100 hover:bg-white/5"
              >
                Full video
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home"); // "home" | "compare"

  const totalActionSeconds = useMemo(
    () => DEMO.clips.reduce((acc, c) => acc + (c.end - c.start), 0),
    []
  );
  const timeSaved = Math.max(DEMO.duration - totalActionSeconds, 0);

  // IMPORTANT: include the caption in segment objects so the panel can show it
  const lovrSegments = useMemo(
    () => DEMO.clips.map((c) => ({ ...c, id: c.id + "_lovr" })), // keep caption/start/end
    []
  );
  const ourSegments = useMemo(
    () => DEMO.clips.map((c) => ({ ...c, id: c.id + "_ours" })),
    []
  );

  const firstActionStart = DEMO.clips[0]?.start ?? 0.1;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 lg:px-8 py-8 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">Surveillance Segmentation</h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2">Long video → AI clips. Seek, compare, and review faster.</p>
          </div>
          {view === "compare" && (
            <button
              onClick={() => setView("home")}
              className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-sm hover:bg-white/5"
            >Back</button>
          )}
        </div>
      </header>

      {view === "home" && (
        <main className="max-w-7xl mx-auto px-6 lg:px-8 pb-6">
          <div className="w-full max-w-2xl mx-auto rounded-xl border border-white/10 bg-slate-800 shadow-sm p-3 lg:p-4">
            <div className="text-sm font-semibold text-slate-100">Original Long Video</div>

            <div className="mt-2 h-64 sm:h-72 md:h-80 lg:h-96 max-h-[65vh] overflow-hidden rounded-lg border border-white/10 bg-black">
              <SmartVideo
                src={DEMO.longVideoSrc}
                poster="/posters/long_video.jpg"
                startAt={firstActionStart}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <span><b className="text-slate-200">Duration:</b> {secondsToHMS(DEMO.duration)}</span>
              <span><b className="text-slate-200">Action:</b> {secondsToHMS(totalActionSeconds)}</span>
              <span><b className="text-slate-200">Saved:</b> {secondsToHMS(timeSaved)} ({pct(timeSaved / DEMO.duration)})</span>
              <span><b className="text-slate-200">Clips:</b> {DEMO.clips.length}</span>
            </div>
<div className="mt-3 flex justify-center">
  <button
    onClick={() => setView("compare")}
    className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-semibold"
  >
    Show Segmentations
  </button>
</div>

          </div>
        </main>
      )}

      {view === "compare" && (
        <main className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <SegmentationCard
                title="LoVR Segmentation"
                duration={DEMO.duration}
                videoSrc={DEMO.longVideoSrc}
                poster="/posters/long_video.jpg"
                segments={lovrSegments}
              />
            </div>
            <div className="lg:col-span-6">
              <SegmentationCard
                title="Our Segmentation"
                duration={DEMO.duration}
                videoSrc={DEMO.longVideoSrc}
                poster="/posters/long_video.jpg"
                segments={ourSegments}
              />
            </div>
          </div>
        </main>
      )}

      <footer className="max-w-7xl mx-auto px-6 lg:px-8 pb-8">
        <small className="text-slate-500"> By Manar Eyad - Shooq Alhatem - Yara Alzahrani - Fatimah Albesher .</small>
      </footer>
    </div>
  );
}
