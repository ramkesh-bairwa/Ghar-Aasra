// Turns a seller/admin-entered video URL into something the property page
// can render: a privacy-friendly YouTube / Vimeo embed, or a plain file URL
// (e.g. an uploaded /uploads/videos/x.mp4) for a native <video> element.

const YT_ID = /^[A-Za-z0-9_-]{6,20}$/;

function youTubeId(u) {
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") return u.pathname.split("/")[1] || null;
  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    if (u.pathname === "/watch") return u.searchParams.get("v");
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    if (m) return m[1];
  }
  return null;
}

function vimeoId(u) {
  const host = u.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  const m = u.pathname.match(/\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

// Background-video embed for a YouTube or Vimeo link: autoplaying, muted,
// looping, no controls. Returns null for anything else.
export function getBackgroundEmbed(url) {
  if (!url || typeof url !== "string") return null;
  let u;
  try { u = new URL(url.trim()); } catch { return null; }
  const yt = youTubeId(u);
  if (yt && YT_ID.test(yt)) {
    const p = "autoplay=1&mute=1&loop=1&controls=0&disablekb=1&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&fs=0";
    return { kind: "youtube", id: yt, src: `https://www.youtube-nocookie.com/embed/${yt}?${p}&playlist=${yt}`, thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` };
  }
  const vm = vimeoId(u);
  if (vm) return { kind: "vimeo", id: vm, src: `https://player.vimeo.com/video/${vm}?background=1&autoplay=1&muted=1&loop=1&dnt=1`, thumb: null };
  return null;
}

export function getVideoEmbed(url) {
  if (!url || typeof url !== "string") return null;
  const raw = url.trim();
  if (!raw) return null;
  let u = null;
  try {
    u = new URL(raw);
  } catch {
    // Relative path (uploaded file) — not an embeddable provider.
    return { kind: "file", embedUrl: raw };
  }
  const yt = youTubeId(u);
  if (yt && YT_ID.test(yt)) {
    return { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?rel=0` };
  }
  const vm = vimeoId(u);
  if (vm) return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${vm}` };
  return { kind: "file", embedUrl: raw };
}
