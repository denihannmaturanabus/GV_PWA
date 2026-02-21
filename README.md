<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e58c27f4-03e5-41d2-beba-c8b391c5fe38

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Configure your Supabase credentials in `.env.local`:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
4. (Optional) Set a custom password in `.env.local`:
   - `VITE_APP_PASSWORD`: Your custom login password (default: `gonzalo123`)
5. Run the app:
   `npm run dev`

## Security

The app includes a login screen to protect access. The default password is `gonzalo123`. 

To change it:
1. Add `VITE_APP_PASSWORD=tu-contraseña-secreta` to your `.env.local` file
2. In Vercel, add the same variable in Settings > Environment Variables
