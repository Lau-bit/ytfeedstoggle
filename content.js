// Youtube feeds toggler v1
// Combines: homepage feed toggle, watch-page recommendations toggle
// Description hiding is handled entirely by blank.css (no JS needed)

(function () {
  'use strict';

  // =====================
  // HOMEPAGE FEED TOGGLE
  // =====================

  let feedIsHidden = true;
  let feedToggleButton = null;
  let feedStyleElement = null;

  // Positioned below masthead (~56px) + category chips (~56px) + padding
  const BASE_TOP = 130;

  const HIDE_FEED_CSS = `
  ytd-browse[page-subtype="home"] ytd-rich-grid-renderer #contents.ytd-rich-grid-renderer {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    height: 0 !important;
    overflow: hidden !important;
  }
`;

  function isHomePage() {
    const path = location.pathname;
    return path === '/' || path === '';
  }

  function createFeedStyleElement() {
    if (!feedStyleElement) {
      feedStyleElement = document.createElement('style');
      feedStyleElement.id = 'yt-feed-toggle-style';
      feedStyleElement.textContent = HIDE_FEED_CSS;
    }
  }

  function hideFeed() {
    createFeedStyleElement();
    if (!feedStyleElement.parentNode) {
      (document.head || document.documentElement).appendChild(feedStyleElement);
    }
    feedIsHidden = true;
    applyShowFeedButtonStyle();
  }

  function showFeed() {
    removeFeedHideStyle();
    feedIsHidden = false;
    applyHideFeedButtonStyle();
  }

  function removeFeedHideStyle() {
    if (feedStyleElement && feedStyleElement.parentNode) {
      feedStyleElement.parentNode.removeChild(feedStyleElement);
    }
  }

  function createFeedToggleButton() {
    if (feedToggleButton && document.body.contains(feedToggleButton)) {
      feedToggleButton.style.display = 'flex';
      return;
    }

    feedToggleButton = document.createElement('button');
    feedToggleButton.id = 'yt-feed-toggle-btn';
    feedToggleButton.type = 'button';
    feedToggleButton.textContent = 'Show Feed';
    feedToggleButton.setAttribute('aria-label', 'Show or hide YouTube homepage feed');

    Object.assign(feedToggleButton.style, {
      position: 'fixed',
      top: BASE_TOP + 'px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '9999',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: '"Roboto", "Arial", sans-serif',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.1s, height 0.2s, padding 0.2s, top 0.2s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '240px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    });

    feedToggleButton.addEventListener('click', () => {
      if (feedIsHidden) {
        showFeed();
      } else {
        hideFeed();
      }
    });

    document.body.appendChild(feedToggleButton);

    if (feedIsHidden) {
      applyShowFeedButtonStyle();
    } else {
      applyHideFeedButtonStyle();
    }

    updateFeedButtonTheme();
  }

  function hideFeedButton() {
    if (feedToggleButton) {
      feedToggleButton.style.display = 'none';
    }
  }

  function applyShowFeedButtonStyle() {
    if (!feedToggleButton) return;
    feedToggleButton.textContent = 'Show Feed';
    feedToggleButton.style.padding = '12px 24px';
    feedToggleButton.style.fontSize = '14px';
    feedToggleButton.style.top = BASE_TOP + 'px';
    feedToggleButton.style.height = '';
  }

  function applyHideFeedButtonStyle() {
    if (!feedToggleButton) return;
    feedToggleButton.textContent = '___';
    feedToggleButton.style.padding = '4px 12px';
    feedToggleButton.style.fontSize = '12px';
    feedToggleButton.style.top = '10px';
    feedToggleButton.style.height = '';
  }

  function isDarkTheme() {
    try {
      if (document.documentElement.hasAttribute('dark')) return true;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    } catch (e) {}
    return false;
  }

  function updateFeedButtonTheme() {
    if (!feedToggleButton) return;
    if (isDarkTheme()) {
      feedToggleButton.style.backgroundColor = '#272727';
      feedToggleButton.style.color = '#ffffff';
      feedToggleButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
    } else {
      feedToggleButton.style.backgroundColor = '#f1f1f1';
      feedToggleButton.style.color = '#0f0f0f';
      feedToggleButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
    }
  }

  function handleFeedPage() {
    createFeedToggleButton();
    if (feedIsHidden) {
      hideFeed();
    } else {
      showFeed();
    }
    updateFeedButtonTheme();
  }

  function attachLogoClickListener() {
    const logoLink = document.querySelector('ytd-topbar-logo-renderer a#logo');
    if (logoLink && !logoLink._ytFeedToggleAttached) {
      logoLink.addEventListener('click', () => {
        feedIsHidden = true;
      });
      logoLink._ytFeedToggleAttached = true;
    }
  }

  // ================================
  // WATCH PAGE RECOMMENDATIONS TOGGLE
  // ================================

  let recsObserver = null;
  let recsIsActive = false;
  let recsResizeTimer = null;
  let recsWatchPageKey = null;
  let toggleState = {
    recommendations: null,
    toggleContainer: null,
    button: null,
    spacer: null,
    isHidden: true,
  };

  function onWatchPage() {
    return location.pathname.startsWith('/watch');
  }

  function getWatchPageKey() {
    return onWatchPage() ? (getVideoId() || location.href) : null;
  }

  function getDirectChildOf(parent, descendant) {
    let node = descendant;
    while (node && node.parentNode !== parent) {
      node = node.parentNode;
    }
    return node && node.parentNode === parent ? node : null;
  }

  function safeInsertBefore(parent, node, referenceNode) {
    if (!parent || !node) return false;
    if (referenceNode && referenceNode.parentNode === parent) {
      parent.insertBefore(node, referenceNode);
    } else {
      parent.appendChild(node);
    }
    return true;
  }

  function getOrCreateToggleRow() {
    let row = document.getElementById('yt-ext-toggle-row');
    if (row && document.body.contains(row)) return row;
    const below = document.querySelector('#below');
    if (!below) return null;
    row = document.createElement('div');
    row.id = 'yt-ext-toggle-row';
    const metadata = below.querySelector('ytd-watch-metadata');
    const metadataChild = metadata ? getDirectChildOf(below, metadata) : null;
    const referenceNode = metadataChild ? metadataChild.nextSibling : below.firstElementChild;
    return safeInsertBefore(below, row, referenceNode) ? row : null;
  }

  function cleanupToggleRowIfEmpty() {
    const row = document.getElementById('yt-ext-toggle-row');
    if (row && row.children.length === 0) row.remove();
  }

  function initRecsToggle(recommendations) {
    if (!recommendations || recommendations.dataset.toggleInitialized === 'true') return;

    const parent = recommendations.parentElement;
    if (!parent) return;

    if (toggleState.recommendations && toggleState.recommendations !== recommendations) {
      cleanupRecsToggle();
    }

    recommendations.dataset.toggleInitialized = 'true';
    toggleState.recommendations = recommendations;

    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.justifyContent = 'flex-end';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.margin = '8px 0';

    const toggleButton = document.createElement('button');
    toggleButton.className = 'yt-toggle-button';
    toggleButton.textContent = 'Show recommendations';

    toggleContainer.appendChild(toggleButton);

    toggleState.toggleContainer = toggleContainer;
    toggleState.button = toggleButton;
    toggleState.spacer = null;
    toggleState.isHidden = true;

    const row = getOrCreateToggleRow();
    if (row) {
      row.appendChild(toggleContainer);
    } else {
      safeInsertBefore(parent, toggleContainer, parent.firstElementChild);
    }

    recommendations.style.display = 'none';

    toggleButton.addEventListener('click', () => {
      const { recommendations: recs } = toggleState;
      if (!recs) return;

      toggleState.isHidden = !toggleState.isHidden;

      if (toggleState.isHidden) {
        recs.style.display = 'none';
        toggleButton.textContent = 'Show recommendations';
      } else {
        recs.style.display = '';
        toggleButton.textContent = 'Hide recommendations';
      }
    });
  }

  function cleanupRecsToggle() {
    const { recommendations, toggleContainer } = toggleState;
    if (recommendations) {
      recommendations.style.display = '';
      delete recommendations.dataset.toggleInitialized;
    }
    if (toggleContainer) { toggleContainer.remove(); cleanupToggleRowIfEmpty(); }
    toggleState.recommendations = null;
    toggleState.toggleContainer = null;
    toggleState.button = null;
    toggleState.spacer = null;
    toggleState.isHidden = true;
  }

  function stopWatchingRecommendations() {
    if (recsObserver) {
      recsObserver.disconnect();
      recsObserver = null;
    }
  }

  function watchForRecommendations() {
    if (!onWatchPage()) return;

    const existing = document.querySelector('#related');
    if (existing) initRecsToggle(existing);

    stopWatchingRecommendations();

    recsObserver = new MutationObserver(() => {
      if (!onWatchPage()) return;
      const recs = document.querySelector('#related');
      if (recs && recs.dataset.toggleInitialized !== 'true') {
        initRecsToggle(recs);
      }
    });

    recsObserver.observe(document.body, { childList: true, subtree: true });
  }

  function handleRecsResize() {
    if (!onWatchPage() || !recsIsActive) return;
    const { toggleContainer } = toggleState;
    if (!toggleContainer) return;
    const inDOM = document.body.contains(toggleContainer);
    const rect = toggleContainer.getBoundingClientRect();
    if (!inDOM || (rect.width === 0 && rect.height === 0)) {
      cleanupRecsToggle();
      const recs = document.querySelector('#related');
      if (recs) initRecsToggle(recs);
    }
  }

  function debouncedRecsResize() {
    clearTimeout(recsResizeTimer);
    recsResizeTimer = setTimeout(handleRecsResize, 300);
  }

  function activateForWatchPage() {
    if (!onWatchPage()) return;
    const watchPageKey = getWatchPageKey();
    if (recsIsActive && recsWatchPageKey === watchPageKey) return;
    if (recsIsActive) {
      stopWatchingRecommendations();
      cleanupRecsToggle();
    }
    recsIsActive = true;
    recsWatchPageKey = watchPageKey;
    watchForRecommendations();
    window.removeEventListener('resize', debouncedRecsResize);
    window.addEventListener('resize', debouncedRecsResize);
  }

  function deactivateRecsForNonWatchPage() {
    if (!recsIsActive) return;
    recsIsActive = false;
    recsWatchPageKey = null;
    stopWatchingRecommendations();
    cleanupRecsToggle();
    window.removeEventListener('resize', debouncedRecsResize);
    clearTimeout(recsResizeTimer);
  }

  // =====================
  // COMMENTS TOGGLE
  // =====================

  let commentsObserver = null;
  let commentsPageObserver = null;
  let commentsIsActive = false;
  let commentsToggleState = {
    comments: null,
    button: null,
    spacer: null,
    isHidden: true,
  };

  function initCommentsToggle(commentsSection) {
    if (!commentsSection || commentsSection.dataset.commentsToggleInitialized === 'true') return;

    const parent = commentsSection.parentNode;
    if (!parent) return;

    commentsSection.dataset.commentsToggleInitialized = 'true';

    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Show Comments';
    toggleButton.classList.add('yt-comments-toggle-button');

    const spacer = document.createElement('div');
    spacer.classList.add('yt-comments-spacer');
    spacer.style.height = '1666px';
    spacer.style.display = 'block';

    const row = getOrCreateToggleRow();
    if (row) {
      row.appendChild(toggleButton);
    } else {
      safeInsertBefore(parent, toggleButton, commentsSection);
    }
    safeInsertBefore(parent, spacer, commentsSection);

    commentsSection.style.display = 'none';
    commentsToggleState.isHidden = true;
    commentsToggleState.comments = commentsSection;
    commentsToggleState.button = toggleButton;
    commentsToggleState.spacer = spacer;

    toggleButton.addEventListener('click', () => {
      commentsToggleState.isHidden = !commentsToggleState.isHidden;
      if (commentsToggleState.isHidden) {
        commentsSection.style.display = 'none';
        spacer.style.display = 'block';
        toggleButton.textContent = 'Show Comments';
      } else {
        commentsSection.style.display = '';
        spacer.style.display = 'none';
        toggleButton.textContent = 'Hide Comments';
      }
    });
  }

  function cleanupCommentsToggle() {
    const { comments, button, spacer } = commentsToggleState;
    if (button && button.parentNode) { button.parentNode.removeChild(button); cleanupToggleRowIfEmpty(); }
    if (spacer && spacer.parentNode) spacer.parentNode.removeChild(spacer);
    if (comments) {
      comments.style.display = '';
      delete comments.dataset.commentsToggleInitialized;
    }
    commentsToggleState.comments = null;
    commentsToggleState.button = null;
    commentsToggleState.spacer = null;
    commentsToggleState.isHidden = true;
  }

  function watchForComments() {
    if (!onWatchPage()) return;

    const existing = document.querySelector('#comments');
    if (existing) {
      initCommentsToggle(existing);
      return;
    }

    if (commentsObserver) {
      commentsObserver.disconnect();
      commentsObserver = null;
    }

    commentsObserver = new MutationObserver(() => {
      const comments = document.querySelector('#comments');
      if (comments && comments.children.length > 0) {
        initCommentsToggle(comments);
        commentsObserver.disconnect();
        commentsObserver = null;
      }
    });

    commentsObserver.observe(document.body, { childList: true, subtree: true });
  }

  function activateCommentsForWatchPage() {
    if (commentsIsActive) return;
    commentsIsActive = true;
    watchForComments();

    if (commentsPageObserver) {
      commentsPageObserver.observe(document.body, { childList: true, subtree: false });
    }
  }

  function deactivateCommentsForNonWatchPage() {
    if (!commentsIsActive) return;
    commentsIsActive = false;
    if (commentsObserver) {
      commentsObserver.disconnect();
      commentsObserver = null;
    }
    if (commentsPageObserver) commentsPageObserver.disconnect();
    cleanupCommentsToggle();
  }

  // =====================
  // PLAYER LIKE BUTTONS
  // =====================

  const LIKE_SVG = `<svg viewBox="0 0 24 24"><path d="M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43 c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z M7,20H4v-8h3V20z M19.98,13.17l-1.34,6 C18.54,19.65,18.03,20,17.43,20H8v-8.61l5.6-6.06C13.79,5.12,14.08,5,14.38,5c0.26,0,0.5,0.11,0.63,0.3 c0.07,0.1,0.15,0.26,0.09,0.47l-1.52,4.94L13.18,12h1.35h4.23c0.41,0,0.8,0.17,1.03,0.46C19.92,12.61,20.05,12.86,19.98,13.17z"/></svg>`;
  const DISLIKE_SVG = `<svg viewBox="0 0 24 24"><path d="M17,4h-1H6.57C5.5,4,4.59,4.67,4.38,5.61l-1.34,6C2.77,12.85,3.82,14,5.23,14h4.23l-1.52,4.94C7.62,19.97,8.46,21,9.62,21 c0.58,0,1.14-0.24,1.52-0.65L17,14h4V4H17z M10.4,19.67C10.21,19.88,9.92,20,9.62,20c-0.26,0-0.5-0.11-0.63-0.3 c-0.07-0.1-0.15-0.26-0.09-0.47l1.52-4.94l0.4-1.29H9.46H5.23c-0.41,0-0.8-0.17-1.03-0.46c-0.12-0.15-0.25-0.4-0.18-0.72l1.34-6 C5.46,5.35,5.97,5,6.57,5H16v8.61L10.4,19.67z M20,13h-3V5h3V13z"/></svg>`;
  const PLAYLIST_AUTOPLAY_ON_SVG = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z"/><path d="M4 5h2v14H4z"/></svg>`;
  const PLAYLIST_AUTOPLAY_OFF_SVG = `<svg viewBox="0 0 24 24"><path d="M5.41 4 4 5.41l4 4V19l6.28-4 4.31 4.31L20 17.9 5.41 4zM10 14.55v-3.14l2.52 2.52L10 14.55z"/><path d="M10.94 5.6 19 12l-3.42 2.18-1.45-1.45L15.2 12 10 8.69V6.34l.94-.74z"/></svg>`;
  const PLAYLIST_AUTOPLAY_STOP_SECONDS = 1.5;
  const PLAYLIST_AUTOPLAY_STATE_KEY = 'ytfeedstoggle-playlist-autoplay-enabled';

  let currentVideoId = null;
  let playerButtonsContainer = null;
  let playerButtonsAreActive = false;
  let playerPageObserver = null;
  let playerUrlObserver = null;
  let playlistAutoplayPlayButtonHandler = null;
  let playlistAutoplayReplayButtonHandler = null;
  let playlistAutoplayKeyHandler = null;
  let playlistAutoplayEnabled = true;
  let playlistAutoplayBypassVideoId = null;
  let playlistAutoplayVideo = null;
  let playlistAutoplayEndedHandler = null;
  let playlistAutoplayTimeUpdateHandler = null;
  let playlistAutoplayDurationChangeHandler = null;
  let playlistAutoplaySeekingHandler = null;
  let playlistAutoplaySeekedHandler = null;
  let playlistAutoplayIsSeeking = false;

  function getVideoId() {
    return new URLSearchParams(window.location.search).get('v');
  }

  function onPlaylistWatchPage() {
    return onWatchPage() && (
      new URLSearchParams(window.location.search).has('list') ||
      !!document.querySelector('.ytp-next-button.ytp-playlist-ui')
    );
  }

  function getNativeAutonavToggle() {
    return document.querySelector('.ytp-autonav-toggle-button');
  }

  function onAutoplayWatchPage() {
    return onWatchPage() && (onPlaylistWatchPage() || !!getNativeAutonavToggle());
  }

  function getLikeButton() {
    return document.querySelector('like-button-view-model button');
  }

  function getDislikeButton() {
    return document.querySelector('dislike-button-view-model button');
  }

  function getLikeStatus() {
    const liked = getLikeButton()?.getAttribute('aria-pressed') === 'true';
    const disliked = getDislikeButton()?.getAttribute('aria-pressed') === 'true';
    return { liked, disliked };
  }

  function setAttributeIfChanged(element, name, value) {
    if (element.getAttribute(name) !== value) {
      element.setAttribute(name, value);
    }
  }

  function updatePlayerButtonStates() {
    if (!playerButtonsContainer) return;
    const likeBtn = playerButtonsContainer.querySelector('.ytp-like-btn');
    const dislikeBtn = playerButtonsContainer.querySelector('.ytp-dislike-btn');
    const autoplayBtn = playerButtonsContainer.querySelector('.ytp-playlist-autoplay-btn');
    if (!likeBtn || !dislikeBtn) return;
    const status = getLikeStatus();
    likeBtn.classList.toggle('active', status.liked);
    dislikeBtn.classList.toggle('active', status.disliked);

    if (autoplayBtn) {
      const autoplayState = playlistAutoplayEnabled ? 'on' : 'off';
      autoplayBtn.classList.toggle('active', playlistAutoplayEnabled);
      autoplayBtn.classList.toggle('disabled', !playlistAutoplayEnabled);

      if (autoplayBtn.dataset.autoplayState !== autoplayState) {
        autoplayBtn.dataset.autoplayState = autoplayState;
        autoplayBtn.innerHTML = playlistAutoplayEnabled ? PLAYLIST_AUTOPLAY_ON_SVG : PLAYLIST_AUTOPLAY_OFF_SVG;
      }

      const title = playlistAutoplayEnabled ? 'Next video autoplay on' : 'Next video autoplay off';
      autoplayBtn.title = title;
      setAttributeIfChanged(
        autoplayBtn,
        'aria-label',
        playlistAutoplayEnabled ? 'Turn next video autoplay off' : 'Turn next video autoplay on'
      );
      setAttributeIfChanged(autoplayBtn, 'aria-pressed', String(playlistAutoplayEnabled));
    }
  }

  function savePlaylistAutoplayState() {
    try {
      sessionStorage.setItem(PLAYLIST_AUTOPLAY_STATE_KEY, playlistAutoplayEnabled ? 'true' : 'false');
    } catch (e) {}
  }

  function loadPlaylistAutoplayState(callback) {
    try {
      const storedValue = sessionStorage.getItem(PLAYLIST_AUTOPLAY_STATE_KEY);
      playlistAutoplayEnabled = storedValue === null ? true : storedValue !== 'false';
    } catch (e) {
      playlistAutoplayEnabled = true;
    }

    if (callback) callback();
  }

  function isPlaylistAutoplayBlockApplied() {
    return !playlistAutoplayEnabled && playlistAutoplayBypassVideoId !== getVideoId();
  }

  function getPlayerVideo() {
    return document.querySelector('#movie_player video.html5-main-video') ||
      document.querySelector('video.html5-main-video') ||
      document.querySelector('#movie_player video');
  }

  function detachPlaylistAutoplayGuard() {
    if (playlistAutoplayVideo && playlistAutoplayEndedHandler) {
      playlistAutoplayVideo.removeEventListener('ended', playlistAutoplayEndedHandler, true);
    }
    if (playlistAutoplayVideo && playlistAutoplayTimeUpdateHandler) {
      playlistAutoplayVideo.removeEventListener('timeupdate', playlistAutoplayTimeUpdateHandler, true);
    }
    if (playlistAutoplayVideo && playlistAutoplayDurationChangeHandler) {
      playlistAutoplayVideo.removeEventListener('durationchange', playlistAutoplayDurationChangeHandler, true);
    }
    if (playlistAutoplayVideo && playlistAutoplaySeekingHandler) {
      playlistAutoplayVideo.removeEventListener('seeking', playlistAutoplaySeekingHandler, true);
    }
    if (playlistAutoplayVideo && playlistAutoplaySeekedHandler) {
      playlistAutoplayVideo.removeEventListener('seeked', playlistAutoplaySeekedHandler, true);
    }
    playlistAutoplayVideo = null;
    playlistAutoplayEndedHandler = null;
    playlistAutoplayTimeUpdateHandler = null;
    playlistAutoplayDurationChangeHandler = null;
    playlistAutoplaySeekingHandler = null;
    playlistAutoplaySeekedHandler = null;
    playlistAutoplayIsSeeking = false;
  }

  function stopBeforePlaylistAdvance(video) {
    if (!isPlaylistAutoplayBlockApplied() || !onAutoplayWatchPage()) return;
    if (playlistAutoplayIsSeeking || video.seeking) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;

    const remaining = video.duration - video.currentTime;
    if (remaining > PLAYLIST_AUTOPLAY_STOP_SECONDS || remaining < 0) return;

    video.pause();
    video.currentTime = Math.max(0, video.duration - PLAYLIST_AUTOPLAY_STOP_SECONDS);
  }

  function isNearPlaylistAutoplayStop(video) {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return false;
    const remaining = video.duration - video.currentTime;
    return remaining >= 0 && remaining <= PLAYLIST_AUTOPLAY_STOP_SECONDS + 2;
  }

  function maybeReapplyBlockAfterSeek(video) {
    if (playlistAutoplayEnabled || playlistAutoplayBypassVideoId !== getVideoId()) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;

    const remaining = video.duration - video.currentTime;
    if (remaining <= PLAYLIST_AUTOPLAY_STOP_SECONDS + 2) return;

    playlistAutoplayBypassVideoId = null;
    attachPlaylistAutoplayGuard();
    updatePlayerButtonStates();
  }

  function attachPlaylistAutoplayGuard() {
    const video = getPlayerVideo();
    if (!video || playlistAutoplayVideo === video) return;

    detachPlaylistAutoplayGuard();

    playlistAutoplayVideo = video;
    playlistAutoplayTimeUpdateHandler = () => {
      maybeReapplyBlockAfterSeek(video);
      stopBeforePlaylistAdvance(video);
    };
    playlistAutoplayDurationChangeHandler = () => {
      stopBeforePlaylistAdvance(video);
    };
    playlistAutoplaySeekingHandler = () => {
      playlistAutoplayIsSeeking = true;
    };
    playlistAutoplaySeekedHandler = () => {
      playlistAutoplayIsSeeking = false;
      maybeReapplyBlockAfterSeek(video);
    };
    playlistAutoplayEndedHandler = (event) => {
      if (!isPlaylistAutoplayBlockApplied() || !onAutoplayWatchPage()) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      video.pause();

      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.max(0, video.duration - 0.2);
      }
    };

    video.addEventListener('timeupdate', playlistAutoplayTimeUpdateHandler, true);
    video.addEventListener('durationchange', playlistAutoplayDurationChangeHandler, true);
    video.addEventListener('seeking', playlistAutoplaySeekingHandler, true);
    video.addEventListener('seeked', playlistAutoplaySeekedHandler, true);
    video.addEventListener('ended', playlistAutoplayEndedHandler, true);
  }

  function applyPlaylistAutoplayState() {
    if (!onAutoplayWatchPage()) {
      detachPlaylistAutoplayGuard();
      updatePlayerButtonStates();
      return;
    }

    attachPlaylistAutoplayGuard();
    updatePlayerButtonStates();
  }

  function togglePlaylistAutoplay() {
    playlistAutoplayEnabled = !playlistAutoplayEnabled;
    playlistAutoplayBypassVideoId = null;
    savePlaylistAutoplayState();
    applyPlaylistAutoplayState();
  }

  function allowPlaylistAutoplayFromUserPlaybackIntent() {
    if (!isPlaylistAutoplayBlockApplied() || !onAutoplayWatchPage()) return;

    playlistAutoplayBypassVideoId = getVideoId();
    attachPlaylistAutoplayGuard();
    updatePlayerButtonStates();
  }

  function allowPlaylistAutoplayFromPlayButton(event) {
    if (!event.target.closest?.('.ytp-play-button, video.html5-main-video')) return;
    allowPlaylistAutoplayFromUserPlaybackIntent();
  }

  function replayCurrentVideoWhenBlocked(event) {
    const replayButton = event.target.closest?.('.ytp-prev-button');
    if (!replayButton || !isPlaylistAutoplayBlockApplied() || !onPlaylistWatchPage()) return;

    const video = getPlayerVideo();
    if (!video || !isNearPlaylistAutoplayStop(video)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    video.currentTime = 0;
    video.play().catch(() => {});
    attachPlaylistAutoplayGuard();
    updatePlayerButtonStates();
  }

  function allowPlaylistAutoplayFromKeyboard(event) {
    if (event.defaultPrevented) return;
    if (event.code !== 'Space' && event.code !== 'KeyK') return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    const target = event.target;
    if (
      target?.closest?.('input, textarea, [contenteditable="true"], yt-searchbox') ||
      target?.isContentEditable
    ) {
      return;
    }

    allowPlaylistAutoplayFromUserPlaybackIntent();
  }

  function clickOriginalLikeButton(type) {
    const button = type === 'like' ? getLikeButton() : getDislikeButton();
    if (button) {
      button.click();
      setTimeout(updatePlayerButtonStates, 300);
      setTimeout(updatePlayerButtonStates, 600);
    }
  }

  function createPlayerButtons() {
    if (playerButtonsContainer) playerButtonsContainer.remove();

    playerButtonsContainer = document.createElement('div');
    playerButtonsContainer.className = 'ytp-like-dislike-container';

    const likeBtn = document.createElement('button');
    likeBtn.className = 'ytp-like-btn ytp-button';
    likeBtn.innerHTML = LIKE_SVG;
    likeBtn.title = 'Like';
    likeBtn.addEventListener('click', (e) => { e.stopPropagation(); clickOriginalLikeButton('like'); });

    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'ytp-dislike-btn ytp-button';
    dislikeBtn.innerHTML = DISLIKE_SVG;
    dislikeBtn.title = 'Dislike';
    dislikeBtn.addEventListener('click', (e) => { e.stopPropagation(); clickOriginalLikeButton('dislike'); });

    playerButtonsContainer.appendChild(likeBtn);
    playerButtonsContainer.appendChild(dislikeBtn);

    if (onAutoplayWatchPage()) {
      const autoplayBtn = document.createElement('button');
      autoplayBtn.className = 'ytp-playlist-autoplay-btn ytp-button';
      autoplayBtn.type = 'button';
      autoplayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlaylistAutoplay();
      });
      playerButtonsContainer.appendChild(autoplayBtn);
    }

    updatePlayerButtonStates();
    return playerButtonsContainer;
  }

  function injectPlayerButtons() {
    if (!onWatchPage()) return;

    const videoId = getVideoId();
    if (!videoId) return;

    if (document.querySelector('.ytp-like-dislike-container')) {
      const hasAutoplayButton = !!document.querySelector('.ytp-playlist-autoplay-btn');
      if (hasAutoplayButton !== onAutoplayWatchPage()) {
        document.querySelector('.ytp-like-dislike-container')?.remove();
      } else if (videoId !== currentVideoId) {
        if (playlistAutoplayBypassVideoId !== videoId) {
          playlistAutoplayBypassVideoId = null;
        }
        currentVideoId = videoId;
        updatePlayerButtonStates();
        applyPlaylistAutoplayState();
        return;
      } else {
        applyPlaylistAutoplayState();
        return;
      }
    }

    if (document.querySelector('.ytp-like-dislike-container')) {
      if (videoId !== currentVideoId) {
        currentVideoId = videoId;
        updatePlayerButtonStates();
      }
      return;
    }

    const leftControls = document.querySelector('.ytp-left-controls');
    if (!leftControls) return;

    currentVideoId = videoId;
    if (playlistAutoplayBypassVideoId !== videoId) {
      playlistAutoplayBypassVideoId = null;
    }
    leftControls.appendChild(createPlayerButtons());
    applyPlaylistAutoplayState();
    setTimeout(updatePlayerButtonStates, 1000);
  }

  function activatePlayerLikeButtonsForWatchPage() {
    if (!onWatchPage() || playerButtonsAreActive) return;
    playerButtonsAreActive = true;

    loadPlaylistAutoplayState(() => {
      injectPlayerButtons();
      applyPlaylistAutoplayState();
    });

    playerPageObserver = new MutationObserver((mutations) => {
      if (!onWatchPage() || !getVideoId()) return;

      injectPlayerButtons();
      applyPlaylistAutoplayState();
      for (const mutation of mutations) {
        if (mutation.target.closest?.('like-button-view-model') ||
            mutation.target.closest?.('dislike-button-view-model') ||
            mutation.attributeName === 'aria-pressed') {
          updatePlayerButtonStates();
          break;
        }
      }
    });
    playerPageObserver.observe(document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed']
    });

    let lastUrl = location.href;
    playerUrlObserver = new MutationObserver(() => {
      if (!onWatchPage()) return;
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(injectPlayerButtons, 500);
      }
    });
    playerUrlObserver.observe(document.body, { childList: true, subtree: true });

    playlistAutoplayPlayButtonHandler = allowPlaylistAutoplayFromPlayButton;
    document.addEventListener('click', playlistAutoplayPlayButtonHandler, true);
    playlistAutoplayReplayButtonHandler = replayCurrentVideoWhenBlocked;
    document.addEventListener('click', playlistAutoplayReplayButtonHandler, true);
    playlistAutoplayKeyHandler = allowPlaylistAutoplayFromKeyboard;
    document.addEventListener('keydown', playlistAutoplayKeyHandler, true);
  }

  function deactivatePlayerLikeButtonsForNonWatchPage() {
    if (!playerButtonsAreActive) return;
    playerButtonsAreActive = false;

    if (playerPageObserver) {
      playerPageObserver.disconnect();
      playerPageObserver = null;
    }
    if (playerUrlObserver) {
      playerUrlObserver.disconnect();
      playerUrlObserver = null;
    }
    if (playerButtonsContainer) {
      playerButtonsContainer.remove();
      playerButtonsContainer = null;
    }
    if (playlistAutoplayPlayButtonHandler) {
      document.removeEventListener('click', playlistAutoplayPlayButtonHandler, true);
      playlistAutoplayPlayButtonHandler = null;
    }
    if (playlistAutoplayReplayButtonHandler) {
      document.removeEventListener('click', playlistAutoplayReplayButtonHandler, true);
      playlistAutoplayReplayButtonHandler = null;
    }
    if (playlistAutoplayKeyHandler) {
      document.removeEventListener('keydown', playlistAutoplayKeyHandler, true);
      playlistAutoplayKeyHandler = null;
    }
    detachPlaylistAutoplayGuard();
    currentVideoId = null;
  }

  // =====================
  // CONTROLS TOGGLE (Shift+Q, watch pages)
  // =====================

  function isContextValid() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  function safeSendMessage(message, callback, retries = 2) {
    if (!isContextValid()) return;
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          if (retries > 0) {
            setTimeout(() => safeSendMessage(message, callback, retries - 1), 250);
          }
          return;
        }
        if (callback) callback(response);
      });
    } catch (e) {}
  }

  const CONTROLS_TOGGLE_SELECTORS = [
    '.ytp-chrome-bottom',
    '.ytp-chrome-controls',
    '.ytp-progress-bar-container',
    '.ytp-fullscreen-metadata',
    '.ytp-fullscreen-quick-actions',
    'yt-player-overlay-video-details-renderer',
    'yt-player-quick-action-buttons',
    '.ytp-fullscreen-grid-buttons-container',
    'button.ytp-playlist-menu-button'
  ];

  const CONTROLS_REMOVE_SELECTORS = [
    '#movie_player .ytp-ce-hide-button-container'
  ];

  let controlsAreVisible = true;
  let controlsAreActive = false;
  let controlsMutationObserver = null;
  let controlsApplyFrame = null;
  let controlsMouseDownHandler = null;
  let controlsKeyDownHandler = null;
  let controlsMessageHandler = null;

  function getControlsToggleTargets() {
    return document.querySelectorAll(CONTROLS_TOGGLE_SELECTORS.join(','));
  }

  function getControlsRemoveTargets() {
    return document.querySelectorAll(CONTROLS_REMOVE_SELECTORS.join(','));
  }

  function applyControlsVisibility(visible) {
    controlsAreVisible = visible;
    document.documentElement.classList.toggle('yt-controls-hidden', !visible);

    getControlsToggleTargets().forEach(element => {
      if (visible) {
        element.style.removeProperty('opacity');
        element.style.removeProperty('pointer-events');
      } else {
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';
      }
    });

    getControlsRemoveTargets().forEach(element => {
      if (visible) {
        element.style.removeProperty('display');
        element.style.removeProperty('visibility');
        element.style.removeProperty('pointer-events');
      } else {
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.pointerEvents = 'none';
      }
    });
  }

  function scheduleControlsVisibilityRefresh() {
    if (controlsAreVisible || controlsApplyFrame) return;
    controlsApplyFrame = requestAnimationFrame(() => {
      controlsApplyFrame = null;
      applyControlsVisibility(false);
    });
  }

  function activateControlsToggleForWatchPage() {
    if (!onWatchPage() || controlsAreActive) return;
    controlsAreActive = true;

    safeSendMessage({ action: 'getControlsState' }, (response) => {
      if (response) applyControlsVisibility(response.visible);
    });

    controlsMutationObserver = new MutationObserver(scheduleControlsVisibilityRefresh);
    controlsMutationObserver.observe(document.body, { childList: true, subtree: true });

    controlsMouseDownHandler = (e) => {
      if (e.button === 1) safeSendMessage({ action: 'ping' });
    };
    document.addEventListener('mousedown', controlsMouseDownHandler);

    controlsKeyDownHandler = (e) => {
      if (e.shiftKey && e.code === 'KeyQ') {
        safeSendMessage({ action: 'toggleControls' });
      }
    };
    document.addEventListener('keydown', controlsKeyDownHandler);

    try {
      controlsMessageHandler = (message, sender, sendResponse) => {
        if (!isContextValid()) return;
        if (message.action === 'setControlsVisibility') {
          applyControlsVisibility(message.visible);
          sendResponse({ success: true });
        }
        return true;
      };
      chrome.runtime.onMessage.addListener(controlsMessageHandler);
    } catch (e) {}
  }

  function deactivateControlsToggleForNonWatchPage() {
    if (!controlsAreActive) return;
    controlsAreActive = false;

    if (controlsMutationObserver) {
      controlsMutationObserver.disconnect();
      controlsMutationObserver = null;
    }
    if (controlsApplyFrame) {
      cancelAnimationFrame(controlsApplyFrame);
      controlsApplyFrame = null;
    }
    if (controlsMouseDownHandler) {
      document.removeEventListener('mousedown', controlsMouseDownHandler);
      controlsMouseDownHandler = null;
    }
    if (controlsKeyDownHandler) {
      document.removeEventListener('keydown', controlsKeyDownHandler);
      controlsKeyDownHandler = null;
    }
    if (controlsMessageHandler) {
      try {
        chrome.runtime.onMessage.removeListener(controlsMessageHandler);
      } catch (e) {}
      controlsMessageHandler = null;
    }
    applyControlsVisibility(true);
  }

  // =====================
  // SHARED NAVIGATION
  // =====================

  function handleNavigation() {
    if (isHomePage()) {
      deactivateRecsForNonWatchPage();
      deactivateCommentsForNonWatchPage();
      deactivatePlayerLikeButtonsForNonWatchPage();
      deactivateControlsToggleForNonWatchPage();
      handleFeedPage();
    } else if (onWatchPage()) {
      hideFeedButton();
      removeFeedHideStyle();
      activateForWatchPage();
      activateCommentsForWatchPage();
      activatePlayerLikeButtonsForWatchPage();
      activateControlsToggleForWatchPage();
    } else {
      hideFeedButton();
      removeFeedHideStyle();
      deactivateRecsForNonWatchPage();
      deactivateCommentsForNonWatchPage();
      deactivatePlayerLikeButtonsForNonWatchPage();
      deactivateControlsToggleForNonWatchPage();
    }
  }

  function injectStaticStyles() {
    const style = document.createElement('style');
    style.textContent = '.ytp-heat-map-container, .ytp-heat-map-chapter { display: none !important; } ytd-notification-topbar-button-renderer { display: none !important; } #voice-search-button { display: none !important; }';
    (document.head || document.documentElement).appendChild(style);
  }

  function init() {
    injectStaticStyles();
    handleNavigation();
    attachLogoClickListener();

    commentsPageObserver = new MutationObserver(() => {
      if (commentsIsActive && onWatchPage()) {
        watchForComments();
      }
    });

    window.addEventListener('yt-navigate-start', deactivateCommentsForNonWatchPage);

    window.addEventListener('yt-navigate-finish', () => {
      handleNavigation();
      attachLogoClickListener();
    });
    window.addEventListener('popstate', handleNavigation);

    // Fallback: poll for URL path changes (SPA navigation)
    let lastHref = location.href;
    setInterval(() => {
      if (location.href !== lastHref) {
        lastHref = location.href;
        handleNavigation();
      }
    }, 1000);

    // Track theme changes
    if (window.matchMedia) {
      try {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.addEventListener) {
          mq.addEventListener('change', updateFeedButtonTheme);
        } else if (mq.addListener) {
          mq.addListener(updateFeedButtonTheme);
        }
      } catch (e) {}
    }

    document.addEventListener('visibilitychange', updateFeedButtonTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
