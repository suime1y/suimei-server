const STREAMS_DATA_PATH = "../data/streams.json";

const messages = {
  noLive: "\u73fe\u5728\u914d\u4fe1\u4e2d\u306e\u53c2\u52a0\u8005\u306f\u3044\u307e\u305b\u3093\u3002",
  noArchives: "\u6700\u8fd1\u306e\u30a2\u30fc\u30ab\u30a4\u30d6\u306f\u3042\u308a\u307e\u305b\u3093\u3002",
  loadFailed: "\u914d\u4fe1\u30c7\u30fc\u30bf\u3092\u8aad\u307f\u8fbc\u3081\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u6642\u9593\u3092\u304a\u3044\u3066\u518d\u8aad\u307f\u8fbc\u307f\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  watchLive: "\u914d\u4fe1\u3092\u898b\u308b",
  watchArchive: "\u30a2\u30fc\u30ab\u30a4\u30d6\u3092\u898b\u308b"
};

const liveContainer = document.querySelector("#live-streams");
const archiveContainer = document.querySelector("#archive-streams");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function renderEmpty(container, message) {
  container.innerHTML = `<p class="stream-state">${escapeHtml(message)}</p>`;
}

function renderLiveStreams(items = []) {
  if (!items.length) {
    renderEmpty(liveContainer, messages.noLive);
    return;
  }

  liveContainer.innerHTML = items.map((item) => `
    <article class="stream-card stream-card-live">
      <div class="stream-card-top">
        <span class="live-badge">LIVE</span>
        <span class="stream-platform">${escapeHtml(item.platform)}</span>
      </div>
      <h3 class="stream-title">${escapeHtml(item.title)}</h3>
      <p class="stream-meta">${escapeHtml(item.name)} / ${escapeHtml(item.game)}</p>
      <div class="stream-stats">
        <span>${Number(item.viewerCount || 0).toLocaleString("ja-JP")} viewers</span>
        <span>${formatTime(item.startedAt)} start</span>
      </div>
      <a class="stream-button" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${messages.watchLive}</a>
    </article>
  `).join("");
}

function renderArchives(items = []) {
  if (!items.length) {
    renderEmpty(archiveContainer, messages.noArchives);
    return;
  }

  archiveContainer.innerHTML = items.map((item) => `
    <article class="stream-card">
      <div class="stream-card-top">
        <span class="stream-platform">${escapeHtml(item.platform)}</span>
        <span class="stream-date">${formatDate(item.publishedAt)}</span>
      </div>
      <h3 class="stream-title">${escapeHtml(item.title)}</h3>
      <p class="stream-meta">${escapeHtml(item.name)}</p>
      <div class="stream-stats">
        <span>${escapeHtml(item.duration)}</span>
      </div>
      <a class="stream-button stream-button-secondary" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${messages.watchArchive}</a>
    </article>
  `).join("");
}

function renderError() {
  renderEmpty(liveContainer, messages.loadFailed);
  renderEmpty(archiveContainer, messages.loadFailed);
}

async function loadStreams() {
  try {
    const response = await fetch(STREAMS_DATA_PATH, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load streams data: ${response.status}`);
    }

    const data = await response.json();
    renderLiveStreams(data.live);
    renderArchives(data.archives);
  } catch (error) {
    console.error(error);
    renderError();
  }
}

loadStreams();
