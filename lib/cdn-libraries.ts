// ============================================
// CDN Libraries Catalog — auto-detected and injected
// ============================================

export interface CdnLibrary {
  name: string;
  /** Global variable(s) the library exposes */
  globals: string[];
  /** Regex patterns to detect usage in code */
  detect: RegExp;
  /** CDN script URL(s) — injected in order */
  scripts: string[];
  /** Optional CDN CSS URL(s) */
  styles?: string[];
  /** Short description for AI prompt */
  description: string;
  /** Category for organization */
  category: "charts" | "3d" | "animation" | "maps" | "ui" | "utils" | "media" | "data";
}

export const CDN_LIBRARIES: CdnLibrary[] = [
  // ── Charts & Data Visualization ──
  {
    name: "Chart.js",
    globals: ["Chart"],
    detect: /\bnew\s+Chart\b|\bChart\.\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"],
    description: "Grafice interactive (bar, line, pie, radar, doughnut etc.)",
    category: "charts",
  },
  {
    name: "ApexCharts",
    globals: ["ApexCharts"],
    detect: /\bnew\s+ApexCharts\b|\bApexCharts\.\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/apexcharts@3/dist/apexcharts.min.js"],
    styles: ["https://cdn.jsdelivr.net/npm/apexcharts@3/dist/apexcharts.css"],
    description: "Grafice moderne interactive cu animatii (area, heatmap, treemap etc.)",
    category: "charts",
  },
  {
    name: "D3.js",
    globals: ["d3"],
    detect: /\bd3\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"],
    description: "Vizualizari de date complexe si custom (SVG-based)",
    category: "charts",
  },

  // ── 3D & WebGL ──
  {
    name: "Three.js",
    globals: ["THREE"],
    detect: /\bTHREE\.\w+|\bnew\s+THREE\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/three@0.170/build/three.min.js"],
    description: "Grafice 3D, scene WebGL, modele 3D, animatii 3D",
    category: "3d",
  },

  // ── Animation ──
  {
    name: "GSAP",
    globals: ["gsap"],
    detect: /\bgsap\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"],
    description: "Animatii profesionale (timeline, scroll, morphing, stagger)",
    category: "animation",
  },
  {
    name: "GSAP ScrollTrigger",
    globals: ["ScrollTrigger"],
    detect: /\bScrollTrigger\.\w+|\bscrollTrigger\s*:/,
    scripts: [
      "https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js",
      "https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js",
    ],
    description: "Animatii declansate de scroll (parallax, pin, scrub)",
    category: "animation",
  },
  {
    name: "Anime.js",
    globals: ["anime"],
    detect: /\banime\s*\(|\banime\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/animejs@3/lib/anime.min.js"],
    description: "Animatii fluide pentru CSS, SVG, DOM si JS objects",
    category: "animation",
  },
  {
    name: "Lottie",
    globals: ["lottie"],
    detect: /\blottie\.\w+|\blottie\.loadAnimation/,
    scripts: ["https://cdn.jsdelivr.net/npm/lottie-web@5/build/player/lottie.min.js"],
    description: "Animatii After Effects exportate ca JSON (Lottie files)",
    category: "animation",
  },
  {
    name: "AOS (Animate on Scroll)",
    globals: ["AOS"],
    detect: /\bAOS\.init\b|\bdata-aos\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/aos@2/dist/aos.js"],
    styles: ["https://cdn.jsdelivr.net/npm/aos@2/dist/aos.css"],
    description: "Animatii simple la scroll (fade, slide, zoom) cu atribute data-aos",
    category: "animation",
  },
  {
    name: "Typed.js",
    globals: ["Typed"],
    detect: /\bnew\s+Typed\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/typed.js@2/dist/typed.umd.js"],
    description: "Efect de typewriter/typing animat",
    category: "animation",
  },
  {
    name: "Canvas Confetti",
    globals: ["confetti"],
    detect: /\bconfetti\s*\(/,
    scripts: ["https://cdn.jsdelivr.net/npm/canvas-confetti@1/dist/confetti.browser.min.js"],
    description: "Efecte de confetti/celebrare",
    category: "animation",
  },
  {
    name: "CountUp.js",
    globals: ["countUp", "CountUp"],
    detect: /\bnew\s+countUp\.CountUp\b|\bnew\s+CountUp\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/countup.js@2/dist/countUp.umd.min.js"],
    description: "Animatie numar care creste (counter animation)",
    category: "animation",
  },

  // ── Maps ──
  {
    name: "Leaflet",
    globals: ["L"],
    detect: /\bL\.map\b|\bL\.marker\b|\bL\.tileLayer\b|\bL\.polygon\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/leaflet@1/dist/leaflet.min.js"],
    styles: ["https://cdn.jsdelivr.net/npm/leaflet@1/dist/leaflet.min.css"],
    description: "Harti interactive open-source (alternative la Google Maps, gratuit)",
    category: "maps",
  },
  {
    name: "Mapbox GL",
    globals: ["mapboxgl"],
    detect: /\bmapboxgl\.\w+|\bnew\s+mapboxgl\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/mapbox-gl@3/dist/mapbox-gl.min.js"],
    styles: ["https://cdn.jsdelivr.net/npm/mapbox-gl@3/dist/mapbox-gl.min.css"],
    description: "Harti 3D profesionale cu stilizare custom (necesita API key)",
    category: "maps",
  },

  // ── UI Components ──
  {
    name: "Swiper",
    globals: ["Swiper"],
    detect: /\bnew\s+Swiper\b|\bSwiper\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"],
    styles: ["https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"],
    description: "Carousel/slider modern cu touch, responsive, efecte 3D",
    category: "ui",
  },
  {
    name: "SortableJS",
    globals: ["Sortable"],
    detect: /\bnew\s+Sortable\b|\bSortable\.create\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/sortablejs@1/Sortable.min.js"],
    description: "Drag & drop pentru liste, grid-uri, kanban boards",
    category: "ui",
  },
  {
    name: "Tippy.js",
    globals: ["tippy"],
    detect: /\btippy\s*\(/,
    scripts: [
      "https://cdn.jsdelivr.net/npm/@popperjs/core@2/dist/umd/popper.min.js",
      "https://cdn.jsdelivr.net/npm/tippy.js@6/dist/tippy-bundle.umd.min.js",
    ],
    styles: ["https://cdn.jsdelivr.net/npm/tippy.js@6/dist/tippy.css"],
    description: "Tooltip-uri elegante si popover-uri",
    category: "ui",
  },
  {
    name: "Lightbox (GLightbox)",
    globals: ["GLightbox"],
    detect: /\bGLightbox\s*\(|\bnew\s+GLightbox\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/glightbox@3/dist/js/glightbox.min.js"],
    styles: ["https://cdn.jsdelivr.net/npm/glightbox@3/dist/css/glightbox.min.css"],
    description: "Lightbox pentru galerii foto/video (fullscreen, zoom, slide)",
    category: "ui",
  },
  {
    name: "Masonry",
    globals: ["Masonry"],
    detect: /\bnew\s+Masonry\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/masonry-layout@4/dist/masonry.pkgd.min.js"],
    description: "Layout grid tip Pinterest (cascading grid)",
    category: "ui",
  },
  {
    name: "Notyf",
    globals: ["Notyf"],
    detect: /\bnew\s+Notyf\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js"],
    styles: ["https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css"],
    description: "Notificari toast minimale si elegante",
    category: "ui",
  },
  {
    name: "Alpine.js",
    globals: ["Alpine"],
    detect: /\bx-data\b|\bx-show\b|\bx-on\b|\bAlpine\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"],
    description: "Interactivitate declarativa direct in HTML (ca un mini Vue)",
    category: "ui",
  },

  // ── Utilities ──
  {
    name: "Day.js",
    globals: ["dayjs"],
    detect: /\bdayjs\s*\(|\bdayjs\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"],
    description: "Lucru cu date si ore (format, parse, diff, relative time)",
    category: "utils",
  },
  {
    name: "Lodash",
    globals: ["_"],
    detect: /\b_\.(debounce|throttle|cloneDeep|groupBy|sortBy|uniq|merge|chunk|flatten|pick|omit)\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js"],
    description: "Utilitare JS (debounce, throttle, deep clone, groupBy etc.)",
    category: "utils",
  },
  {
    name: "Axios",
    globals: ["axios"],
    detect: /\baxios\.\w+|\baxios\s*\(/,
    scripts: ["https://cdn.jsdelivr.net/npm/axios@1/dist/axios.min.js"],
    description: "Client HTTP avansat (interceptors, cancel, progress)",
    category: "utils",
  },
  {
    name: "Marked",
    globals: ["marked"],
    detect: /\bmarked\.\w+|\bmarked\s*\(/,
    scripts: ["https://cdn.jsdelivr.net/npm/marked@15/marked.min.js"],
    description: "Converteste Markdown in HTML",
    category: "utils",
  },
  {
    name: "DOMPurify",
    globals: ["DOMPurify"],
    detect: /\bDOMPurify\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"],
    description: "Sanitizeaza HTML (previne XSS) — foloseste cu marked/innerHTML",
    category: "utils",
  },
  {
    name: "QRCode.js",
    globals: ["QRCode"],
    detect: /\bnew\s+QRCode\b|\bQRCode\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/qrcodejs@1/qrcode.min.js"],
    description: "Genereaza coduri QR in browser",
    category: "utils",
  },
  {
    name: "html2canvas",
    globals: ["html2canvas"],
    detect: /\bhtml2canvas\s*\(/,
    scripts: ["https://cdn.jsdelivr.net/npm/html2canvas@1/dist/html2canvas.min.js"],
    description: "Screenshot DOM element ca imagine (export PNG/JPG)",
    category: "utils",
  },
  {
    name: "jsPDF",
    globals: ["jspdf", "jsPDF"],
    detect: /\bnew\s+jspdf\.jsPDF\b|\bnew\s+jsPDF\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/jspdf@2/dist/jspdf.umd.min.js"],
    description: "Genereaza fisiere PDF in browser",
    category: "utils",
  },
  {
    name: "FileSaver.js",
    globals: ["saveAs"],
    detect: /\bsaveAs\s*\(/,
    scripts: ["https://cdn.jsdelivr.net/npm/file-saver@2/dist/FileSaver.min.js"],
    description: "Salveaza fisiere din browser (download programatic)",
    category: "utils",
  },
  {
    name: "PapaParse",
    globals: ["Papa"],
    detect: /\bPapa\.parse\b|\bPapa\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/papaparse@5/papaparse.min.js"],
    description: "Parseaza si genereaza fisiere CSV",
    category: "data",
  },
  {
    name: "SheetJS (XLSX)",
    globals: ["XLSX"],
    detect: /\bXLSX\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/xlsx@0/dist/xlsx.full.min.js"],
    description: "Citeste si genereaza fisiere Excel (xlsx, xls, csv)",
    category: "data",
  },

  // ── Media ──
  {
    name: "Howler.js",
    globals: ["Howl", "Howler"],
    detect: /\bnew\s+Howl\b|\bHowler\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js"],
    description: "Player audio avansat (sprite, fade, spatial audio)",
    category: "media",
  },
  {
    name: "Plyr",
    globals: ["Plyr"],
    detect: /\bnew\s+Plyr\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/plyr@3/dist/plyr.min.js"],
    styles: ["https://cdn.jsdelivr.net/npm/plyr@3/dist/plyr.css"],
    description: "Player video/audio modern si customizabil",
    category: "media",
  },
  {
    name: "Cropper.js",
    globals: ["Cropper"],
    detect: /\bnew\s+Cropper\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/cropperjs@1/dist/cropper.min.js"],
    styles: ["https://cdn.jsdelivr.net/npm/cropperjs@1/dist/cropper.min.css"],
    description: "Crop/resize imagini in browser (avatar upload, image editor)",
    category: "media",
  },

  // ── Data Visualization ──
  {
    name: "Mermaid",
    globals: ["mermaid"],
    detect: /\bmermaid\.\w+|\bclass="mermaid"/,
    scripts: ["https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"],
    description: "Diagrame din text (flowchart, sequence, gantt, ER)",
    category: "charts",
  },

  // ── Math & Science ──
  {
    name: "KaTeX",
    globals: ["katex"],
    detect: /\bkatex\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/katex@0/dist/katex.min.js"],
    styles: ["https://cdn.jsdelivr.net/npm/katex@0/dist/katex.min.css"],
    description: "Randare formule matematice (LaTeX) in browser",
    category: "utils",
  },

  // ── Rich Text ──
  {
    name: "Quill",
    globals: ["Quill"],
    detect: /\bnew\s+Quill\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js"],
    styles: ["https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css"],
    description: "Editor de text rich (WYSIWYG) — bold, italic, liste, imagini",
    category: "ui",
  },

  // ── Full-text search ──
  {
    name: "Fuse.js",
    globals: ["Fuse"],
    detect: /\bnew\s+Fuse\b/,
    scripts: ["https://cdn.jsdelivr.net/npm/fuse.js@7/dist/fuse.min.js"],
    description: "Cautare fuzzy client-side (search bar cu toleranta la typo-uri)",
    category: "utils",
  },

  // ── Drag & Drop ──
  {
    name: "Interact.js",
    globals: ["interact"],
    detect: /\binteract\s*\(|\binteract\.\w+/,
    scripts: ["https://cdn.jsdelivr.net/npm/interactjs@1/dist/interact.min.js"],
    description: "Drag, resize, rotate elements — mai avansat ca SortableJS",
    category: "ui",
  },

  // ── Icons ──
  {
    name: "Font Awesome",
    globals: [],
    detect: /\bfa-solid\b|\bfa-regular\b|\bfa-brands\b|\bclass="fa[srlb]?\s/,
    scripts: [],
    styles: ["https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/css/all.min.css"],
    description: "Iconite vectoriale (7000+ iconite gratuite)",
    category: "ui",
  },
  {
    name: "Bootstrap Icons",
    globals: [],
    detect: /\bbi\s+bi-\w+/,
    scripts: [],
    styles: ["https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/bootstrap-icons.css"],
    description: "Iconite Bootstrap (2000+ iconite SVG)",
    category: "ui",
  },
];

/**
 * Detect which CDN libraries are used in the given code files.
 * Returns unique list of libraries to inject.
 */
export function detectLibraries(files: { path: string; content: string }[]): CdnLibrary[] {
  const allCode = files.map(f => f.content).join("\n");
  const detected = new Map<string, CdnLibrary>();

  for (const lib of CDN_LIBRARIES) {
    if (lib.detect.test(allCode) && !detected.has(lib.name)) {
      detected.set(lib.name, lib);
    }
  }

  // If GSAP ScrollTrigger is detected, remove standalone GSAP (ScrollTrigger already includes it)
  if (detected.has("GSAP ScrollTrigger") && detected.has("GSAP")) {
    detected.delete("GSAP");
  }

  return Array.from(detected.values());
}

/**
 * Generate HTML tags for detected libraries.
 * Returns { styles: string, scripts: string } to inject in <head> and before </body>.
 */
export function generateCdnTags(libraries: CdnLibrary[]): { styles: string; scripts: string } {
  // Deduplicate URLs across libraries
  const styleUrls = new Set<string>();
  const scriptUrls = new Set<string>();

  for (const lib of libraries) {
    lib.styles?.forEach(url => styleUrls.add(url));
    lib.scripts.forEach(url => scriptUrls.add(url));
  }

  const styles = Array.from(styleUrls)
    .map(url => `<link rel="stylesheet" href="${url}">`)
    .join("\n  ");

  const scripts = Array.from(scriptUrls)
    .map(url => `<script src="${url}"><\/script>`)
    .join("\n  ");

  return { styles, scripts };
}

/**
 * Generate the library list for the AI system prompt.
 */
export function getLibraryListForPrompt(): string {
  const byCategory: Record<string, CdnLibrary[]> = {};
  for (const lib of CDN_LIBRARIES) {
    if (!byCategory[lib.category]) byCategory[lib.category] = [];
    byCategory[lib.category].push(lib);
  }

  const categoryNames: Record<string, string> = {
    charts: "Grafice & Vizualizari",
    "3d": "3D & WebGL",
    animation: "Animatii",
    maps: "Harti",
    ui: "Componente UI",
    utils: "Utilitare",
    media: "Audio & Video",
    data: "Date (CSV, Excel)",
  };

  let prompt = "";
  for (const [cat, libs] of Object.entries(byCategory)) {
    prompt += `\n${categoryNames[cat] || cat}:\n`;
    for (const lib of libs) {
      const globals = lib.globals.length ? ` (global: ${lib.globals.join(", ")})` : "";
      prompt += `- ${lib.name}${globals} — ${lib.description}\n`;
    }
  }
  return prompt;
}
