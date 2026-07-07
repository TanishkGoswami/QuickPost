# Meta App Review Submission Guide: QuickPost

This document contains everything you need to submit your Meta App Review, including the exact text to paste for the "Describe how your app uses this permission" fields, and step-by-step scripts for recording the required screencasts.

## ⚠️ Important Note on Screencasts
Since I am an AI, I cannot log into your personal Facebook account or record the physical screen of your computer. **Meta requires you to record these videos yourself** using your actual app interface and your test Facebook/Instagram accounts.

However, I have written **exact step-by-step scripts** for you to follow while recording the videos, as well as the exact text you need to copy and paste into the Meta review form.

### 🎥 General Rules for Meta Screencasts
1. **Show the End-to-End Flow**: Always start from your app's login/dashboard screen.
2. **Show Facebook Login**: Show the user clicking "Connect Facebook/Instagram" and the Meta permissions dialog popping up.
3. **Demonstrate the Feature**: Show exactly how the requested permission is used in your app's UI.
4. **Voiceover**: Meta reviewers heavily prefer a voiceover explaining what is happening in English. Read the "Voiceover" scripts provided below while you record.
5. **No Editing**: Do not cut or edit the video. Keep it as one continuous recording per permission.
6. **Use a Test Account**: Use your own account linked to a test Facebook Page and Instagram Professional account.

---

## 1. `instagram_basic`
**Required for**: Most other Instagram permissions.

### Description to copy/paste:
> "Our application, QuickPost, uses the instagram_basic permission to authenticate users and fetch their Instagram Professional account profile information (such as username and profile picture). This information is displayed in our app's dashboard so the user knows which Instagram account they have connected to our platform for scheduling and managing their posts."

### Screencast Video Script / Steps:
1. Start at the QuickPost dashboard screen.
2. Click the "Connect Instagram" or "Add Channel" button.
3. Show the Facebook Login window popping up.
4. Go through the Facebook authorization steps, explicitly selecting the Instagram account.
5. Return to the QuickPost dashboard where the connected profile is now visible.
6. **Voiceover to read**: *"Here, the user connects their Instagram account. We use the instagram_basic permission to read their basic profile data and display their connected account in our dashboard, as seen here."*

---

## 2. `pages_show_list`
**Required for**: `pages_manage_metadata` and `pages_read_engagement`.

### Description to copy/paste:
> "QuickPost uses the pages_show_list permission during the onboarding process. When a user connects their Facebook account, we use this permission to retrieve a list of the Facebook Pages they manage. This allows the user to select exactly which Facebook Page they want to link to our platform for publishing and analytics."

### Screencast Video Script / Steps:
1. Start at the QuickPost dashboard.
2. Click "Connect Facebook Page" or similar.
3. Show the Facebook login flow.
4. Show the QuickPost UI where a dropdown or list of their managed Facebook Pages appears.
5. **Voiceover to read**: *"We use the pages_show_list permission to fetch the Facebook Pages the user manages. As you can see, the app displays this list so the user can select which specific Page they want to connect to our platform."*

---

## 3. `instagram_content_publish`

### Description to copy/paste:
> "QuickPost uses the instagram_content_publish permission to allow our users to publish photos and videos directly to their connected Instagram Professional account from our platform. Users can create a post within our application, and we use this permission to push that content to their live Instagram feed."

### Screencast Video Script / Steps:
1. Start at the QuickPost post-creation screen.
2. Select an image or video to upload and write a test caption.
3. Select the connected Instagram account.
4. Click the "Publish" or "Post Now" button.
5. Open the actual Instagram app or website and show the post successfully published on the profile.
6. **Voiceover to read**: *"We use the instagram_content_publish permission to allow users to create and publish posts from our app. Here I am creating a post, hitting publish, and you can see it has successfully appeared on the connected Instagram profile."*

---

## 4. `instagram_manage_contents`

### Description to copy/paste:
> "We use the instagram_manage_contents permission to allow users to view, edit, and delete the posts they have published to their Instagram Professional account directly from the QuickPost dashboard. This provides a unified content management experience."

### Screencast Video Script / Steps:
1. Go to the "Published Posts" or "History" tab in QuickPost.
2. Show a list of past Instagram posts inside your app.
3. Select a post and click "Delete" (if your app supports deletion) or show how you can view the content details.
4. **Voiceover to read**: *"We use the instagram_manage_contents permission so users can manage their existing Instagram media. Here, the user can see their past posts and interact with them directly from our dashboard."*

---

## 5. `instagram_manage_messages`

### Description to copy/paste:
> "QuickPost uses the instagram_manage_messages permission to power our unified inbox feature. This allows users to read and reply to their Instagram Direct Messages directly within our application, making it easier for businesses to manage their customer support."

### Screencast Video Script / Steps:
1. Start at the "Inbox" or "Messages" tab in QuickPost.
2. Open a test Instagram account on your phone and send a DM to the connected account.
3. Show the DM appearing in the QuickPost interface.
4. Type a reply in QuickPost and click send.
5. Show the reply received on the test phone.
6. **Voiceover to read**: *"We use the instagram_manage_messages permission to let users reply to direct messages. As you can see, a message was sent to the account, we received it in our app, and replied successfully."*

---

## 6. `pages_messaging`

### Description to copy/paste:
> "QuickPost uses the pages_messaging permission to allow users to view and respond to messages sent to their connected Facebook Page from within our unified inbox. This helps businesses manage their customer inquiries from a single platform."

### Screencast Video Script / Steps:
1. Start at the QuickPost "Inbox" or "Messages" tab.
2. Send a Facebook Messenger message to the connected Facebook Page from a separate test user.
3. Show the message appearing in the QuickPost UI.
4. Type a reply in QuickPost and send it.
5. Show the reply successfully delivered to the test user on Messenger.
6. **Voiceover to read**: *"We use the pages_messaging permission to provide a unified inbox. Here, a customer sends a message to the Facebook Page, it appears in our app, and the business owner can reply directly from here."*

---

## 7. `pages_read_engagement`

### Description to copy/paste:
> "QuickPost uses the pages_read_engagement permission to gather basic analytics and performance data for the user's connected Facebook Page. We read data such as post likes, comments, and follower counts to display a performance dashboard so our users can track the success of their social media strategy."

### Screencast Video Script / Steps:
1. Go to the "Analytics" or "Dashboard" tab in QuickPost.
2. Point out the metrics showing Facebook Page data (e.g., Follower count, Post Likes).
3. **Voiceover to read**: *"We use the pages_read_engagement permission to fetch metrics about the user's Facebook Page. As shown here, we display engagement data like likes and comments so the user can analyze their content performance."*

---

## 8. `pages_manage_metadata`

### Description to copy/paste:
> "We use the pages_manage_metadata permission to subscribe to Webhooks for the user's connected Facebook Page. This allows our application to receive real-time notifications when new comments or messages are received, ensuring our unified inbox and analytics remain up-to-date instantly."

### Screencast Video Script / Steps:
1. Go through the Facebook account connection flow in your app.
2. Trigger a real-time event (like sending a message or leaving a comment on the Facebook page).
3. Show the message/comment appearing in your app instantly without needing to refresh the page.
4. **Voiceover to read**: *"We use the pages_manage_metadata permission to subscribe to webhooks. This allows us to receive real-time updates, like this new message appearing instantly in our app without refreshing."*

---

## 🛠️ "Ensure you have performed required API test calls"
Meta requires that you actually make successful API calls for these permissions using your **App Admin or Developer account** before you submit the review. 
1. Run your QuickPost app locally (`npm run dev`).
2. Log into your app using your own Facebook account.
3. Actually perform the actions: post a photo, send a DM to your connected page and reply to it, load your analytics dashboard, etc.
4. Meta's system automatically detects these API calls. Once they detect the API calls have been made, the "Submit" button for the app review will become clickable.

## 📝 Instructions for how to reproduce this feature (If prompted by Meta)
If the review form asks for "Instructions for how to reproduce":
1. Go to our website / app interface.
2. Click "Log in" or "Connect Facebook/Instagram".
3. Log in with a Facebook account that manages a Facebook Page and an Instagram Professional account.
4. Navigate to the `[Specify the tab, e.g., Create Post or Inbox]` to see the feature in action.
