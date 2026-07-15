# Google Analytics setup

The portfolio already implements consent-controlled GA4 loading. The Google tag is not requested until a visitor chooses **Allow analytics**, advertising signals stay denied, URLs are stripped to origin + path, and demos are not instrumented. Setup only requires a GA4 web stream and its public Measurement ID.

## 1. Create the GA4 property

1. Open [Google Analytics](https://analytics.google.com/) and select the account that should own this portfolio's data.
2. Open **Admin**, choose **Create**, then **Property**.
3. Name it `Ryan Baumann Portfolio`.
4. Choose the reporting timezone and currency you want to use, complete the business details, then select **Create**.

Google requires an Editor role or higher to create a property. See [Add a GA4 property](https://support.google.com/analytics/answer/9744165).

## 2. Create the web data stream

1. In the new property, open **Admin > Data collection and modification > Data streams**.
2. Select **Web**.
3. Use `https://www.ryanbaumann-portfolio.com` as the website URL and `Ryan Baumann Portfolio` as the stream name.
4. Create the stream.
5. In **Stream details**, copy the Measurement ID. It starts with `G-`. See [Find your Measurement ID](https://support.google.com/analytics/answer/12270356).

Do not paste Google's manual tag snippet into the site. The portfolio build already owns tag loading and consent behavior.

## 3. Give the deploy workflow the Measurement ID

1. Open the GitHub repository.
2. Go to **Settings > Secrets and variables > Actions > Variables**.
3. Select **New repository variable**.
4. Name it exactly `ANALYTICS_MEASUREMENT_ID` and paste the `G-...` value.
5. Save it. This ID is public configuration, not a secret.
6. Open **Actions > Deploy to Cloud Run > Run workflow** and run the workflow from `main`, or merge a change to `main` to trigger the normal deploy.

The workflow forwards the variable into the portfolio build. An empty value keeps Analytics disabled.

## 4. Verify consent before looking at reports

1. Open the production site in a fresh private browsing window.
2. Open browser developer tools and filter Network requests for `googletagmanager`, `google-analytics`, and `collect`.
3. Reload. Confirm there are no matching requests before making a consent choice.
4. Select **No thanks**, reload, and confirm there are still no matching requests.
5. Clear site data or use another private window. Select **Allow analytics**.
6. Confirm `gtag/js?id=G-...` loads and a GA4 `page_view` request follows.
7. Navigate to another portfolio page and check **Reports > Realtime** in GA4. Realtime data can take a few minutes to appear.

The persistent **Analytics settings** control in the footer lets you change the stored choice.

## 5. Mark a successful contact as a key event

The site sends `generate_lead` only after the email provider confirms delivery and the browser reaches `/contact-success/?delivered=1`.

1. With analytics allowed, submit a real test message through the production contact form.
2. In GA4, open **Admin > Data display > Events**.
3. Find `generate_lead` under recent events and select its star to mark it as a key event. If it has not appeared yet, wait for event processing and retry.
4. Verify it in **Reports > Realtime**, then delete or label the test message in the receiving inbox.

Marking an existing event affects reporting from that point forward and can take up to 24 hours to appear in standard reports. See [Mark events as key events](https://support.google.com/analytics/answer/13128484).

## 6. Keep the initial measurement small

Start with the events already emitted by the site:

- `page_view` after consent
- `select_content` for work, writing, talk, and demo links
- `share` for article sharing links
- `form_start` and `form_submit`
- `generate_lead` after confirmed delivery

Do not add form text, names, email addresses, OAuth values, activity IDs, locations, coordinates, route geometry, photos, or raw errors to analytics parameters. The privacy boundary is documented in `portfolio/content/pages/privacy.md`.
