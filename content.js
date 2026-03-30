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

  function initRecsToggle(recommendations) {
    if (!recommendations || recommendations.dataset.toggleInitialized === 'true') return;

    recommendations.dataset.toggleInitialized = 'true';
    toggleState.recommendations = recommendations;

    const parent = recommendations.parentElement;
    if (!parent) return;

    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.justifyContent = 'flex-end';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.margin = '8px 0';

    const toggleButton = document.createElement('button');
    toggleButton.className = 'yt-toggle-button';
    toggleButton.textContent = 'Show recommendations';

    toggleContainer.appendChild(toggleButton);

    const spacer = document.createElement('div');
    spacer.style.width = '100%';
    spacer.style.height = '0';
    spacer.style.display = 'block';

    toggleState.toggleContainer = toggleContainer;
    toggleState.button = toggleButton;
    toggleState.spacer = spacer;
    toggleState.isHidden = true;

    parent.insertBefore(toggleContainer, recommendations);
    parent.insertBefore(spacer, recommendations.nextSibling);

    recommendations.style.display = 'none';

    toggleButton.addEventListener('click', () => {
      const { recommendations: recs, spacer } = toggleState;
      if (!recs || !spacer) return;

      toggleState.isHidden = !toggleState.isHidden;

      if (toggleState.isHidden) {
        recs.style.display = 'none';
        spacer.style.display = 'block';
        toggleButton.textContent = 'Show recommendations';
      } else {
        recs.style.display = '';
        spacer.style.display = 'none';
        toggleButton.textContent = 'Hide recommendations';
      }
    });
  }

  function cleanupRecsToggle() {
    const { recommendations, toggleContainer, spacer } = toggleState;
    if (recommendations) {
      recommendations.style.display = '';
      delete recommendations.dataset.toggleInitialized;
    }
    if (toggleContainer) toggleContainer.remove();
    if (spacer) spacer.remove();
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

  function activateForWatchPage() {
    if (recsIsActive || !onWatchPage()) return;
    recsIsActive = true;
    watchForRecommendations();
  }

  function deactivateRecsForNonWatchPage() {
    if (!recsIsActive) return;
    recsIsActive = false;
    stopWatchingRecommendations();
    cleanupRecsToggle();
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

    commentsSection.dataset.commentsToggleInitialized = 'true';

    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Show Comments';
    toggleButton.classList.add('yt-comments-toggle-button');

    const spacer = document.createElement('div');
    spacer.classList.add('yt-comments-spacer');
    spacer.style.height = '1666px';
    spacer.style.display = 'block';

    const parent = commentsSection.parentNode;
    parent.insertBefore(toggleButton, commentsSection);
    parent.insertBefore(spacer, commentsSection);

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
    if (button && button.parentNode) button.parentNode.removeChild(button);
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

  let currentVideoId = null;
  let playerButtonsContainer = null;

  function getVideoId() {
    return new URLSearchParams(window.location.search).get('v');
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

  function updatePlayerButtonStates() {
    if (!playerButtonsContainer) return;
    const likeBtn = playerButtonsContainer.querySelector('.ytp-like-btn');
    const dislikeBtn = playerButtonsContainer.querySelector('.ytp-dislike-btn');
    if (!likeBtn || !dislikeBtn) return;
    const status = getLikeStatus();
    likeBtn.classList.toggle('active', status.liked);
    dislikeBtn.classList.toggle('active', status.disliked);
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
    return playerButtonsContainer;
  }

  function injectPlayerButtons() {
    const videoId = getVideoId();
    if (!videoId) return;

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
    leftControls.appendChild(createPlayerButtons());
    setTimeout(updatePlayerButtonStates, 1000);
  }

  function initPlayerLikeButtons() {
    injectPlayerButtons();

    const pageObserver = new MutationObserver((mutations) => {
      if (getVideoId()) {
        injectPlayerButtons();
        for (const mutation of mutations) {
          if (mutation.target.closest?.('like-button-view-model') ||
              mutation.target.closest?.('dislike-button-view-model') ||
              mutation.attributeName === 'aria-pressed') {
            updatePlayerButtonStates();
            break;
          }
        }
      }
    });
    pageObserver.observe(document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed']
    });

    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(injectPlayerButtons, 500);
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  // =====================
  // CONTROLS TOGGLE (Shift+Q, all pages)
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

  function applyControlsVisibility(visible) {
    const selectors = [
      '.ytp-chrome-bottom',
      '.ytp-chrome-controls',
      '.ytp-progress-bar-container',
      '.ytp-fullscreen-metadata',
      '.ytp-fullscreen-quick-actions',
      'yt-player-overlay-video-details-renderer',
      'yt-player-quick-action-buttons',
      '.ytp-fullscreen-grid-buttons-container'
    ];

    selectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        if (visible) {
          element.style.removeProperty('opacity');
          element.style.removeProperty('pointer-events');
        } else {
          element.style.opacity = '0';
          element.style.pointerEvents = 'none';
        }
      }
    });
  }

  function initControlsToggle() {
    safeSendMessage({ action: 'getControlsState' }, (response) => {
      if (response) applyControlsVisibility(response.visible);
    });

    document.addEventListener('mousedown', (e) => {
      if (e.button === 1) safeSendMessage({ action: 'ping' });
    });

    document.addEventListener('keydown', (e) => {
      if (e.shiftKey && e.code === 'KeyQ') {
        safeSendMessage({ action: 'toggleControls' });
      }
    });

    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!isContextValid()) return;
        if (message.action === 'setControlsVisibility') {
          applyControlsVisibility(message.visible);
          sendResponse({ success: true });
        }
        return true;
      });
    } catch (e) {}
  }

  // =====================
  // SHARED NAVIGATION
  // =====================

  function handleNavigation() {
    if (isHomePage()) {
      deactivateRecsForNonWatchPage();
      deactivateCommentsForNonWatchPage();
      handleFeedPage();
    } else if (onWatchPage()) {
      hideFeedButton();
      removeFeedHideStyle();
      activateForWatchPage();
      activateCommentsForWatchPage();
    } else {
      hideFeedButton();
      removeFeedHideStyle();
      deactivateRecsForNonWatchPage();
      deactivateCommentsForNonWatchPage();
    }
  }

  function init() {
    handleNavigation();
    attachLogoClickListener();
    initPlayerLikeButtons();
    initControlsToggle();

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
    let lastPath = location.pathname;
    setInterval(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
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
