document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const icon = themeToggle.querySelector('i');

    // Check for saved user preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
        updateIcon(savedTheme);
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });

    function updateIcon(theme) {
        if (theme === 'light') {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    // --- Mobile Navigation ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active'); // You can add CSS animation for hamburger here if desired
    });

    // Close mobile menu when a link is clicked
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // --- Scroll Animations (Intersection Observer) ---
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: "0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // --- Active Link Highlighting on Scroll ---
    const sections = document.querySelectorAll('section, header');
    const navItems = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(a => {
            a.classList.remove('active-link');
            if (a.classList.contains(current)) {
                a.classList.add('active-link');
            }
            // Simple check based on href
            if (a.getAttribute('href').includes(current)) {
                a.style.color = 'var(--accent)';
            } else {
                a.style.color = 'var(--text-secondary)';
            }
        });
    });



    // --- Image Modal Functionality ---
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("fullImage");
    const captionText = document.getElementById("caption");
    const closeBtn = document.querySelector(".close-modal");
    const openNewTabBtn = document.getElementById("openNewTab");

    // Use event delegation or select all current images
    const scrollImages = document.querySelectorAll(".scroll-item img");

    // --- Infinite Scroll with Drag Interaction ---
    const track = document.querySelector('.project-scroll-track');
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID;
    let startTime = 0;
    const speed = 0.5; // Auto-scroll speed (pixels per frame)

    // Calculate width of one set of items (5 items * length)
    // We assume 5 items. The track has 10 items (5 original + 5 duplicates).
    // Better to calculate dynamically or hardcode if we know the item width + gap.
    // Item width: 380px, Gap: 2rem (32px). 5 items.
    // Total width of one set = 5 * (380 + 32) = 2060px.
    // Wait, last gap? 
    // flex gap puts gap between items. 5 items -> 4 gaps? No, duplications might share gaps.
    // Let's compute it.

    function getHalfWidth() {
        // approximate half width based on scrollWidth of track / 2
        return track.scrollWidth / 2;
    }

    // Auto Animation Loop
    function animateScroll() {
        if (!isDragging) {
            currentTranslate -= speed;
            checkBoundary();
            setSliderPosition();
        }
        animationID = requestAnimationFrame(animateScroll);
    }

    function checkBoundary() {
        const halfWidth = getHalfWidth();
        // If we've scrolled past the first set (negative direction)
        if (Math.abs(currentTranslate) >= halfWidth) {
            currentTranslate += halfWidth; // Reset to 0 (effectively)
        }
        // If dragged to the positive side (seeing blank space on left)
        if (currentTranslate > 0) {
            currentTranslate -= halfWidth;
        }
    }

    function setSliderPosition() {
        track.style.transform = `translateX(${currentTranslate}px)`;
    }

    // Start Animation
    animateScroll();

    // Drag Events
    track.addEventListener('mousedown', startDrag);
    track.addEventListener('touchstart', startDrag);

    track.addEventListener('mouseup', endDrag);
    track.addEventListener('mouseleave', endDrag);
    track.addEventListener('touchend', endDrag);

    track.addEventListener('mousemove', moveDrag);
    track.addEventListener('touchmove', moveDrag);

    function startDrag(e) {
        isDragging = true;
        const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        startPos = pageX - currentTranslate;
        track.style.cursor = 'grabbing';
        // Prevent default only if necessary, but we want click to work for modal
        // e.preventDefault(); 
    }

    function endDrag() {
        isDragging = false;
        track.style.cursor = 'grab';
        // Snap to boundary check immediately to ensure smooth resume
        checkBoundary();
    }

    function moveDrag(e) {
        if (isDragging) {
            const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
            const currentPosition = pageX - startPos;
            currentTranslate = currentPosition;
            checkBoundary();
            setSliderPosition();
        }
    }

    // Modal Interaction (Conflict resolution with drag)
    // We need to distinguish between a drag and a click.
    let isClick = true;

    track.addEventListener('mousedown', () => isClick = true);
    track.addEventListener('mousemove', () => {
        if (isDragging) isClick = false;
    });

    // --- Zoom & Pan Functionality ---
    let isZoomed = false;

    // Reset zoom when opening
    scrollImages.forEach(img => {
        img.addEventListener('click', function (e) {
            if (!isClick) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            modal.style.display = "flex";
            modalImg.src = this.src;

            // Update Open New Tab Button href for hover visual
            if (openNewTabBtn) {
                openNewTabBtn.href = this.src;
            }

            // Reset zoom state
            isZoomed = false;
            modalImg.classList.remove('zoomed');
            modalImg.style.transform = '';

            if (captionText) {
                captionText.innerHTML = this.alt;
                captionText.style.color = "#fff";
                captionText.style.marginTop = "10px";
                captionText.style.textAlign = "center";
            }
        });
    });

    // Handle Open New Tab Click Explicitly
    if (openNewTabBtn) {
        openNewTabBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent modal close
            // Verify if href is valid or use modalImg.src
            // The href is updated on modal open, but we can also use modalImg.src to be safe
            const url = modalImg.src;
            if (url) {
                // Allow default standard link behavior if href is set, 
                // but just in case, we can ensure it works:
                // If it's javascript:void(0), we must use window.open
                if (openNewTabBtn.getAttribute('href') === 'javascript:void(0);' || !openNewTabBtn.href) {
                    e.preventDefault();
                    window.open(url, '_blank');
                }
            }
        });
    }

    // Toggle Zoom on Click
    modalImg.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent closing modal
        isZoomed = !isZoomed;

        if (isZoomed) {
            modalImg.classList.add('zoomed');
            // Initial zoom center at click position? 
            // Simplified: Just scale up. Mousemove will handle pan.
            modalImg.style.transform = "scale(2.5)";
        } else {
            modalImg.classList.remove('zoomed');
            modalImg.style.transform = "scale(1) translate(0, 0)";
        }
    });

    // Pan Image on Mouse Move
    modal.addEventListener('mousemove', (e) => {
        if (!isZoomed) return;

        // Calculate mouse position relative to window
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        // Moving mouse right (x=1) should show LEFT edge of image. 
        // Translate X: (0.5 - x) * width_range
        // Width is 2.5 * viewport. Extra width = 1.5 * viewport.
        // Range of motion is +/- 0.75 * viewport.
        // Math: translate = (0.5 - x) * (2.5 - 1) * viewportWidth
        // This keeps center at center when mouse is at center.

        const scale = 2.5;
        const moveX = (0.5 - x) * (scale - 1) * window.innerWidth;
        const moveY = (0.5 - y) * (scale - 1) * window.innerHeight;

        modalImg.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = "none";
            isZoomed = false; // Reset
            modalImg.classList.remove('zoomed');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            isZoomed = false; // Reset
            modalImg.classList.remove('zoomed');
        }
    });

});
