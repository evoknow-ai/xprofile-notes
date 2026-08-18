# Reviewer Instructions

## Core test

1. Install the extension and open `https://x.com/` in a desktop Chrome window.
2. Open any X profile page.
3. Confirm that an **Add private note** button appears near the profile handle.
4. Click the button, enter a short note and optional comma-separated tags, then save.
5. Confirm that the button changes to indicate a saved note and that hovering over the blue pencil indicator previews the note.
6. Click the extension toolbar icon.
7. Confirm that the saved profile appears and can be found by searching its handle, note text, or tag.
8. Click the saved handle and confirm that its X profile opens in a new tab.
9. Optionally test **Export backup** and **Import backup** using the generated JSON file.

## Account requirement

The extension has no account or server. An X account may be needed only to view some X pages due to X's own access rules.

## Data and network behavior

All notes are stored in `chrome.storage.local`. The extension makes no external network requests, uses no remote code, and sends no user data to the developer or third parties.

## Requested access

Host access is deliberately limited to `x.com` and `twitter.com`, where the extension provides its single purpose.
