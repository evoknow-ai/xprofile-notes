# Chrome Web Store Submission Guide

## Files to upload

- Extension package: `dist/XProfileNotes-1.2.0-Chrome-Web-Store.zip`
- Store icon: included inside the ZIP as `icons/icon128.png`
- Screenshot 1: `store/assets/screenshot-profile-note-1280x800.png`
- Screenshot 2: `store/assets/screenshot-notes-manager-1280x800.png`
- Small promotional tile: `store/assets/promo-small-440x280.png`
- Optional marquee: `store/assets/promo-marquee-1400x560.png`

## Dashboard steps

1. Open the Chrome Web Store Developer Dashboard.
2. Click **New item** and upload `XProfileNotes-1.2.0-Chrome-Web-Store.zip`.
3. In **Store listing**, paste the content from `CHROME-WEB-STORE-LISTING.md` and upload the screenshots and promotional images.
4. Use **Productivity** as the category and **English** as the language.
5. In **Privacy practices**, paste the answers from `PRIVACY-PRACTICES.md`.
6. Set the privacy-policy URL to `https://github.com/evoknow-ai/xprofile-notes/blob/main/PRIVACY.md`.
7. In reviewer notes or test instructions, paste `REVIEWER-INSTRUCTIONS.md`.
8. Choose the desired distribution visibility and regions.
9. Save the draft, resolve any dashboard warnings, and submit for review.

## Before submitting

- Confirm the GitHub privacy-policy URL opens without authentication.
- Confirm the uploaded package reports version 1.2.0.
- Confirm no data-collection boxes are selected unless the dashboard's wording explicitly treats local-only storage as collection.
- Confirm remote code is declared as **No**.
- Test the uploaded ZIP with **Load unpacked** before submission.
