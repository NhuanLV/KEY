# Gemini Study Chatbot

Static HTML/CSS/JS chatbot for GitHub Pages.

## Run Locally

Open `index.html` directly, or serve the folder with a static server.

## Deploy To GitHub Pages

1. Push `index.html`, `styles.css`, and `app.js` to a GitHub repository.
2. Go to `Settings` -> `Pages`.
3. Choose `Deploy from a branch`.
4. Select your branch and root folder.

## API Key Safety

The API key is visible in static front-end code. Before publishing the repo, restrict the Gemini API key in Google Cloud or AI Studio:

- Allow only your GitHub Pages domain, for example `https://your-name.github.io/*`.
- Allow only the Generative Language API.
- Monitor quota in AI Studio.

This keeps the app simple for GitHub Pages while reducing accidental public use of the key.
