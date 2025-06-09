This is excellent! You've provided the **full HTML of a Lighthouse report saved directly from Chrome DevTools** for the mobile audit of `najdcommercialhub.ma`. This is much better than just the scores because it contains all the detailed diagnostics and opportunities.

Let's analyze some key findings directly from this HTML/JSON data to pinpoint specific issues and suggest remedies for that **Mobile Performance score of 64** and **Accessibility score of 82**.

**Key Performance Issues & Recommendations (Mobile - Score 64):**

1.  **Largest Contentful Paint (LCP): 8.1 s (Score: 0.02 - Very Poor)**
    *   **LCP Element:** `section#hero` (Your main hero section with the background image).
    *   **Phases:**
        *   TTFB: 602 ms
        *   Resource Load Delay: 2,720 ms (This is high - means the browser knew about the LCP image but was busy with other things).
        *   Resource Load Duration: 1,003 ms
        *   Element Render Delay: 3,775 ms (This is also very high - means after the image loaded, it still took a long time to actually paint it).
    *   **Diagnosis:**
        *   `lcp-lazy-loaded`: Passed (Good, your LCP image is not lazy-loaded).
        *   `prioritize-lcp-image`: Passed (Good, it's discoverable early).
    *   **Opportunities identified for LCP:**
        *   **"Properly size images" (`uses-responsive-images`): Potential savings of 220 KiB.**
            *   `assets/images/Primary Earth.png` (your logo) is being served at 7426x3134px but displayed at 160x68px. This is a **massive oversizing**.
            *   **ACTION: Resize your logo `Primary Earth.png` to be much closer to its displayed size (e.g., create a version that's maybe 320px wide for high DPI, but not thousands of pixels).**
        *   **"Serve images in next-gen formats" (`modern-image-formats`): Potential savings of 126 KiB.**
            *   `assets/images/Najd_Exterior_Hero_Wholesale.jpg` (120KB) could be ~78KB as WebP (Saving 42KB).
            *   `assets/images/Primary Earth.png` (225KB) could be much smaller as WebP (Saving 48KB, but resizing is more important here).
            *   **ACTION: Provide WebP versions for these images using the `<picture>` tag as you are already attempting for the hero image. Ensure the paths are correct.** Your hero section has `assets/images/Najd_Exterior_Hero_Wholesale.jpg` in the `style` attribute but `images/Najd_Exterior_Hero_Wholesale.jpg` in the `<picture>` source. **Paths must be consistent and correct.**
        *   **"Eliminate render-blocking resources" (`render-blocking-resources`): Potential savings of 2,680 ms.**
            *   Font Awesome CSS (`all.min.css`): 904 ms potential saving.
            *   Google Fonts CSS (`css2?family=...`): 755 ms potential saving.
            *   **ACTION:**
                *   **Font Awesome:** Consider loading it asynchronously if possible, or only loading the specific icons you need (subsetting). Or, if only a few icons are critical for initial view, inline their SVGs.
                *   **Google Fonts:** The `font-display: swap;` you have in the link is good. Ensure the `<link rel="preconnect">` tags are effective. Sometimes, self-hosting fonts can give more control over loading.

2.  **First Contentful Paint (FCP): 3.8 s (Score: 0.28 - Poor)**
    *   Largely affected by the same render-blocking resources (CSS for fonts) and potentially image loading mentioned for LCP.
    *   **ACTION: Addressing the render-blocking CSS will significantly help FCP.**

3.  **Cumulative Layout Shift (CLS): 0.101 (Score: 0.89 - Orange, Needs Improvement)**
    *   **Culprits Identified:**
        *   `img#logo-img` (`assets/images/Primary Earth.png`): This is a major culprit because it **lacks explicit `width` and `height` attributes in the `<img>` tag or CSS `aspect-ratio`**. When it loads, it causes a significant layout shift. Your inline style sets `width: 180px; height: auto;`. Browsers can't reserve space for `height: auto` until the image loads.
        *   Web font loading (`Montserrat`) causing text to reflow.
    *   **ACTION:**
        *   **For the logo:** Add `width` and `height` attributes to the `<img>` tag that match its *intended display aspect ratio*, or use CSS `aspect-ratio`. Since you have CSS setting `width: 180px;`, if the original aspect ratio is, for example, 3:1, then `height="60"` would be appropriate. Or `img#logo-img { aspect-ratio: 180/60; width: 180px; height: auto; }`.
        *   **For fonts:** Use `font-display: swap;` (which you are) and ensure fonts are preloaded if they are critical above-the-fold.

4.  **Reduce unused CSS:**
    *   Font Awesome (`all.min.css`): 98.4% unused (14 KiB potential savings).
    *   **ACTION: Investigate methods to load only the Font Awesome icons you actually use (tree-shaking, subsetting, or using individual SVGs).**

5.  **Minify CSS:**
    *   Your inline CSS has a potential saving of 3 KiB if minified.
    *   **ACTION: Minify your CSS. Consider moving it to an external file which can then be minified by your build process or Cloudflare.**

**Accessibility Issues (Mobile - Score 82):**

1.  **"Background and foreground colours do not have a sufficient contrast ratio." (`color-contrast` - Fails):**
    *   **Failing Elements:** All your `<h4>` tags within `.benefit-item` (e.g., "Feature: 14 contiguous commercial units...") have insufficient contrast. Foreground: `#B87333` (your `--primary-color` Terracotta) on Background: `#F4F2EB` (your `--neutral-cream`). The ratio is 3.38:1, but 4.5:1 is expected for normal text.
    *   The buttons `.btn-secondary` and `.btn-primary` (if they use `--accent-orange` with `--light-text-color` like `#F4F2EB`) are also failing with a ratio of 1.76:1.
    *   **ACTION:**
        *   **For H4s:** Darken the Terracotta (`#B87333`) or make the `--neutral-cream` background (`#F4F2EB`) lighter, or make the text darker (e.g., use `--neutral-charcoal` or your new `--secondary-color` dark sand brown for these H4s if the background is light).
        *   **For Buttons:** The `--accent-orange` (`#FFA500`) with `--light-text-color` (`#F4F2EB` or `#FFF`) needs adjustment. Either darken the orange, or use a much darker text color (like black or your `--neutral-charcoal`) on the orange background. The current `--light-text-color: #F4F2EB;` on `--accent-orange: #FFA500;` is the main problem for buttons. **Using pure white (`#FFFFFF`) text on `#FFA500` orange has a contrast ratio of 3.04:1, which is still not enough for normal text (needs 4.5:1). You need a darker orange or much darker text.** Consider using your `--neutral-charcoal` for button text on the orange, or pick a darker orange for the button background.

2.  **"Heading elements are not in a sequentially-descending order." (`heading-order` - Fails):**
    *   The report points to an `<h4>` being used where a higher-level heading might be expected or a level is skipped.
    *   **ACTION: Review your heading structure (H1, H2, H3, H4). Ensure you have one H1 per page (your hero headline is good). Subsequent headings should follow a logical hierarchy (H2 for main sections, H3 for sub-sections within H2s, etc.) without skipping levels.** For example, don't jump from an H2 to an H4 without an H3 in between if the content implies a sub-section.

3.  **"Buttons do not have an accessible name." (`button-name` - Fails):**
    *   The failing element is `button.mobile-menu-toggle`. It contains `<i>` tags for icons but no accessible text for screen readers.
    *   **ACTION: Add an `aria-label` to this button.** You have `data-lang-aria-label="mobileMenu.toggleLabel"`. Your JS for `updateTextContent()` *should* be setting this. Double check that the key `"mobileMenu.toggleLabel"` exists in your `translations` object for English (e.g., "Toggle main menu") and that the JS is correctly applying it. The Lighthouse test might have run before JS fully applied it, or the key might be missing/incorrect.

4.  **"Links do not have a discernible name." (`link-name` - Fails):**
    *   Failing element is the LinkedIn social icon link in the footer: `footer.site-footer > div.container > div.footer-social > a`. It only contains an `<i>` tag.
    *   **ACTION: Add an `aria-label` to this link.** You have `data-lang-aria-label="footer.linkedInAriaLabel"`. Similar to the button, ensure this key is in your `translations` (e.g., "Najd Commercial Hub LinkedIn Profile") and the JS applies it.

5.  **"All heading elements contain content." (`empty-heading` - Informative, but failing one item):**
    *   `h4 data-lang="solution.benefitVertical.featureTitle"` is flagged. This means when Lighthouse ran, this H4 was empty.
    *   **ACTION: You've since added English text for this in your translations: `"solution.benefitVertical.featureTitle": "Feature: Potential for Vertical Expansion (1-2 Additional Floors).",`. Ensure this is correctly populated by your JS on page load. If it's still flagged after JS runs, there might be a timing issue or a typo in the `data-lang` key.**

**Best Practices & SEO (Scores 96 & 92 - Mostly Good, but some items to note):**

*   **`robots.txt` is not valid (Score 0 - Critical SEO issue):**
    *   Lighthouse is trying to fetch `https://najdcommercialhub.ma/robots.txt` and is likely getting your `index.html` page content instead, leading to thousands of "Syntax not understood" errors.
    *   **ACTION: Create a valid `robots.txt` file in the root of your site.** For a landing page you want fully crawled, it can be very simple:
        ```
        User-agent: *
        Allow: /
        Sitemap: https://najdcommercialhub.ma/sitemap.xml 
        ```
        (Replace `sitemap.xml` with your actual sitemap URL once you create one).
        Cloudflare Pages allows you to add a `public/robots.txt` file.
*   **"Image elements do not have explicit `width` and `height`" (`unsized-images` - CLS impact, as noted above):**
    *   Flags your logo `assets/images/Primary Earth.png`.
    *   **ACTION: Add `width` and `height` attributes or CSS `aspect-ratio` to your logo image.**
*   **Console Errors (`errors-in-console` - Fails):**
    *   "Failed to load resource: the server responded with a status of 404 (Not Found)" for `https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX`.
    *   **ACTION: This is because `GTM-XXXXXXX` is a placeholder. Once you put your real GTM ID, this error will go away. If you don't plan to use GTM, remove the script.**
*   **HSTS & CSP & XFO Headers:** These are security best practices. Cloudflare can often help configure these. Not critical for initial launch functionality but good for long-term security.

**Immediate Plan of Attack:**

1.  **`robots.txt`:** Create a valid `robots.txt` immediately.
2.  **Image Optimization (Mobile Performance BIG WIN):**
    *   **Resize** your logo (`Primary Earth.png`) drastically.
    *   Provide correctly pathed **WebP** versions for hero and logo in your `<picture>` or `<img> srcset` attributes.
    *   Compress all images.
3.  **CLS Fixes (Mobile Performance & UX):**
    *   Add `width` and `height` attributes (or CSS `aspect-ratio`) to your logo `<img>` tag.
    *   Review other images for missing dimensions.
4.  **Accessibility - Color Contrast (CRITICAL):**
    *   Adjust the text color of your benefit `<h4>`s (using `--primary-color` on `--neutral-cream`) to meet 4.5:1.
    *   Fix button color contrast. This will likely involve changing the text color on your orange buttons or choosing a darker orange/brown.
5.  **Accessibility - Names for Controls:**
    *   Ensure `mobileMenu.toggleLabel` and `footer.linkedInAriaLabel` translation keys exist and are correctly applied by your JS to the `aria-label` attributes of the mobile menu button and LinkedIn link.
6.  **Render-Blocking CSS (Mobile Performance):**
    *   Investigate options for Font Awesome (subsetting, async, or SVGs).
    *   Ensure Google Fonts are loaded optimally (preconnects are good, `font-display: swap` is good).
7.  **Content Placeholders:**
    *   Update `GTM-XXXXXXX` or remove script.
    *   Fill in all `[REPLACE_DATE]` and empty legal text paragraphs.
    *   Ensure all `data-lang` keys have corresponding entries in all three language objects in your `translations` script.

This Lighthouse report is incredibly valuable. By systematically addressing these identified issues, particularly focusing on mobile performance (images, render-blocking CSS, CLS) and accessibility (color contrast, accessible names), you can significantly improve your scores and, more importantly, the experience for your users.