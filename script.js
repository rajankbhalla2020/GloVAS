/**
 * Glo Nigeria VAS Service Hub — Core Application Logic
 * Production-ready, client-side, mobile-first USSD dispatcher
 */

import './styles.css';

// ==================================================
// CAMPAIGN TRACKING & ANALYTICS SETUP
// ==================================================
const campaignData = (function getCampaignParameters() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tracking = {
      source: urlParams.get('source') || 'direct',
      campaign: urlParams.get('campaign') || 'organic_vas',
      medium: urlParams.get('medium') || 'web',
      term: urlParams.get('term') || '',
      content: urlParams.get('content') || ''
    };
    // Persist in sessionStorage for session-wide attribution
    if (window.sessionStorage) {
      sessionStorage.setItem('glo_vas_attribution', JSON.stringify(tracking));
    }
    return tracking;
  } catch (e) {
    return { source: 'direct', campaign: 'organic_vas' };
  }
})();

/**
 * Reusable analytics hook for tracking customer service interactions.
 * Ready for Google Analytics, GTM, or local logging without transmitting MSISDN.
 *
 * @param {string} service - Name of the VAS service
 * @param {string} ussdCode - Associated USSD code
 */
function trackServiceClick(service, ussdCode) {
  const eventPayload = {
    event: 'vas_subscription_initiate',
    service_name: service,
    ussd_code: ussdCode,
    campaign_source: campaignData.source,
    campaign_name: campaignData.campaign,
    timestamp: new Date().toISOString()
  };

  // Structured console log
  console.log('[Glo VAS Analytics] Service Click:', eventPayload);

  // Ready for Google Tag Manager (dataLayer) if loaded
  if (window.dataLayer && Array.isArray(window.dataLayer)) {
    window.dataLayer.push(eventPayload);
  }
}

// ==================================================
// USSD LAUNCHER & DEVICE DETECTION
// ==================================================
/**
 * Launches the phone dialer using the tel: protocol in the background.
 * Detects Android and iOS for proper '#' hash encoding.
 * On desktop, displays the required prompt modal.
 *
 * @param {string} ussdCode - Hidden internal USSD sequence (e.g. "*303#" or "*7802*1*1#")
 * @param {string} serviceName - Optional service name for tracking
 * @param {HTMLElement} [buttonElement] - Optional button element to provide instant background processing feedback
 */
function initiateUSSD(ussdCode, serviceName = 'VAS Service', buttonElement = null) {
  // Track customer interaction
  trackServiceClick(serviceName, ussdCode);

  // Send Google tag conversion event
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: 'AW-18494223490',
      service_name: serviceName,
      ussd_code: ussdCode
    });
  }

  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /android/i.test(ua);

  // Provide immediate smooth button feedback without displaying any USSD code
  if (buttonElement) {
    const originalContent = buttonElement.innerHTML;
    buttonElement.style.pointerEvents = 'none';
    buttonElement.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 0.8s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      <span>Connecting...</span>
    `;

    setTimeout(() => {
      buttonElement.innerHTML = originalContent;
      buttonElement.style.pointerEvents = '';
    }, 2500);
  }

  // iOS: '#' must be encoded as '%23'
  if (isIOS) {
    const telUri = 'tel:' + ussdCode.replace(/#/g, '%23');
    dispatchBackgroundTel(telUri);
  }
  // Android: full encodeURIComponent preserves asterisks and encodes '#'
  else if (isAndroid) {
    const telUri = 'tel:' + encodeURIComponent(ussdCode);
    dispatchBackgroundTel(telUri);
  }
  // Desktop & unknown devices
  else {
    showDesktopModal();
  }
}

/**
 * Dispatches the tel: protocol in the background using an invisible link element
 * @param {string} telUri
 */
function dispatchBackgroundTel(telUri) {
  try {
    const hiddenLink = document.createElement('a');
    hiddenLink.href = telUri;
    hiddenLink.style.display = 'none';
    hiddenLink.setAttribute('aria-hidden', 'true');
    document.body.appendChild(hiddenLink);
    hiddenLink.click();
    setTimeout(() => {
      if (hiddenLink.parentNode) {
        hiddenLink.parentNode.removeChild(hiddenLink);
      }
    }, 1000);
  } catch (e) {
    window.location.href = telUri;
  }
}

/**
 * Shows the desktop notification modal
 */
function showDesktopModal() {
  const modal = document.getElementById('desktopModal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    const okBtn = document.getElementById('modalOkBtn');
    if (okBtn) okBtn.focus();
  }
}

/**
 * Closes the desktop notification modal
 */
function closeDesktopModal() {
  const modal = document.getElementById('desktopModal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// ==================================================
// SERVICE DATA ARCHITECTURE
// ==================================================
const categories = [
  {
    id: 'gaming',
    num: 1,
    name: 'Gaming Services',
    icon: '🎮',
    summary: 'Brain teasers, tournaments, and premium mobile games',
    services: [
      {
        name: 'Brain Tease',
        icon: '🧠',
        ussd: '*7802*1*1#',
        description: 'Challenge your mind with daily brain teasers, puzzles, and test your IQ against other Glo subscribers.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*7802*1*1#',
            nonAutoUssd: '*7802*1*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦250',
            default: false,
            autoUssd: '*7802*1*3#',
            nonAutoUssd: '*7802*1*4#'
          }
        ]
      },
      {
        name: 'Gaming Tournament',
        icon: '🏆',
        ussd: '*13316*1#',
        description: 'Compete in live mobile eSports tournaments and climb leaderboards for incredible cash and airtime prizes.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*13316*1*1#',
            nonAutoUssd: '*13316*1*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦300',
            default: false,
            autoUssd: '*13316*1*3#',
            nonAutoUssd: '*13316*1*4#'
          },
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦500',
            default: false,
            autoUssd: '*13316*1*5#',
            nonAutoUssd: '*13316*1*6#'
          }
        ]
      },
      {
        name: 'GameXpress',
        icon: '🕹️',
        ussd: '*20026*1#',
        description: 'Unlimited access to a catalog of premium action, sports, arcade, and puzzle games on your phone.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*20026*1*1#',
            nonAutoUssd: '*20026*1*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦200',
            default: false,
            autoUssd: '*20026*1*3#',
            nonAutoUssd: '*20026*1*4#'
          }
        ]
      },
      {
        name: 'Wazoplay',
        icon: '⚔️',
        ussd: '*20558*1#',
        description: 'Interactive social gaming platform where skills meet rewards in fast-paced casual game battles.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*20558*1*1#',
            nonAutoUssd: '*20558*1*3#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦200',
            default: false,
            autoUssd: '*20558*1*2#',
            nonAutoUssd: '*20558*1*4#'
          },
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦500',
            default: false,
            autoUssd: '*20558*1*5#',
            nonAutoUssd: '*20558*1*5#'
          }
        ]
      },
      {
        name: 'Splash Gaming',
        icon: '🌊',
        ussd: '*20070*1#',
        description: 'Dive into splashy arcade entertainment, multiplayer racing, and adventure titles on demand.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*20070*1*1#',
            nonAutoUssd: '*20070*1*2#'
          }
        ]
      }
    ]
  },
  {
    id: 'educational',
    num: 2,
    name: 'Educational Services',
    icon: '🎓',
    summary: 'E-learning video courses, academic games, and more',
    services: [
      {
        name: 'Edu Video',
        icon: '🎥',
        ussd: '*8012*2#',
        description: 'Master academic topics and exam revisions through engaging video tutorials and expert teacher lessons.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*8012*2*1#',
            nonAutoUssd: '*8012*2*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦150',
            default: false,
            autoUssd: '*8012*2*3#',
            nonAutoUssd: '*8012*2*4#'
          },
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦200',
            default: false,
            autoUssd: '*8012*2*5#',
            nonAutoUssd: '*8012*2*6#'
          }
        ]
      },
      {
        name: 'Edu Games',
        icon: '🎯',
        ussd: '*8012*1#',
        description: 'Gamified learning experiences designed to sharpen mathematics, grammar, science, and reasoning skills.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*8012*1*1#',
            nonAutoUssd: '*8012*1*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦150',
            default: false,
            autoUssd: '*8012*1*3#',
            nonAutoUssd: '*8012*1*4#'
          },
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦200',
            default: false,
            autoUssd: '*8012*1*5#',
            nonAutoUssd: '*8012*1*6#'
          }
        ]
      },
      {
        name: 'Kidjo TV',
        icon: '📺',
        ussd: '*44404#',
        description: 'Safe, commercial-free educational entertainment, animated nursery rhymes, and moral tales for children.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦20',
            default: true,
            autoUssd: '*44404*1#',
            nonAutoUssd: '*44404*4#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦60',
            default: false,
            autoUssd: '*44404*2#',
            nonAutoUssd: '*44404*5#'
          },
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦150',
            default: false,
            autoUssd: '*44404*3#',
            nonAutoUssd: '*44404*6#'
          }
        ]
      }
    ]
  },
  {
    id: 'lottery',
    num: 3,
    name: 'Lottery',
    icon: '🎰',
    summary: 'Stand a chance to win cash and prizes',
    services: [
      {
        name: 'Perfect 10',
        icon: '🔟',
        ussd: '*4551#',
        description: 'Match your lucky 10 numbers in Glo daily draws for huge monetary jackpot rewards.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*4551*1#',
            nonAutoUssd: '*4551*3#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦300',
            default: false,
            autoUssd: '*4551*2#',
            nonAutoUssd: '*4551*4#'
          }
        ]
      },
      {
        name: 'Lucky Number',
        icon: '🍀',
        ussd: '*4445#',
        description: 'Generate your personal lucky number and participate in automated high-yield daily prize lotteries.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'economy',
            name: 'Economy',
            price: '₦150',
            default: true,
            autoUssd: '*4445*1*1#',
            nonAutoUssd: '*4445*1*2#'
          },
          {
            id: 'max',
            name: 'Max',
            price: '₦200',
            default: false,
            autoUssd: '*4445*2*1#',
            nonAutoUssd: '*4445*2*2#'
          },
          {
            id: 'premium',
            name: 'Premium',
            price: '₦500',
            default: false,
            autoUssd: '*4445*3*1#',
            nonAutoUssd: '*4445*3*2#'
          }
        ]
      },
      {
        name: 'EduMillionaire',
        icon: '🎓',
        ussd: '*8013*1#',
        description: 'Test your academic acumen and stand a chance to unlock millionaire education grants and scholarships.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*8013*1*1#',
            nonAutoUssd: '*8013*1*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦300',
            default: false,
            autoUssd: '*8013*1*3#',
            nonAutoUssd: '*8013*1*4#'
          },
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦500',
            default: false,
            autoUssd: '*8013*1*5#',
            nonAutoUssd: '*8013*1*6#'
          }
        ]
      },
      {
        name: 'Magic Fingers',
        icon: '✨',
        ussd: '*7023*2#',
        description: 'Fast-reflex instant win lottery with quick payouts and continuous daily bonus rewards.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦200',
            default: true,
            autoUssd: '*7023*2*1#',
            nonAutoUssd: '*7023*2*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦300',
            default: false,
            autoUssd: '*7023*2*3#',
            nonAutoUssd: '*7023*2*4#'
          },
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦750',
            default: false,
            autoUssd: '*7023*2*5#',
            nonAutoUssd: '*7023*2*6#'
          }
        ]
      },
      {
        name: 'Korrect Perdict',
        icon: '⚽',
        ussd: '*7023*4#',
        description: 'Accurately predict match results, correct scores, and win big in the weekly football jackpot pool.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦200',
            default: true,
            autoUssd: '*7023*4*1#',
            nonAutoUssd: '*7023*4*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦300',
            default: false,
            autoUssd: '*7023*4*3#',
            nonAutoUssd: '*7023*4*4#'
          }
        ]
      }
    ]
  },
  {
    id: 'music-entertainment',
    num: 4,
    name: 'Music & Entertainment',
    icon: '🎵',
    summary: 'Afrobeats, streaming, trivia and celebrity gossip',
    services: [
      {
        name: 'Mdundo',
        icon: '🎧',
        ussd: '*13175*2#',
        description: 'Download and stream millions of trending Nigerian hit songs, DJ mixes, gospel melodies, and podcasts.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*13175*2*1#',
            nonAutoUssd: '*13175*2*3#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦300',
            default: false,
            autoUssd: '*13175*2*2#',
            nonAutoUssd: '*13175*2*4#'
          }
        ]
      },
      {
        name: 'Music Trivia',
        icon: '🎤',
        ussd: '*20081*1#',
        description: 'Prove your knowledge of African music legends, chart-toppers, and lyrics in thrilling daily trivia contests.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦200',
            default: true,
            autoUssd: '*20081*1*1#',
            nonAutoUssd: '*20081*1*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦400',
            default: false,
            autoUssd: '*20081*1*3#',
            nonAutoUssd: '*20081*1*4#'
          },
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦500',
            default: false,
            autoUssd: '*20081*1*5#',
            nonAutoUssd: '*20081*1*6#'
          }
        ]
      },
      {
        name: 'Entertainment Gossip',
        icon: '🌟',
        ussd: '*50031*2#',
        description: 'Get first-hand celebrity scoops, Nollywood film updates, red carpet fashion, and trending pop culture news.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*50031*2*1#',
            nonAutoUssd: '*50031*2*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦200',
            default: false,
            autoUssd: '*50031*2*3#',
            nonAutoUssd: '*50031*2*4#'
          }
        ]
      },
      {
        name: 'Video Entertainment',
        icon: '🎬',
        ussd: '*20070*2#',
        description: 'Enjoy short-form comedy skits, viral web series, and vibrant Nigerian entertainment clips on your device.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*20070*2*1#',
            nonAutoUssd: '*20070*2*2#'
          }
        ]
      },
      {
        name: 'Joycasa',
        icon: '🏡',
        ussd: '*77728*4#',
        description: 'Curated lifestyle and home entertainment, culinary tips, cultural programming, and relaxing family content.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*77728*4*1#',
            nonAutoUssd: '*77728*4*4#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦200',
            default: false,
            autoUssd: '*77728*4*2#',
            nonAutoUssd: '*77728*4*5#'
          },
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦500',
            default: false,
            autoUssd: '*77728*4*3#',
            nonAutoUssd: '*77728*4*6#'
          }
        ]
      }
    ]
  },
  {
    id: 'sports',
    num: 5,
    name: 'Sports',
    icon: '⚽',
    summary: 'Live scores, trivia battles, gist and more',
    services: [
      {
        name: 'Sports Brain',
        icon: '🧠',
        ussd: '*13199*2#',
        description: 'Test your football and global sports expertise against rival fans to win exclusive prizes and bragging rights.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*13199*2*1#',
            nonAutoUssd: '*13199*2*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦200',
            default: false,
            autoUssd: '*13199*2*3#',
            nonAutoUssd: '*13199*2*4#'
          },
          {
            id: 'weekly_plus',
            name: 'Weekly Plus',
            price: '₦500',
            default: false,
            autoUssd: '*13199*2*5#',
            nonAutoUssd: '*13199*2*6#'
          }
        ]
      },
      {
        name: 'Football Zone',
        icon: '⚽',
        ussd: '*20081*3#',
        description: 'Real-time match alerts, Premier League, UEFA Champions League, NPFL scores, and live match analyses.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦200',
            default: true,
            autoUssd: '*20081*3*1#',
            nonAutoUssd: '*20081*3*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦400',
            default: false,
            autoUssd: '*20081*3*3#',
            nonAutoUssd: '*20081*3*4#'
          },
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦500',
            default: false,
            autoUssd: '*20081*3*5#',
            nonAutoUssd: '*20081*3*6#'
          }
        ]
      },
      {
        name: 'Football Gist',
        icon: '📢',
        ussd: '*50031*1#',
        description: 'Dressing room secrets, juicy transfer rumors, managerial updates, and deep tactical debates from football insiders.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*50031*1*1#',
            nonAutoUssd: '*50031*1*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦200',
            default: false,
            autoUssd: '*50031*1*3#',
            nonAutoUssd: '*50031*1*4#'
          }
        ]
      },
      {
        name: 'Torliga Football',
        icon: '📊',
        ussd: '*20905*1#',
        description: 'Comprehensive football statistics, player profiles, league standings, and fixture countdowns.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*20905*1*1#',
            nonAutoUssd: '*20905*1*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦500',
            default: false,
            autoUssd: '*20905*1*3#',
            nonAutoUssd: '*20905*1*4#'
          }
        ]
      },
      {
        name: 'SportsQube',
        icon: '🥊',
        ussd: '*77728*1#',
        description: 'Your premier multi-sport arena covering boxing, basketball, athletics, Formula 1, and football highlights.',
        buttonText: 'SUBSCRIBE NOW →',
        customPacks: [
          {
            id: 'daily',
            name: 'Daily',
            price: '₦100',
            default: true,
            autoUssd: '*77728*1*1#',
            nonAutoUssd: '*77728*1*3#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦200',
            default: false,
            autoUssd: '*77728*1*2#',
            nonAutoUssd: '*77728*1*4#'
          }
        ]
      }
    ]
  },
  {
    id: 'bmc',
    num: 6,
    name: 'Borrow Me Credit',
    displayTitle: 'Borrow Me Credit',
    icon: '💰',
    summary: 'Emergency airtime or data on credit',
    services: [
      {
        name: 'Borrow Airtime',
        icon: '📞',
        ussd: '*303*1#',
        description: 'Get instant emergency airtime credited to your Glo line to make urgent calls and send SMS. Repay on your next recharge.',
        buttonText: 'BORROW AIRTIME →',
        noPacks: true
      },
      {
        name: 'Borrow Data',
        icon: '🌐',
        ussd: '*303*2#',
        description: 'Get instant high-speed emergency data bundles on credit to keep browsing and streaming. Repay on your next recharge.',
        buttonText: 'BORROW DATA →',
        noPacks: true
      }
    ]
  },
  {
    id: 'caller-tunes',
    num: 7,
    name: 'Caller Tunes',
    icon: '🎵',
    summary: 'Personalize your caller tone with top hits',
    services: [
      {
        name: 'Caller Tunes',
        icon: '🎵',
        description: 'Personalize what your callers hear when they dial your number. Choose from Afrobeats, gospel, and top chart-toppers.',
        // Dual buttons as specified in prompt
        isDualButton: true,
        actions: [
          {
            label: 'ACTIVATE CALLER TUNES →',
            ussd: '*7788#'
          },
          {
            label: 'NEW CALLER TUNES CODE →',
            ussd: '*7788*4#'
          }
        ],
        customPacks: [
          {
            id: 'monthly',
            name: 'Monthly',
            price: '₦200',
            default: true,
            autoUssd: '*7788*1*1#',
            nonAutoUssd: '*7788*1*2#'
          },
          {
            id: '15days',
            name: '15 Days',
            price: '₦100',
            default: false,
            autoUssd: '*7788*2*1#',
            nonAutoUssd: '*7788*2*2#'
          },
          {
            id: 'weekly',
            name: 'Weekly',
            price: '₦50',
            default: false,
            autoUssd: '*7788*3*1#',
            nonAutoUssd: '*7788*3*2#'
          }
        ]
      }
    ]
  },
  {
    id: 'information',
    num: 8,
    name: 'Infotainment',
    displayTitle: 'Infotainment',
    icon: 'ℹ️',
    summary: 'Daily news, weather, alerts and lifestyle tips',
    directUssd: '*4552#',
    services: [
      {
        name: 'Infotainment',
        icon: '📰',
        ussd: '*4552#',
        description: 'Receive real-time breaking news headlines, weather forecasts, health guidance, and essential alerts on your phone.',
        buttonText: 'SUBSCRIBE NOW →',
        noPacks: true
      }
    ]
  }
];

// ==================================================
// SPA ROUTING & VIEW CONTROLLER
// ==================================================
let currentView = 'home'; // 'home' or category id (e.g. 'gaming')
let currentSearchTerm = '';

/**
 * Renders the home screen showing all 8 categories
 */
function renderHomeView() {
  currentView = 'home';

  // Toggle DOM view containers
  const homeViewEl = document.getElementById('homeView');
  const categoryViewEl = document.getElementById('categoryView');
  const categoryHeaderEl = document.getElementById('categoryViewHeader');
  const heroEl = document.getElementById('heroBanner');
  const searchContainerEl = document.getElementById('searchContainer');

  if (homeViewEl) homeViewEl.style.display = 'block';
  if (categoryViewEl) categoryViewEl.style.display = 'none';
  if (categoryHeaderEl) categoryHeaderEl.style.display = 'none';
  if (heroEl) heroEl.style.display = 'block';
  if (searchContainerEl) searchContainerEl.style.display = 'block';

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update categories grid
  filterAndRenderCategories(currentSearchTerm);

  // Send Google tag page view event
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: '/#home',
      page_title: 'Glo VAS Services - Home'
    });
  }
}

/**
 * Filters and renders category cards based on optional search term
 * @param {string} term
 */
function filterAndRenderCategories(term = '') {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;

  const normalized = term.trim().toLowerCase();
  container.innerHTML = '';

  const filtered = categories.filter(cat => {
    if (!normalized) return true;
    const matchCat = cat.name.toLowerCase().includes(normalized) || cat.summary.toLowerCase().includes(normalized);
    const matchService = cat.services.some(s => s.name.toLowerCase().includes(normalized) || (s.description && s.description.toLowerCase().includes(normalized)));
    return matchCat || matchService;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 16px; background: #FFFFFF; border-radius: 16px; border: 1px dashed var(--border-subtle);">
        <p style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">No services found</p>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">Try searching for "games", "credit", "music", or "sports".</p>
        <button type="button" class="back-to-services-btn" style="margin: 0 auto;" onclick="clearSearch()">View All Categories</button>
      </div>
    `;
    return;
  }

  filtered.forEach(cat => {
    const card = document.createElement('a');
    card.className = 'category-card-v2';
    card.href = `#category-${cat.id}`;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${cat.name} (${cat.services.length} services)`);

    const titleToDisplay = cat.displayTitle ? `${cat.displayTitle}` : cat.name;

    card.innerHTML = `
      <div class="cat-card-icon-wrap" aria-hidden="true">
        <span class="cat-card-icon">${cat.icon}</span>
      </div>
      <div class="cat-card-text">
        <h3 class="cat-card-title">${escapeHtml(titleToDisplay)}</h3>
        <p class="cat-card-desc">${escapeHtml(cat.summary)}</p>
      </div>
      <div class="cat-card-arrow" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    `;

    card.addEventListener('click', (e) => {
      e.preventDefault();
      if (cat.directUssd) {
        card.classList.add('card-pressed');
        setTimeout(() => card.classList.remove('card-pressed'), 180);
        initiateUSSD(cat.directUssd, cat.name, card);
        return;
      }
      navigateToCategory(cat.id);
    });

    container.appendChild(card);
  });
}

/**
 * Smoothly scrolls to the categories section
 */
function scrollToCategories() {
  const el = document.getElementById('categoriesSection');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
window.scrollToCategories = scrollToCategories;

/**
 * Initializes the horizontal hero banner carousel
 */
function initHeroCarousel() {
  const track = document.getElementById('heroCarouselTrack');
  const prevBtn = document.getElementById('carouselPrevBtn');
  const nextBtn = document.getElementById('carouselNextBtn');
  const dotsContainer = document.getElementById('carouselDots');
  if (!track) return;

  const slides = track.querySelectorAll('.hero-carousel-slide');
  const dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];
  let currentSlideIndex = 0;
  let autoPlayTimer = null;

  function goToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentSlideIndex = index;
    const targetSlide = slides[index];
    if (targetSlide) {
      track.scrollTo({
        left: targetSlide.offsetLeft - track.offsetLeft,
        behavior: 'smooth'
      });
    }
    updateDots(index);
  }

  function updateDots(index) {
    dots.forEach((d, i) => {
      if (i === index) {
        d.classList.add('active');
        d.setAttribute('aria-selected', 'true');
      } else {
        d.classList.remove('active');
        d.setAttribute('aria-selected', 'false');
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToSlide(currentSlideIndex - 1);
      resetAutoPlay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToSlide(currentSlideIndex + 1);
      resetAutoPlay();
    });
  }

  dots.forEach(d => {
    d.addEventListener('click', () => {
      const idx = parseInt(d.getAttribute('data-slide-index') || '0', 10);
      goToSlide(idx);
      resetAutoPlay();
    });
  });

  // Track manual horizontal scroll updates
  let scrollTimeout;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollPos = track.scrollLeft;
      const slideWidth = track.clientWidth;
      const newIdx = Math.round(scrollPos / (slideWidth || 1));
      if (newIdx !== currentSlideIndex && newIdx >= 0 && newIdx < slides.length) {
        currentSlideIndex = newIdx;
        updateDots(newIdx);
      }
    }, 60);
  });

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(() => {
      goToSlide(currentSlideIndex + 1);
    }, 6000);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
  }

  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  track.addEventListener('mouseenter', stopAutoPlay);
  track.addEventListener('mouseleave', startAutoPlay);
  track.addEventListener('touchstart', stopAutoPlay, { passive: true });
  track.addEventListener('touchend', startAutoPlay, { passive: true });

  startAutoPlay();
}

/**
 * Initializes and binds the side navigation drawer
 */
function initSideDrawer() {
  const toggleBtn = document.getElementById('menuToggleBtn');
  const drawer = document.getElementById('sideDrawer');
  const overlay = document.getElementById('sideDrawerOverlay');
  const closeBtn = document.getElementById('drawerCloseBtn');
  const navLinksContainer = document.getElementById('drawerNavLinks');

  if (!drawer || !overlay) return;

  function openDrawer() {
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  // Populate drawer links
  if (navLinksContainer) {
    navLinksContainer.innerHTML = '';
    categories.forEach(cat => {
      const link = document.createElement('a');
      link.href = `#category-${cat.id}`;
      link.className = 'drawer-nav-item';
      link.innerHTML = `
        <span style="font-size:18px;">${cat.icon}</span>
        <span>${escapeHtml(cat.name)}</span>
      `;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        closeDrawer();
        if (cat.directUssd) {
          initiateUSSD(cat.directUssd, cat.name);
          return;
        }
        navigateToCategory(cat.id);
      });
      navLinksContainer.appendChild(link);
    });
  }
}

/**
 * Navigates into a category detail view
 * @param {string} categoryId
 * @param {boolean} pushState
 */
function navigateToCategory(categoryId, pushState = true) {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) {
    renderHomeView();
    return;
  }

  currentView = categoryId;

  if (pushState) {
    history.pushState({ view: categoryId }, '', `#${categoryId}`);
  }

  const homeViewEl = document.getElementById('homeView');
  const categoryViewEl = document.getElementById('categoryView');
  const categoryHeaderEl = document.getElementById('categoryViewHeader');
  const heroEl = document.getElementById('heroBanner');
  const searchContainerEl = document.getElementById('searchContainer');

  if (homeViewEl) homeViewEl.style.display = 'none';
  if (categoryViewEl) categoryViewEl.style.display = 'block';
  if (categoryHeaderEl) categoryHeaderEl.style.display = 'flex';
  if (heroEl) heroEl.style.display = 'none';
  if (searchContainerEl) searchContainerEl.style.display = 'none';

  // Populate Category Header
  const titleEl = document.getElementById('categoryMainHeading');
  const countEl = document.getElementById('categoryServicesCount');
  const iconEl = document.getElementById('categoryTitleIconBox');

  const titleText = cat.displayTitle || cat.name;
  if (titleEl) titleEl.textContent = titleText;
  if (countEl) countEl.textContent = `${cat.services.length} ${cat.services.length === 1 ? 'Service' : 'Services'} Available`;
  if (iconEl) iconEl.textContent = cat.icon;

  // Render Service Cards
  renderCategoryServices(cat);

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Send Google tag page view event
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: `/#${categoryId}`,
      page_title: `${cat.name} - Glo VAS Services`
    });
  }
}

/**
 * Renders individual service cards inside a category
 * @param {object} category
 */
function renderCategoryServices(category) {
  const container = document.getElementById('servicesListContainer');
  if (!container) return;

  container.innerHTML = '';

  category.services.forEach(service => {
    const card = document.createElement('div');
    card.className = 'service-card';
    const serviceKey = (service.name || 'srv').toLowerCase().replace(/[^a-z0-9]/g, '_');

    const activePacks = service.customPacks || [
      { id: 'daily', name: 'Daily', price: '₦100', default: true },
      { id: 'weekly', name: 'Weekly', price: '₦200', default: false },
      { id: 'monthly', name: 'Monthly', price: '₦500', default: false }
    ];

    // Packs HTML with default selected
    const packsHtml = service.noPacks ? '' : `
      <div class="service-packs-wrapper">
        <span class="service-packs-heading">Select Subscription Plan:</span>
        <div class="service-packs-grid" role="radiogroup" aria-label="Select Plan for ${escapeHtml(service.name)}" style="${activePacks.length === 2 ? 'grid-template-columns: repeat(2, 1fr);' : activePacks.length === 1 ? 'grid-template-columns: 1fr; max-width: 200px;' : ''}">
          ${activePacks.map(p => `
            <label class="pack-radio-label ${p.default ? 'pack-selected' : ''}" data-pack-val="${p.id}">
              <input type="radio" name="pack_${serviceKey}" value="${p.id}" ${p.default ? 'checked' : ''} />
              <span class="pack-radio-custom" aria-hidden="true"></span>
              <div class="pack-radio-details">
                <span class="pack-title">${escapeHtml(p.name)}</span>
                <span class="pack-rate">${escapeHtml(p.price)}</span>
              </div>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    const autoPackCheckboxHtml = service.noPacks ? '' : `
      <label class="auto-pack-checkbox-label" title="Pre-selected Auto Pack">
        <input type="checkbox" class="auto-pack-input" checked />
        <span class="auto-pack-custom-checkbox" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span class="auto-pack-text">Auto Pack</span>
      </label>
    `;

    const headerHtml = `
      <div class="service-card-header">
        <div class="service-header-left">
          <div class="service-avatar-box" aria-hidden="true">${service.icon || category.icon || '📱'}</div>
          <div class="service-title-block">
            <span class="service-category-tag">${escapeHtml(category.name)}</span>
            <h3 class="service-title">${escapeHtml(service.name)}</h3>
          </div>
        </div>
        ${autoPackCheckboxHtml}
      </div>
    `;

    // Check if this is the dual-button service (Caller Tunes)
    if (service.isDualButton && Array.isArray(service.actions)) {
      card.innerHTML = `
        ${headerHtml}
        <p class="service-desc">${escapeHtml(service.description)}</p>
        ${packsHtml}
        <div class="service-actions-row">
          <p class="service-confirm-hint"><em>Kindly confirm by clicking to SUBSCRIBE NOW button</em></p>
          <div class="service-actions-grid">
            ${service.actions.map((act, i) => `
              <button type="button" class="service-subscribe-btn ${i === 1 ? 'secondary-btn' : ''}" data-action-index="${i}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>${escapeHtml(act.label)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      // Attach radio listeners
      attachPackRadioListeners(card, serviceKey);

      // Attach event listeners to dual buttons retrieving USSD code from JavaScript configuration
      const buttons = card.querySelectorAll('.service-subscribe-btn');
      buttons.forEach(btn => {
        const actionIdx = parseInt(btn.getAttribute('data-action-index') || '0', 10);
        const action = service.actions[actionIdx];
        if (action) {
          btn.addEventListener('click', () => {
            btn.classList.add('btn-pressed');
            setTimeout(() => btn.classList.remove('btn-pressed'), 180);

            if (actionIdx === 0 && Array.isArray(service.customPacks) && service.customPacks.length > 0) {
              const autoInput = card.querySelector('.auto-pack-input');
              const isAuto = autoInput ? autoInput.checked : true;
              const selectedInput = card.querySelector(`input[name="pack_${serviceKey}"]:checked`);
              const packId = selectedInput ? selectedInput.value : service.customPacks[0].id;
              const foundPack = service.customPacks.find(p => p.id === packId) || service.customPacks[0];
              const ussdCode = isAuto ? foundPack.autoUssd : foundPack.nonAutoUssd;
              const label = `${service.name} - ${foundPack.name} (${foundPack.price}) [${isAuto ? 'Auto' : 'One-off'}]`;
              initiateUSSD(ussdCode, label, btn);
            } else {
              const planText = getSelectedPackText(card, serviceKey, service);
              initiateUSSD(action.ussd, `${action.label} (${planText})`, btn);
            }
          });
        }
      });
    } 
    // Standard single-button service
    else {
      const btnLabel = service.buttonText || 'SUBSCRIBE NOW →';
      const hintBtnLabel = service.buttonText ? service.buttonText.replace(' →', '') : 'SUBSCRIBE NOW';

      card.innerHTML = `
        ${headerHtml}
        <p class="service-desc">${escapeHtml(service.description)}</p>
        ${packsHtml}
        <div class="service-actions-row">
          <p class="service-confirm-hint"><em>Kindly confirm by clicking to ${escapeHtml(hintBtnLabel)} button</em></p>
          <button type="button" class="service-subscribe-btn" aria-label="${escapeHtml(btnLabel)} for ${escapeHtml(service.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>${escapeHtml(btnLabel)}</span>
          </button>
        </div>
      `;

      // Attach radio listeners only if service has packs
      if (!service.noPacks) {
        attachPackRadioListeners(card, serviceKey);
      }

      // Attach button event listener using internal JavaScript configuration
      const btn = card.querySelector('.service-subscribe-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          btn.classList.add('btn-pressed');
          setTimeout(() => btn.classList.remove('btn-pressed'), 180);

          if (service.noPacks) {
            initiateUSSD(service.ussd, `${service.name} (${service.ussd})`, btn);
            return;
          }

          const autoInput = card.querySelector('.auto-pack-input');
          const isAuto = autoInput ? autoInput.checked : true;
          const selectedInput = card.querySelector(`input[name="pack_${serviceKey}"]:checked`);
          const packId = selectedInput ? selectedInput.value : 'daily';

          let ussdCode = service.ussd;
          if (service.customPacks) {
            const chosen = service.customPacks.find(p => p.id === packId);
            if (chosen) {
              ussdCode = isAuto ? chosen.autoUssd : chosen.nonAutoUssd;
            }
          }

          const planText = getSelectedPackText(card, serviceKey, service);
          const autoTag = isAuto ? 'Auto' : 'Onetime';
          initiateUSSD(ussdCode, `${service.name} (${planText} - ${autoTag})`, btn);
        });
      }
    }

    container.appendChild(card);
  });
}

/**
 * Attaches change event listeners to radio options for subscription packs
 * @param {HTMLElement} card
 * @param {string} serviceKey
 */
function attachPackRadioListeners(card, serviceKey) {
  const radioInputs = card.querySelectorAll(`input[name="pack_${serviceKey}"]`);
  const radioLabels = card.querySelectorAll('.pack-radio-label');

  radioInputs.forEach(input => {
    input.addEventListener('change', () => {
      radioLabels.forEach(lbl => {
        const inp = lbl.querySelector('input');
        if (inp && inp.checked) {
          lbl.classList.add('pack-selected');
        } else {
          lbl.classList.remove('pack-selected');
        }
      });
    });
  });
}

/**
 * Retrieves readable string of currently selected subscription pack
 * @param {HTMLElement} card
 * @param {string} serviceKey
 * @param {object} [service]
 * @returns {string} e.g. "Daily @ ₦100"
 */
function getSelectedPackText(card, serviceKey, service) {
  const checked = card.querySelector(`input[name="pack_${serviceKey}"]:checked`);
  const val = checked ? checked.value : 'daily';
  if (service && service.customPacks) {
    const found = service.customPacks.find(p => p.id === val);
    if (found) {
      return `${found.name} @ ${found.price}`;
    }
  }
  const plans = {
    daily: 'Daily @ ₦100',
    weekly: 'Weekly @ ₦200',
    monthly: 'Monthly @ ₦500'
  };
  return plans[val] || 'Daily @ ₦100';
}

/**
 * Clears search query and restores full view
 */
function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.classList.remove('active');
  currentSearchTerm = '';
  filterAndRenderCategories('');
}

/**
 * Handle "99. Back" navigation control
 */
function handleUniversalBack() {
  if (currentView !== 'home') {
    history.pushState({ view: 'home' }, '', '#home');
    renderHomeView();
  } else {
    // If already home, scroll smoothly to the very top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Handle "0. Exit" navigation control
 */
function handleUniversalExit() {
  // If in a sub-category, return home
  if (currentView !== 'home') {
    history.pushState({ view: 'home' }, '', '#home');
    renderHomeView();
  } else {
    // Scroll to top and provide feedback
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Escapes unsafe HTML characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Opens the FAQs Modal
 */
function openFaqModal() {
  const modal = document.getElementById('faqModal');
  if (modal) {
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
    document.body.style.overflow = 'hidden';

    // Send Google tag page view event for FAQs
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: '/#faqs',
        page_title: 'Glo VAS Services - FAQs'
      });
    }
  }
}

/**
 * Closes the FAQs Modal
 */
function closeFaqModal() {
  const modal = document.getElementById('faqModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }, 200);
  }
}

/**
 * Closes the side navigation drawer
 */
function closeDrawer() {
  const drawer = document.getElementById('sideDrawer');
  const overlay = document.getElementById('sideDrawerOverlay');
  if (drawer) drawer.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Displays brief information modal for terms or privacy
 */
function openInfoModal(type) {
  if (type === 'terms') {
    initiateUSSD('*305#', 'Terms & Active Services');
  } else {
    initiateUSSD('*305#', 'Privacy & Subscription Status');
  }
}

// ==================================================
// INITIALIZATION & EVENT LISTENERS
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
  // Check initial hash for deep linking (e.g. #sports or #faqs)
  if (window.location.hash === '#faqs') {
    openFaqModal();
  }

  const initialHash = window.location.hash.replace('#', '').replace('category-', '');
  if (initialHash && categories.some(c => c.id === initialHash)) {
    navigateToCategory(initialHash, false);
  } else {
    renderHomeView();
  }

  // Handle browser back and forward buttons seamlessly
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view && e.state.view !== 'home') {
      navigateToCategory(e.state.view, false);
    } else {
      renderHomeView();
    }
  });

  // Top Back to Services button
  const backBtn = document.getElementById('backToServicesBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      history.pushState({ view: 'home' }, '', '#home');
      renderHomeView();
    });
  }

  // Universal Navigation: 99. Back
  const navBackButtons = document.querySelectorAll('.js-nav-back');
  navBackButtons.forEach(btn => {
    btn.addEventListener('click', handleUniversalBack);
  });

  // Universal Navigation: 0. Exit
  const navExitButtons = document.querySelectorAll('.js-nav-exit');
  navExitButtons.forEach(btn => {
    btn.addEventListener('click', handleUniversalExit);
  });

  // Search input live filtering
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClearBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      if (clearBtn) {
        if (currentSearchTerm.length > 0) {
          clearBtn.classList.add('active');
        } else {
          clearBtn.classList.remove('active');
        }
      }
      if (currentView === 'home') {
        filterAndRenderCategories(currentSearchTerm);
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearSearch);
  }

  // Initialize side navigation drawer
  initSideDrawer();

  // Initialize horizontal scrolling hero carousel
  initHeroCarousel();

  // Desktop Modal Dismissal
  const modalOkBtn = document.getElementById('modalOkBtn');
  if (modalOkBtn) {
    modalOkBtn.addEventListener('click', closeDesktopModal);
  }

  const modalOverlay = document.getElementById('desktopModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeDesktopModal();
      }
    });
  }

  // FAQ Modal Dismissal & Buttons
  const faqCloseBtn = document.getElementById('faqCloseBtn');
  if (faqCloseBtn) {
    faqCloseBtn.addEventListener('click', closeFaqModal);
  }

  const faqDoneBtn = document.getElementById('faqDoneBtn');
  if (faqDoneBtn) {
    faqDoneBtn.addEventListener('click', closeFaqModal);
  }

  const faqModal = document.getElementById('faqModal');
  if (faqModal) {
    faqModal.addEventListener('click', (e) => {
      if (e.target === faqModal) {
        closeFaqModal();
      }
    });
  }

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDesktopModal();
      closeFaqModal();
    }
  });
});

// Export application API on window for external testing or administrative expansion
window.gloVAS = {
  categories,
  initiateUSSD,
  trackServiceClick,
  navigateToCategory,
  renderHomeView,
  openFaqModal,
  closeFaqModal,
  closeDrawer,
  openInfoModal
};
