(() => {
    const nav = document.getElementById('primaryNav');
    if (!nav) return;

    const links = Array.from(nav.querySelectorAll('.nav-link'));
    const indicator = nav.querySelector('.nav-glide-indicator');
    if (!links.length || !indicator) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    let hoveredLink = null;
    let focusedLink = null;
    let currentTarget = null;
    let layoutFrame = 0;
    let magneticFrame = 0;
    let pointerPosition = null;
    let gapIsMoving = false;

    function activeLink() {
        return links.find((link) => link.getAttribute('aria-current') === 'page')
            || links.find((link) => link.classList.contains('active'));
    }

    function targetLink() {
        return focusedLink || hoveredLink || activeLink();
    }

    // Offset geometry excludes entrance and magnetic transforms. The indicator
    // follows layout independently, so a scroll cannot restart a hover glide.
    function geometry(link) {
        const label = link.querySelector('.nav-link-label');
        return {
            x: link.offsetLeft + label.offsetLeft,
            y: link.offsetTop + label.offsetTop + label.offsetHeight + 1,
            width: label.offsetWidth,
        };
    }

    function placeIndicator(box) {
        indicator.style.left = `${box.x}px`;
        indicator.style.top = `${box.y}px`;
        indicator.style.width = `${box.width}px`;
    }

    function updateIndicator() {
        const target = targetLink();
        if (!target) {
            indicator.classList.remove('is-visible');
            currentTarget = null;
            return;
        }

        const box = geometry(target);
        const wasVisible = indicator.classList.contains('is-visible');

        if (target !== currentTarget && wasVisible && !reducedMotion.matches) {
            // FLIP from the currently rendered position, including an interrupted
            // transition. Layout can then move the anchor without changing motion.
            const previous = indicator.getBoundingClientRect();
            const navBox = nav.getBoundingClientRect();
            const x = previous.left - navBox.left - nav.clientLeft - box.x;
            const y = previous.top - navBox.top - nav.clientTop - box.y;
            indicator.style.transition = 'none';
            placeIndicator(box);
            indicator.style.transform = `translate(${x}px, ${y}px) scaleX(${previous.width / box.width})`;
            indicator.getBoundingClientRect();
            indicator.style.removeProperty('transition');
            indicator.style.transform = 'none';
        } else {
            placeIndicator(box);
            if (reducedMotion.matches || !wasVisible) {
                indicator.style.transform = 'none';
            }
        }

        currentTarget = target;
        indicator.classList.add('is-visible');
    }

    function trackLayout() {
        layoutFrame = 0;
        updateIndicator();
        if (gapIsMoving && !reducedMotion.matches) {
            layoutFrame = requestAnimationFrame(trackLayout);
        }
    }

    function scheduleLayout() {
        if (!layoutFrame) layoutFrame = requestAnimationFrame(trackLayout);
    }

    function resetLabel(link) {
        const label = link?.querySelector('.nav-link-label');
        label?.style.removeProperty('--nav-magnetic-x');
        label?.style.removeProperty('--nav-magnetic-y');
    }

    function resetMagnetism() {
        cancelAnimationFrame(magneticFrame);
        magneticFrame = 0;
        pointerPosition = null;
        links.forEach(resetLabel);
    }

    function moveLabel() {
        magneticFrame = 0;
        if (!hoveredLink || !pointerPosition || reducedMotion.matches) return;

        const box = hoveredLink.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (pointerPosition.x - box.left) / box.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (pointerPosition.y - box.top) / box.height * 2 - 1));
        // Bound the total displacement to 2px, including diagonal movement.
        const distance = Math.max(1, Math.hypot(x, y));
        const label = hoveredLink.querySelector('.nav-link-label');
        label.style.setProperty('--nav-magnetic-x', `${x / distance * 2}px`);
        label.style.setProperty('--nav-magnetic-y', `${y / distance * 2}px`);
    }

    links.forEach((link) => {
        link.addEventListener('pointerenter', (event) => {
            if (event.pointerType === 'touch' || !finePointer.matches) return;
            resetMagnetism();
            hoveredLink = link;
            focusedLink = null;
            updateIndicator();
        });

        link.addEventListener('pointermove', (event) => {
            if (event.pointerType === 'touch' || !finePointer.matches) return;
            const targetChanged = hoveredLink !== link || focusedLink;
            hoveredLink = link;
            focusedLink = null;
            if (targetChanged) updateIndicator();
            if (reducedMotion.matches) return;
            pointerPosition = { x: event.clientX, y: event.clientY };
            if (!magneticFrame) magneticFrame = requestAnimationFrame(moveLabel);
        });

        const leave = () => {
            resetLabel(link);
            if (hoveredLink === link) {
                hoveredLink = null;
                resetMagnetism();
                updateIndicator();
            }
        };
        link.addEventListener('pointerleave', leave);
        link.addEventListener('pointercancel', leave);
    });

    nav.addEventListener('focusin', (event) => {
        const link = event.target.closest('.nav-link');
        focusedLink = link?.matches(':focus-visible') ? link : null;
        if (focusedLink) {
            hoveredLink = null;
            resetMagnetism();
        }
        updateIndicator();
    });

    nav.addEventListener('focusout', () => {
        focusedLink = null;
        scheduleLayout();
    });

    nav.addEventListener('transitionrun', (event) => {
        if (event.target === nav && event.propertyName === 'column-gap') {
            gapIsMoving = true;
            scheduleLayout();
        }
    });

    const finishGap = (event) => {
        if (event.target === nav && event.propertyName === 'column-gap') {
            gapIsMoving = false;
            scheduleLayout();
        }
    };
    nav.addEventListener('transitionend', finishGap);
    nav.addEventListener('transitioncancel', finishGap);

    new MutationObserver((records) => {
        if (records.some((record) => links.includes(record.target))) updateIndicator();
    }).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-current'] });

    const resizeObserver = new ResizeObserver(scheduleLayout);
    resizeObserver.observe(nav);
    links.forEach((link) => {
        resizeObserver.observe(link);
        resizeObserver.observe(link.querySelector('.nav-link-label'));
    });
    window.addEventListener('resize', scheduleLayout, { passive: true });
    window.addEventListener('pageshow', scheduleLayout);
    window.addEventListener('blur', () => {
        hoveredLink = null;
        resetMagnetism();
        updateIndicator();
    });

    if (document.fonts) {
        document.fonts.ready.then(scheduleLayout);
        document.fonts.addEventListener('loadingdone', scheduleLayout);
    }

    reducedMotion.addEventListener('change', () => {
        gapIsMoving = false;
        document.body.classList.remove('nav-entering');
        resetMagnetism();
        updateIndicator();
    });
    finePointer.addEventListener('change', () => {
        hoveredLink = null;
        resetMagnetism();
        updateIndicator();
    });

    const lastLabel = links.at(-1).querySelector('.nav-link-label');
    lastLabel.addEventListener('animationend', (event) => {
        if (event.animationName === 'nav-label-reveal') {
            document.body.classList.remove('nav-entering');
        }
    });

    updateIndicator();
    if (!reducedMotion.matches) document.body.classList.add('nav-entering');
    requestAnimationFrame(() => document.body.classList.add('nav-ready'));
})();
