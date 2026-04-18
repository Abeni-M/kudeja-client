# How to Set Up Your Gemini AI Assistant

To get the most out of your new Live Chat, you can connect it to the Google Gemini AI. This will make the bot much smarter and able to understand complex questions in both English and Amharic.

## Step 1: Get your API Key
1.  Visit **[Google AI Studio](https://aistudio.google.com/)**.
2.  Sign in with your Google Account.
3.  On the left sidebar, click **"Get API key"**.
4.  Click **"Create API key in new project"**.
5.  **Copy** the API key that is generated.

## Step 2: Add the Key to Your Project
1.  Open the backend folder (`kudeja-backend`).
2.  Find the `.env` file.
3.  Add the following line at the bottom:
    ```env
    GEMINI_API_KEY=your_copied_key_here
    ```
4.  Restart your backend server.

## Step 3: Test the Chat
- Open your website and start a chat.
- The bot will now use Gemini to provide detailed, context-aware responses!

---

> [!TIP]
> If you don't add the key, the system will still work using a set of "Smart Keywords" we built as a backup.
