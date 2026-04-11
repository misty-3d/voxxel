document.addEventListener('DOMContentLoaded', function () {
    // Only enable for fine pointers (mouse) — skip touch devices
    if (!window.matchMedia || !window.matchMedia('(pointer:fine)').matches) return;

    // create cursor elements
    var cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    var outer = document.createElement('div');
    outer.className = 'outer';
    var inner = document.createElement('div');
    inner.className = 'inner';
    cursor.appendChild(outer);
    cursor.appendChild(inner);
    document.body.appendChild(cursor);

    // hide native cursor
    document.documentElement.classList.add('custom-cursor-enabled');

    // move cursor
    function move(e) {
        var x = e.clientX;
        var y = e.clientY;
        outer.style.left = x + 'px';
        outer.style.top = y + 'px';
        inner.style.left = x + 'px';
        inner.style.top = y + 'px';
    }
    document.addEventListener('mousemove', move, {passive: true});

    // add hover behavior for interactive elements
    function attachHover(el) {
        el.addEventListener('pointerenter', function () { outer.classList.add('link-hover'); inner.classList.add('invert'); });
        el.addEventListener('pointerleave', function () { outer.classList.remove('link-hover'); inner.classList.remove('invert'); });
    }

    var initial = Array.prototype.slice.call(document.querySelectorAll('a, button, [role="link"], input[type="button"], input[type="submit"]'));
    initial.forEach(attachHover);

    // delegation for dynamically added elements
    document.addEventListener('pointerover', function (e) {
        var t = e.target.closest && e.target.closest('a, button, [role="link"], input[type="button"], input[type="submit"]');
        if (t) { outer.classList.add('link-hover'); inner.classList.add('invert'); }
    });
    document.addEventListener('pointerout', function (e) {
        var t = e.target.closest && e.target.closest('a, button, [role="link"], input[type="button"], input[type="submit"]');
        if (t) { outer.classList.remove('link-hover'); inner.classList.remove('invert'); }
    });

    // hide on leaving window
    document.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { cursor.style.opacity = '1'; });
});
