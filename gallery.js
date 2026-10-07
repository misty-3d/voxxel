(() => {
    const gallery = document.querySelector('.gallery-container');
    const status = document.querySelector('.gallery-status');
    const lightbox = document.getElementById('lightbox');
    const content = document.getElementById('lightbox-content');
    const close = document.getElementById('lightbox-close');
    let previousFocus;

    function openPreview(item) {
        previousFocus = document.activeElement;
        const media = document.createElement(item.type === 'video' ? 'video' : 'img');
        media.src = item.src;
        if (item.type === 'video') {
            media.controls = true;
            media.autoplay = true;
            media.playsInline = true;
        } else {
            media.alt = item.name;
        }
        media.addEventListener('error', () => {
            const message = document.createElement('p');
            message.textContent = 'This media is unavailable or cannot be played in this browser.';
            message.style.cssText = 'color: white; padding: 1rem; text-align: center';
            content.replaceChildren(message);
        }, { once: true });
        content.replaceChildren(media);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        close.focus();
    }

    function closePreview() {
        lightbox.classList.remove('active');
        content.replaceChildren();
        document.body.style.overflow = '';
        previousFocus?.focus();
    }

    close.addEventListener('click', closePreview);
    lightbox.addEventListener('click', event => {
        if (event.target === lightbox) closePreview();
    });
    document.addEventListener('keydown', event => {
        if (!lightbox.classList.contains('active')) return;
        if (event.key === 'Escape') closePreview();
        if (event.key === 'Tab') {
            // Keep keyboard focus inside the open preview.
            const focusable = [close, ...content.querySelectorAll('video[controls]')];
            const index = focusable.indexOf(document.activeElement);
            event.preventDefault();
            focusable[(index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
        }
    });

    let lastItems;
    function render(data) {
        const items = data[gallery.dataset.folder];
        if (!Array.isArray(items)) throw new Error('Missing gallery data');
        const signature = JSON.stringify(items);
        if (signature === lastItems) return;
        lastItems = signature;
        const fragment = document.createDocumentFragment();
        let failed = 0;
        for (const item of items) {
            const card = document.createElement('div');
            card.className = 'gallery-item';
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Open ${item.name}`);
            const media = document.createElement(item.type === 'video' ? 'video' : 'img');
            function sizeThumbnail() {
                const width = item.type === 'video' ? media.videoWidth : media.naturalWidth;
                const height = item.type === 'video' ? media.videoHeight : media.naturalHeight;
                if (!width || !height) return;
                // Crop tall portraits to 4:5; preserve all wider aspect ratios.
                media.style.aspectRatio = String(Math.max(width / height, 4 / 5));
                media.style.objectFit = 'cover';
                media.style.objectPosition = 'center';
            }
            media.addEventListener(item.type === 'video' ? 'loadedmetadata' : 'load', sizeThumbnail);
            media.addEventListener('error', () => {
                card.remove();
                failed++;
                if (lastItems === signature && failed === items.length) {
                    status.hidden = false;
                    status.textContent = location.protocol === 'file:'
                        ? 'The gallery files have changed. Run npm run dev and open http://localhost:3000 for automatic updates.'
                        : 'The media files are unavailable. If they were renamed, wait for the latest site deployment and reload.';
                }
            }, { once: true });
            if (item.type === 'video') {
                // A video becomes clickable only after a frame can be decoded.
                card.hidden = true;
                media.addEventListener('loadeddata', () => { card.hidden = false; }, { once: true });
                media.addEventListener('loadedmetadata', () => {
                    // Seek past black opening frames and request a thumbnail frame.
                    if (Number.isFinite(media.duration) && media.duration > 0) {
                        media.currentTime = Math.min(0.1, media.duration / 2);
                    }
                }, { once: true });
                media.muted = true;
                media.loop = true;
                media.playsInline = true;
                media.preload = 'metadata';
            } else {
                media.alt = item.name;
                media.loading = 'lazy';
            }
            media.src = item.src;
            card.appendChild(media);
            card.addEventListener('click', () => openPreview(item));
            card.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openPreview(item);
                }
            });
            fragment.appendChild(card);
        }
        gallery.replaceChildren(fragment);
        status.hidden = items.length > 0;
        status.textContent = 'No media in this gallery yet.';
    }

    async function loadData(url) {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('Gallery data unavailable');
        render(await response.json());
    }

    async function initialize() {
        if (location.protocol !== 'file:') {
            try {
                // Live preview always reads the current folder names first.
                await loadData('api/gallery');
                setInterval(() => {
                    if (!document.hidden) loadData('api/gallery').catch(() => {});
                }, 3000);
                return;
            } catch {
                try {
                    // GitHub Pages serves data regenerated by the deployment.
                    // Bypass an older cached script after files have been renamed.
                    await loadData('gallery-data.json');
                    return;
                } catch {
                    // Keep the generated script as an offline fallback.
                }
            }
        }
        try {
            render(window.galleryData);
        } catch {
            status.textContent = 'The gallery could not load. Please refresh and try again.';
        }
    }
    initialize();
})();
