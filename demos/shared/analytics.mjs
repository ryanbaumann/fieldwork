const CANONICAL_HOST = 'ryanbaumann.dev';

function cleanCampaignValue(value) {
  return /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(value || '') ? value.toLowerCase() : '';
}

export function installAnalytics(measurementId) {
  if (!measurementId || typeof window === 'undefined' || typeof document === 'undefined') return;

  const debug = new URLSearchParams(window.location.search).get('analytics_debug') === '1';
  if (window.location.hostname !== CANONICAL_HOST && !debug) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

  const analyticsScript = document.createElement('script');
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(analyticsScript);

  window.gtag('js', new Date());
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const trackPageView = () => {
    const query = new URLSearchParams(window.location.search);
    const campaign = {
      campaign_source: cleanCampaignValue(query.get('utm_source')),
      campaign_medium: cleanCampaignValue(query.get('utm_medium')),
      campaign_name: cleanCampaignValue(query.get('utm_campaign')),
      campaign_content: cleanCampaignValue(query.get('utm_content')),
    };
    for (const key of Object.keys(campaign)) {
      if (!campaign[key]) delete campaign[key];
    }
    let pageReferrer = '';
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === window.location.origin) pageReferrer = `${referrer.origin}${referrer.pathname}`;
    } catch {
      // Missing or invalid referrers stay empty rather than entering analytics.
    }
    window.gtag('event', 'page_view', {
      page_location: `${window.location.origin}${window.location.pathname}`,
      page_referrer: pageReferrer,
      ...campaign,
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView, { once: true });
  } else {
    trackPageView();
  }
}
