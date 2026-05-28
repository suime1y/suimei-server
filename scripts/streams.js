const TWITCH_WORKER_API_URL = "https://suimei-twitch-api.suimeiy225.workers.dev/";

const messages = {
  loading: "配信情報を取得中...",
  loadFailed: "配信情報の取得に失敗しました",
  noStreamers: "表示できる配信者がいません。",
  live: "配信中",
  offline: "オフライン",
  latestArchive: "最新アーカイブ",
  noArchive: "アーカイブなし",
  watchLive: "Twitchで見る",
  watchArchive: "アーカイブを見る",
  gameUnset: "カテゴリ未設定"
};

const streamersContainer = document.querySelector("#streamers-list");
const statusContainer = document.querySelector("#twitch-api-status");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function normalizeThumbnail(url = "", width = 640, height = 360) {
  return String(url)
    .replace("%{width}", width)
    .replace("%{height}", height)
    .replace("{width}", width)
    .replace("{height}", height);
}

function twitchChannelUrl(login = "") {
  return `https://www.twitch.tv/${encodeURIComponent(login)}`;
}

function renderState(message) {
  streamersContainer.innerHTML = `<p class="stream-state">${escapeHtml(message)}</p>`;
}

function renderStatus(updatedAt) {
  if (!statusContainer) return;

  statusContainer.innerHTML = `
    <div class="twitch-api-panel">
      <p>最終更新: ${escapeHtml(formatDateTime(updatedAt))}</p>
    </div>
  `;
}

function renderThumbnail(url, alt) {
  if (!url) return "";

  return `
    <div class="stream-thumbnail-wrap">
      <img class="stream-thumbnail" src="${escapeHtml(normalizeThumbnail(url))}" alt="${escapeHtml(alt)}" loading="lazy">
    </div>
  `;
}

function renderLiveBlock(streamer) {
  const stream = streamer.stream || {};
  const title = stream.title || "タイトル未設定";
  const gameName = stream.gameName || messages.gameUnset;

  return `
    ${renderThumbnail(stream.thumbnailUrl, `${streamer.displayName} の配信サムネイル`)}
    <div class="stream-card-content">
      <h3 class="stream-title">${escapeHtml(title)}</h3>
      <p class="stream-meta">${escapeHtml(gameName)}</p>
      <div class="stream-stats">
        <span>${Number(stream.viewerCount || 0).toLocaleString("ja-JP")} viewers</span>
        <span>${escapeHtml(formatDateTime(stream.startedAt))} start</span>
      </div>
    </div>
    <a class="stream-button" href="${escapeHtml(twitchChannelUrl(streamer.login))}" target="_blank" rel="noopener noreferrer">${messages.watchLive}</a>
  `;
}

function renderArchiveBlock(streamer) {
  const archive = streamer.latestArchive;

  if (!archive) {
    return `<p class="stream-state-inline">${messages.noArchive}</p>`;
  }

  return `
    ${renderThumbnail(archive.thumbnailUrl, `${streamer.displayName} の最新アーカイブサムネイル`)}
    <div class="stream-card-content">
      <p class="stream-archive-label">${messages.latestArchive}</p>
      <h3 class="stream-title">${escapeHtml(archive.title || "タイトル未設定")}</h3>
      <div class="stream-stats">
        <span>${escapeHtml(formatDateTime(archive.createdAt))}</span>
        <span>${escapeHtml(archive.duration || "")}</span>
      </div>
    </div>
    <a class="stream-button stream-button-secondary" href="${escapeHtml(archive.url)}" target="_blank" rel="noopener noreferrer">${messages.watchArchive}</a>
  `;
}

function renderStreamerCard(streamer) {
  const displayName = streamer.displayName || streamer.login;
  const isLive = Boolean(streamer.isLive);

  return `
    <article class="stream-card stream-streamer-card ${isLive ? "stream-card-live" : "stream-card-offline"}">
      <div class="stream-card-top">
        <div class="streamer-profile">
          ${streamer.profileImageUrl ? `<img class="streamer-avatar" src="${escapeHtml(streamer.profileImageUrl)}" alt="${escapeHtml(displayName)}" loading="lazy">` : ""}
          <div>
            <h3 class="streamer-name">${escapeHtml(displayName)}</h3>
            <p class="streamer-login">@${escapeHtml(streamer.login)}</p>
          </div>
        </div>
        <span class="${isLive ? "live-badge" : "offline-badge"}">${isLive ? messages.live : messages.offline}</span>
      </div>
      ${isLive ? renderLiveBlock({ ...streamer, displayName }) : renderArchiveBlock({ ...streamer, displayName })}
    </article>
  `;
}

function renderStreamers(streamers = []) {
  if (!streamers.length) {
    renderState(messages.noStreamers);
    return;
  }

  const sortedStreamers = [...streamers].sort((a, b) => Number(b.isLive) - Number(a.isLive));
  streamersContainer.innerHTML = sortedStreamers.map(renderStreamerCard).join("");
}

async function loadStreams() {
  renderState(messages.loading);

  try {
    const response = await fetch(TWITCH_WORKER_API_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Worker API failed: ${response.status}`);
    }

    const data = await response.json();
    renderStatus(data.updatedAt);
    renderStreamers(Array.isArray(data.streamers) ? data.streamers : []);
  } catch (error) {
    console.error(error);
    if (statusContainer) statusContainer.innerHTML = "";
    renderState(messages.loadFailed);
  }
}

loadStreams();
