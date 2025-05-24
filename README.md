# Najd Commercial Hub - Wholesale-First Landing Page

## Project Overview

This project is a single-page, multilingual (English, French, Arabic) landing page for Najd Commercial Hub, a newly constructed 14-unit commercial building in Hay Najd, Marrakech. The primary goal of this landing page is to generate highly qualified leads for the **wholesale purchase** of the entire building, with a secondary call-out for individual unit inquiries.

The page is designed to be responsive, fast-loading, SEO-friendly, and to provide a clear value proposition to potential real estate investors.

## Key Features

*   **Wholesale-First Strategy:** Content and CTAs are primarily targeted at wholesale investors.
*   **Multilingual Support:**
    *   English (default), French, and Arabic.
    *   Dynamic language switching via JavaScript.
    *   RTL (Right-to-Left) support for Arabic.
    *   `hreflang` tags for SEO.
*   **Responsive Design:** Mobile-first approach ensuring optimal viewing on all devices.
*   **Interactive Elements:**
    *   Mobile "hamburger" menu.
    *   Modal contact form for lead generation.
    *   Clickable contact methods (phone, WhatsApp, email).
    *   Toggleable Privacy Policy and Terms of Use sections.
*   **Lead Generation Focus:**
    *   Prominent Calls-to-Action (CTAs) like "Request Full Investment Portfolio."
    *   Contact form capturing essential lead details.
*   **SEO & Tracking:**
    *   Meta tags (title, description, keywords, Open Graph, Twitter Cards).
    *   Schema.org markup (Organization, WebSite, RealEstateListing, LocalBusiness, FAQPage).
    *   Google Tag Manager (GTM) integration stubs for page views, conversions, and other events.
    *   Placeholders for Meta Pixel and LinkedIn Insight Tag.
*   **Image Optimization:**
    *   Use of `<picture>` element for WebP (primary) and JPG (fallback) formats.
    *   Native lazy loading (`loading="lazy"`) for below-the-fold images.
    *   Eager loading (`loading="eager"`) for the hero image.
*   **Modern Technologies (Static HTML, CSS, JS):**
    *   Built as a single HTML file for simple deployment.
    *   Vanilla JavaScript for interactivity and translations (no external frameworks like React/Vue).
    *   Font Awesome for iconography.

## File Structure (Assumed for Deployment)

```
/ (root)
├── index.html         انرژی (This main landing page file)
└── images/
    ├── Najd_Logo_Concept.png
    ├── Najd_Logo_Final.svg (when ready)
    ├── Najd_Exterior_Hero_Wholesale.jpg
    ├── Najd_Exterior_Hero_Wholesale.webp
    ├── Najd_Photo_Exterior_Wide.jpg
    ├── Najd_Photo_Exterior_Wide.webp
    ├── Najd_Render_Corner_Cafe.jpg
    ├── Najd_Render_Corner_Cafe.webp
    ├── Najd_Render_UG_Gym.jpg
    ├── Najd_Render_UG_Gym.webp
    ├── Najd_Photo_Interior_Shop_Ceiling.jpg
    ├── Najd_Photo_Interior_Shop_Ceiling.webp
    ├── Najd_Map_Detailed_Location.png
    ├── Najd_Logo_Icon_Square.png (favicon)
    ├── Najd_Social_Cover_Photo.jpg (for social meta tags)
    └── ... (any other necessary static image assets)
```

## Setup & Local Development

1.  Ensure all image files listed in `index.html` are present in the `images/` subfolder.
2.  Open `index.html` in a modern web browser.
3.  For GTM, Meta Pixel, and LinkedIn tracking to work, replace the placeholder IDs in `index.html` with your actual IDs.
4.  Form submission is currently simulated in `index.html`. For live functionality, replace the simulation with a `fetch` call to a backend API endpoint.

## Key Action History & Development Notes

This project evolved through an iterative process:

1.  **Initial Brief & Core Content:**
    *   Defined project goals, target audience (wholesale-first), and core objectives.
    *   Outlined a detailed landing page structure (Hero, Problem/Solution, Benefits, Gallery, Social Proof, CTAs, Footer) with specific text content for English, French, and Arabic.
    *   Specified visual design elements (color palette, typography) and key image assets.

2.  **Initial HTML Generation (v1):**
    *   A comprehensive single HTML file (`index v1.html`) was created, incorporating the full page structure, English content, CSS for styling, and JavaScript for:
        *   Basic language switching framework (EN, FR, AR).
        *   Modal contact form (validation, simulated submission).
        *   Schema.org markup.
        *   GTM integration stubs.
    *   This version used `<img>` tags for all icons (benefits, trust badges, contact methods).

3.  **Mobile Header Refinement:**
    *   **Issue Identified:** The initial mobile header design (simple stacking of nav items) took up too much vertical screen space.
    *   **Solution:** Implemented a "hamburger" menu for mobile.
        *   HTML: Added a toggle button and wrapped navigation elements in a `.mobile-menu-panel`.
        *   CSS: Added styles for the hamburger icon, the collapsible panel, and to correctly display elements on desktop vs. mobile.
        *   JS: Added logic to toggle the menu's visibility and the hamburger/close icon state.
    *   This involved several iterations to get the HTML structure and CSS display logic correct for both views.

4.  **Integration of Legal Sections (Privacy Policy & Terms of Use):**
    *   HTML: Added new `<section>` blocks for Privacy Policy and Terms of Use content before the footer.
    *   CSS: Styled these sections and set them to be hidden by default.
    *   JS: Added functionality to toggle their visibility when corresponding links in the footer are clicked.
    *   Translation keys for legal content were added to the `translations` object. Placeholder machine translations were provided for FR/AR for development, with the explicit requirement for professional legal translation before going live.

5.  **Iconography Update (Font Awesome):**
    *   The Font Awesome CDN was added to the `<head>`.
    *   All `<img>` tags previously used for icons (benefits, trust badges, header contact, final CTA contacts, footer social) were replaced with Font Awesome `<i>` tags.
    *   CSS was updated to style these Font Awesome icons appropriately.

6.  **Translation System Refinements:**
    *   Ensured all new text elements (in the mobile menu, legal sections, aria-labels) had `data-lang` or `data-lang-aria-label` attributes.
    *   The `updateTextContent` JavaScript function was enhanced to handle `data-lang-aria-label` for accessibility.
    *   The function was also updated to correctly replace `[REPLACE_DATE]` placeholders in legal text with a defined `actualPolicyUpdateDate`.
    *   Addressed and fixed issues where translations weren't applying correctly due to missing keys or incorrect HTML structure after modifications.

7.  **Image Handling & Fixes:**
    *   Implemented `<picture>` element for key images to serve WebP with JPG fallbacks.
    *   Addressed issues with missing images due to incorrect paths or case sensitivity (e.g., `.PNG` vs `.png`).
    *   Clarified which images are essential vs. those replaced by Font Awesome.
    *   Noted browser intervention messages regarding native lazy loading as informational.

8.  **Layout Adjustments:**
    *   **Sticky Header Overlap:** Resolved the issue of the sticky header obscuring section titles when using anchor links by applying `scroll-margin-top` CSS to target sections.
    *   **Location Section Layout:** Discussed and provided CSS options for aligning the map image and text content within the dedicated "Location" section when their heights differ.

9.  **Strategic Content Decisions:**
    *   Discussed the practice of obscuring exact pricing (e.g., "~1xM MAD") for wholesale deals to encourage negotiation and qualify leads.
    *   Evaluated which sections should be included in the primary header navigation, opting for a concise selection focused on key investor information.

**Current Status & Pending Actions:**

*   The front-end structure, styling, and core JavaScript functionalities (mobile menu, language switching, modals, legal section toggles, anchor scrolling) are largely complete and tested.
*   **CRITICAL PENDING ACTIONS FOR CLIENT/DEVELOPER:**
    1.  **Professional Translations:** Replace all placeholder/machine-translated French and Arabic text (especially for legal sections) with final, accurate translations.
    2.  **Policy Update Date:** Set the correct `actualPolicyUpdateDate` in the JavaScript.
    3.  **Image Verification:** Ensure all necessary image files are correctly named, cased, and placed in the `images/` folder for deployment.
    4.  **Tracking IDs:** Input actual GTM, Meta Pixel, and LinkedIn Insight Tag IDs.
    5.  **Backend Form Submission:** Replace the simulated form submission with a live API call.
    6.  **Final URL/Domain Updates:** Ensure all hardcoded URLs reflect the live domain.
    7.  **Comprehensive Testing:** Across all browsers, devices, and functionalities before launch.

This README aims to provide a good overview for anyone picking up the project or for future reference.
