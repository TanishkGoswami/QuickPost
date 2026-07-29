# Meta App Review Submission Guide: GAP-socialpilot

This document contains the filtered Meta App Review material for GAP-socialpilot based on the permissions currently requested by the codebase.

## Important

GAP-socialpilot's active Instagram connect flow uses Instagram Login for Business, so submit the `instagram_business_*` permissions shown below for Instagram review.

Do not submit these legacy permissions unless you intentionally re-enable the older Facebook Login Instagram flow:

- `instagram_basic`
- `instagram_content_publish`
- `instagram_manage_comments`
- `instagram_manage_messages`
- `instagram_manage_insights`
- `pages_messaging`
- `instagram_manage_contents`

## Permissions To Submit

### Instagram Login for Business

- `instagram_business_basic`
- `instagram_business_content_publish`
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`
- `instagram_business_manage_insights`

### Facebook Pages

- `public_profile`
- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_metadata`
- `pages_manage_posts`

### Threads

- `threads_basic`
- `threads_content_publish`

## App Review Setup Checklist

Before submitting, make sure these items are ready in Meta Developer Console:

- App name: `GAP-socialpilot`
- App domain: your production domain
- Privacy Policy URL: your live privacy policy page
- Terms of Service URL: your live terms page
- User Data Deletion URL or data deletion instructions page
- App icon uploaded
- Business verification completed if Meta asks for it
- Valid OAuth redirect URIs configured for production
- Instagram test professional account connected to a test Facebook/Meta asset if required by your setup
- Facebook test Page available for Pages review
- Test user credentials for reviewer, if your app requires login before using features
- Successful API calls made by an app admin/developer account before submission

## General Screencast Rules

- Record one continuous video per permission or per grouped use case.
- Start from the GAP-socialpilot login or dashboard screen.
- Show the user clicking the relevant connect or publish button.
- Show the Meta permission dialog or connected account state.
- Demonstrate the exact feature that needs the permission.
- Use a test Facebook account, Facebook Page, Instagram Professional account, and Threads profile.
- Add a simple English voiceover explaining what is happening.
- Do not use unrelated accounts, private customer data, or fake UI mockups.

## Instagram Permissions

### `instagram_business_basic`

Required for account connection and profile display.

#### Description to paste

GAP-socialpilot uses `instagram_business_basic` to let users connect their Instagram Professional account and display basic account information inside the app, including account ID, username, profile picture, account type, follower count, and media count. This helps the user confirm which Instagram account is connected before using publishing, analytics, and AutoDM features.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Open the Connect/Channels page.
3. Click Connect Instagram.
4. Complete the Instagram Login for Business authorization flow.
5. Return to GAP-socialpilot and show the connected Instagram account with username/profile details.

#### Voiceover

Here the user connects an Instagram Professional account to GAP-socialpilot. We use `instagram_business_basic` to read and display basic profile details so the user can confirm the correct Instagram account is connected.

### `instagram_business_content_publish`

Required for Instagram post, Reel, and Story publishing.

#### Description to paste

GAP-socialpilot uses `instagram_business_content_publish` so users can publish content they create or schedule inside GAP-socialpilot to their connected Instagram Professional account. Users choose media, add captions, select the Instagram account, and GAP-socialpilot publishes the content through Meta's official API.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Open the composer or create-post screen.
3. Upload a test image or video.
4. Add a test caption.
5. Select the c onnected Instagram account.
6. Publish the post.
7. Open Instagram and show that the post, Reel, or Story was published.

#### Voiceover

Here the user creates a post in GAP-socialpilot and publishes it to Instagram. We use `instagram_business_content_publish` only to publish user-created content to the connected Instagram Professional account.

### `instagram_business_manage_comments`

Required for comment monitoring and comment-triggered automation.

#### Description to paste

GAP-socialpilot uses `instagram_business_manage_comments` to read comments on the user's connected Instagram Professional account so the user can create keyword-based AutoDM automations. When a comment matches a configured trigger keyword, GAP-socialpilot can process the event and perform the user's selected automation workflow.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Open AutoDM or Automations.
3. Create a keyword automation for a selected Instagram post.
4. From another test Instagram account, leave a comment using the trigger keyword.
5. Show the comment event or automation result inside GAP-socialpilot.

#### Voiceover

Here the user creates an automation based on comments on their own Instagram post. We use `instagram_business_manage_comments` to detect eligible comments and trigger the automation configured by the user.

### `instagram_business_manage_messages`

Required for Instagram DM automation and replies.

#### Description to paste

GAP-socialpilot uses `instagram_business_manage_messages` to receive and send Instagram messages for the connected Instagram Professional account. This powers the AutoDM feature, where users configure automated replies and lead capture flows for people who interact with their Instagram account.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Open AutoDM or Inbox.
3. Configure a reply flow or open an existing automation.
4. From a separate test Instagram account, send a DM or trigger a DM automation.
5. Show the message or automated reply inside GAP-socialpilot.
6. Show the reply delivered in Instagram.

#### Voiceover

Here a user manages Instagram messages through GAP-socialpilot. We use `instagram_business_manage_messages` to receive message events and send replies that the user configured through the AutoDM feature.

### `instagram_business_manage_insights`

Required for Instagram analytics and automation performance reporting.

#### Description to paste

GAP-socialpilot uses `instagram_business_manage_insights` to fetch analytics for the user's connected Instagram Professional account and media. The app displays metrics such as reach, views, profile views, likes, comments, and post performance so users can understand how their content and automations are performing.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Open the dashboard, analytics, or automation insights page.
3. Select the connected Instagram account.
4. Show Instagram performance metrics displayed in GAP-socialpilot.
5. If available, open a post-level insights view.

#### Voiceover

Here the user views analytics for their connected Instagram account. We use `instagram_business_manage_insights` to show performance metrics so the user can evaluate posts and automation results.

## Facebook Page Permissions

### `public_profile`

Required for Meta login identity in the Facebook Page connection flow.

#### Description to paste

GAP-socialpilot uses `public_profile` during Facebook Login to identify the user connecting a Facebook Page. This lets GAP-socialpilot complete the OAuth flow and associate the selected Page with the correct GAP-socialpilot account.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Click Connect Facebook.
3. Show the Meta login/authorization screen.
4. Complete authorization and return to GAP-socialpilot.

#### Voiceover

Here the user signs in with Meta to connect a Facebook Page. We use `public_profile` only to identify the Meta user during the connection flow.

### `pages_show_list`

Required to list Facebook Pages the user can connect.

#### Description to paste

GAP-socialpilot uses `pages_show_list` to retrieve the Facebook Pages the user manages during account setup. This allows the user to choose the specific Page they want to connect for publishing and analytics.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Click Connect Facebook.
3. Complete Meta authorization.
4. Show the connected Page or Page selection screen in GAP-socialpilot.

#### Voiceover

Here GAP-socialpilot lists the Facebook Pages available to the user. We use `pages_show_list` so the user can select the Page they want to connect.

### `pages_read_engagement`

Required for Page engagement data and Page validation.

#### Description to paste

GAP-socialpilot uses `pages_read_engagement` to read engagement and basic performance data for the connected Facebook Page. This supports the dashboard and helps users view post/page performance for content they manage through GAP-socialpilot.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Connect or select a Facebook Page.
3. Open the dashboard, analytics, or history page.
4. Show Facebook Page engagement or post result data.

#### Voiceover

Here the user views Facebook Page performance inside GAP-socialpilot. We use `pages_read_engagement` to retrieve engagement data for the Page the user connected.

### `pages_manage_metadata`

Required for webhook subscriptions and Page metadata access.

#### Description to paste

GAP-socialpilot uses `pages_manage_metadata` to manage webhook subscriptions for the user's connected Facebook Page and keep Page-related integrations up to date. This allows GAP-socialpilot to receive real-time events needed for connected workflows and account management.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Connect a Facebook Page.
3. Show the Page as connected.
4. Trigger a supported event, such as a Page-related webhook event if available.
5. Show the event or updated state in GAP-socialpilot.

#### Voiceover

Here the user connects a Facebook Page. We use `pages_manage_metadata` to subscribe the selected Page to webhook events and keep the connected workflow updated.

### `pages_manage_posts`

Required for Facebook Page post publishing.

#### Description to paste

GAP-socialpilot uses `pages_manage_posts` so users can publish content from GAP-socialpilot to their connected Facebook Page. Users create a post, upload media, select the Facebook Page, and GAP-socialpilot publishes the content through Meta's official Page publishing APIs.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Open the composer.
3. Upload a test image or video and add a test caption.
4. Select the connected Facebook Page.
5. Publish the post.
6. Open Facebook and show the post on the Page.

#### Voiceover

Here the user publishes a post from GAP-socialpilot to their Facebook Page. We use `pages_manage_posts` only to publish user-created content to the Page they selected.

## Threads Permissions

### `threads_basic`

Required for Threads account connection and profile display.

#### Description to paste

GAP-socialpilot uses `threads_basic` to connect a user's Threads account and display basic profile information such as account ID, username, and profile picture inside GAP-socialpilot.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Click Connect Threads.
3. Complete the Threads authorization flow.
4. Return to GAP-socialpilot and show the connected Threads account.

#### Voiceover

Here the user connects their Threads account. We use `threads_basic` to read basic profile information and display the connected account in GAP-socialpilot.

### `threads_content_publish`

Required for publishing to Threads.

#### Description to paste

GAP-socialpilot uses `threads_content_publish` so users can publish text and media content from GAP-socialpilot to their connected Threads account. The user creates the content in GAP-socialpilot, selects Threads, and publishes it through the official Threads API.

#### Screencast steps

1. Log in to GAP-socialpilot.
2. Open the composer.
3. Create a test Threads post.
4. Select the connected Threads account.
5. Publish the post.
6. Open Threads and show the post on the connected account.

#### Voiceover

Here the user publishes a post from GAP-socialpilot to Threads. We use `threads_content_publish` only to publish content that the user creates and confirms in the app.

## Required API Test Calls Before Submission

Meta often requires successful API calls before the Submit button becomes available. Use an app admin, developer, or tester account and perform these actions before submitting:

- Connect Instagram through GAP-socialpilot.
- Fetch/display the connected Instagram account.
- Publish one test Instagram post, Reel, or Story if that feature is being submitted.
- Create or test one Instagram comment automation.
- Send or receive one Instagram DM automation/reply.
- Load Instagram analytics or insights.
- Connect a Facebook Page.
- Publish one test Facebook Page post if `pages_manage_posts` is being submitted.
- Load Facebook Page analytics or engagement data if `pages_read_engagement` is being submitted.
- Connect Threads.
- Publish one test Threads post if `threads_content_publish` is being submitted.

## Reviewer Test Instructions

Use this as the general "Instructions for reviewer" text, edited with your live URLs and credentials:

1. Go to `[YOUR_PRODUCTION_APP_URL]`.
2. Log in with the reviewer test account: `[TEST_EMAIL]` / `[TEST_PASSWORD]`.
3. Open the dashboard.
4. To test Instagram, go to Connect/Channels and click Connect Instagram.
5. Log in with a Meta/Instagram test account that has an Instagram Professional account.
6. After connection, open Composer to publish content, AutoDM to configure comment/DM automation, and Analytics/Dashboard to view insights.
7. To test Facebook Pages, click Connect Facebook and select a managed Facebook Page.
8. Open Composer, select Facebook, publish a test post, then verify it appears on the selected Page.
9. To test Threads, click Connect Threads, authorize the account, then publish a test Threads post from Composer.

## Data Handling Statement

GAP-socialpilot uses Meta permissions only to provide user-requested account connection, publishing, analytics, webhook, and automation features. GAP-socialpilot does not sell Meta data, does not use Meta data for third-party advertising, and does not use Meta data to train generalized AI or machine learning models. Users can disconnect accounts from the app, and data deletion requests are handled through the published data deletion process.

## Code References

- Instagram Business scopes: `supabase/functions/oauth-start/index.ts`
- Facebook Page scopes: `server/src/services/facebookOAuth.js`
- Threads scopes: `server/src/services/threadsOAuth.js`
- Instagram media and insights: `supabase/functions/_shared/metaService.ts`
- AutoDM webhook and automation logic: `server/src/services/autodm.js`
- Facebook publishing: `server/src/services/facebook.js`
- Threads publishing: `server/src/services/threads.js`

