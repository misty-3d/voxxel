# Voxxel portfolio

Put images or videos directly in the matching folder:

| Page | Folder |
| --- | --- |
| Artwork | `3D Artwork` |
| Archviz | `ArchVis` |
| Mockups | `3D Mockups` |
| VFX & Animation | `VFX & Animations` |

No filenames or gallery HTML need to be maintained. Files are sorted by name
using numeric order: `1.mp4`, `2.mp4`, …, `10.mp4`. Renaming files changes their order.

## Local preview

With Node.js installed, run `npm run dev` and open http://localhost:3000.
Adding, renaming, or removing media updates an open gallery within about three seconds.
Opening an HTML file directly or using a generic Live Server does not scan
folders: use this preview server for automatic updates, or run `npm run build`
after changing filenames and refresh the page.
Images and videos are discovered in all four folders; video playback depends on
the browser's support for the file's codec.

## GitHub Pages

In the repository's **Settings → Pages → Build and deployment**, select
**GitHub Actions** as the source (one-time setup). The included workflow builds
and publishes the site on each push to the repository's default branch. Add or
rename media in its folder, commit, and push (or commit the rename in GitHub's
web interface); the gallery updates automatically after deployment succeeds.
Upload `.github/workflows/pages.yml` along with the site files, including
`package.json` and `gallery-tools.cjs`. Check the **Actions → Publish portfolio**
run succeeds. No manual edit to either generated gallery data file is needed.

## Other static hosting

Set the hosting build command to `npm run build` and publish this directory.
The build scans the folders and regenerates `gallery-data.js` automatically.
For manual uploads, run `npm run build` before uploading the site. The generated
data also allows the HTML pages to open directly from disk.

A plain static host cannot list a folder from browser JavaScript. New files on
static hosting appear after the next build/deploy; simply uploading an image
without rebuilding requires a server with a folder-scanning endpoint.
