// public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    ctScrollToTopJs(); //scroll to top button
    ctThemeToggleJs(); //theme toggle
    ctSoundBoxJs(); //music player toggle
    ctDropDownJs(); //dropdown menu toggle






});

/**
 * Scroll to Top Component
 * Handles visibility via Intersection Observer and state switching via click.
 * Naming convention: ex-{name}-js
 */
function ctScrollToTopJs() {
    const btn = document.getElementById('ex-scroll-top-btn-js');
    const sensor = document.getElementById('ex-top-sensor-js');

    // Early exit if elements are missing
    if (!btn || !sensor) {
        console.error('Scroll To Top: Required elements not found', { btn, sensor });
        return;
    }

    // 1. Visibility Logic (Intersection Observer)
    // Watches the top sensor to toggle the visibility-state attribute
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // If sensor is intersecting, we are at the top (hide button)
            const newState = entry.isIntersecting ? 'hidden' : 'visible';
            btn.setAttribute('visibility-state', newState);
        });
    }, { threshold: 0 });

    observer.observe(sensor);

    // 2. Interaction Logic
    // Switches scroll-top-state and triggers the CSS-governed scroll
    btn.addEventListener('click', () => {
        // Switch state for CSS wave morphing/animations
        btn.setAttribute('scroll-top-state', 'yes');

        // Trigger native jump to top ID
        // CSS 'scroll-behavior: smooth' on html tag handles the physics
        window.location.hash = 'ex-top-sensor-js';

        // Reset state and clean URL after movement finishes
        setTimeout(() => {
            btn.setAttribute('scroll-top-state', 'no');

            // Native Safari/iOS friendly URL cleanup
            history.replaceState(null, null, ' ');
        }, 1000);
    });
};

function ctThemeToggleJs() {
    const themeButton = document.getElementById('ex-toggle-theme-js');
    const theme = document.getElementById('ex-html-theme-js');

    if (themeButton && theme) {
        themeButton.addEventListener('click', () => {
            const currentHtmlThemeState = theme.getAttribute('data-ex-theme');

            if (currentHtmlThemeState === 'dark') {
                // Switch to light
                theme.setAttribute('data-ex-theme', 'light');
                themeButton.setAttribute('data-ex-theme', 'light');
            } else if (currentHtmlThemeState === 'light') {
                // Switch to dark
                theme.setAttribute('data-ex-theme', 'dark');
                themeButton.setAttribute('data-ex-theme', 'dark');
            } else {
                console.error('Unexpected theme state:', currentHtmlThemeState);
            }
        });
    } else {
        console.error('Theme Toggle: Required elements not found', { themeButton, theme });
    }
};

function ctSoundBoxJs() {

    ctMusicPlayerJs(); //bgm player toggle
    ctAnchorSoundEffectJs(); //anchor tag sound effect
    ctButtonSoundEffectJs(); //button sound effect
    ctAnchorClickSoundEffectJs(); //anchor click sound effect
    ctButtonClickSoundEffectJs(); //button click sound effect

    
    function ctAnchorSoundEffectJs() {
        const hoverSound = document.getElementById('mySound');
        const links = document.querySelectorAll('a');
        const toggleBtn = document.getElementById('ex-hover-anchor-toggle-btn-js');

        if (hoverSound && links.length > 0 && toggleBtn) {

            toggleBtn.addEventListener('click', () => {
                const currentState = toggleBtn.getAttribute('data-sound-state');
                if (currentState === 'playing') {
                    toggleBtn.setAttribute('data-sound-state', 'paused');
                } else if (currentState === 'paused') {
                    toggleBtn.setAttribute('data-sound-state', 'playing');
                }
            });

            links.forEach(link => {
                link.addEventListener('mouseenter', () => {
                    const state = toggleBtn.getAttribute('data-sound-state');

                    if (state === 'playing') {
                        hoverSound.currentTime = 0;
                        hoverSound.volume = 0.5;
                        hoverSound.play().catch(() => { });
                    }
                    else if (state === 'paused') {
                        // Explicitly handle paused state - do nothing, no console log
                    }
                    else {
                        // This only triggers if the attribute is missing or misspelled
                        console.warn("Hover sound state unknown");
                    }
                });
            });
        }
    }

function ctAnchorClickSoundEffectJs() {
    const clickSound = document.getElementById('mySound');
    const links = document.querySelectorAll('a');
    const toggleBtn = document.getElementById('ex-click-anchor-toggle-btn-js');

    if (clickSound && links.length > 0 && toggleBtn) {

        toggleBtn.addEventListener('click', () => {
            const currentState = toggleBtn.getAttribute('data-sound-state');
            toggleBtn.setAttribute('data-sound-state', currentState === 'playing' ? 'paused' : 'playing');
        });

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const state = toggleBtn.getAttribute('data-sound-state');
                const destination = link.href;
                const hrefAttr = link.getAttribute('href') || "";

                if (state === 'playing') {
                    // LOGIC A: Same-page (#)
                    // We DO NOT use preventDefault here. 
                    // Sound plays, and browser scrolls to top or ID simultaneously.
                    if (hrefAttr.includes('#')) {
                        clickSound.currentTime = 0;
                        clickSound.volume = 0.4;
                        clickSound.play().catch(() => {});
                    }
                    // LOGIC B: Redirect (/)
                    // We MUST use preventDefault here, otherwise the page changes 
                    // so fast the sound never plays.
                    else if (hrefAttr.includes('/') && destination && !link.target && !e.metaKey && !e.ctrlKey) {
                        e.preventDefault(); 
                        clickSound.currentTime = 0;
                        clickSound.volume = 0.4;

                        const handleRedirect = () => {
                            window.location.href = destination;
                            clickSound.removeEventListener('ended', handleRedirect);
                        };

                        clickSound.addEventListener('ended', handleRedirect);
                        clickSound.play().catch(() => {
                            window.location.href = destination; 
                        });
                    }
                } 
                else if (state !== 'paused') {
                    console.error('Unexpected anchor click sound state:', state);
                }
            });
        });
    }
}
    function ctButtonSoundEffectJs() {
        const hoverSound = document.getElementById('mySound');
        const buttons = document.querySelectorAll('button');
        const toggleBtn = document.getElementById('ex-hover-btn-toggle-js');

        if (hoverSound && buttons.length > 0 && toggleBtn) {

            // Master Toggle Logic
            toggleBtn.addEventListener('click', () => {
                const currentState = toggleBtn.getAttribute('data-sound-state');
                if (currentState === 'playing') {
                    toggleBtn.setAttribute('data-sound-state', 'paused');
                } else if (currentState === 'paused') {
                    toggleBtn.setAttribute('data-sound-state', 'playing');
                } else {
                    console.error('State Error', currentState);
                }
            });

            // Sound Trigger Logic
            buttons.forEach(btn => {
                if (btn.id !== 'ex-hover-btn-toggle-js' && btn.id !== 'ex-hover-anchor-toggle-btn-js') {

                    btn.addEventListener('mouseenter', () => {
                        const isEnabled = toggleBtn.getAttribute('data-sound-state');

                        if (isEnabled === 'playing') {
                            hoverSound.currentTime = 0;
                            hoverSound.volume = 0.5;

                            const playPromise = hoverSound.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(error => {
                                    console.warn("Browser blocked audio playback:", error);
                                });
                            }
                        }
                        else if (isEnabled === 'paused') {
                            // Do nothing - muted 
                        }
                        else {
                            console.log("Hover state check bypassed");
                        }
                    });
                }
            });
        } else {
            console.error('Missing elements for button hover sound');
        }
    }

    function ctButtonClickSoundEffectJs() {
        const clickSound = document.getElementById('mySound');
        const buttons = document.querySelectorAll('button');
        const toggleBtn = document.getElementById('ex-click-btn-toggle-btn-js');

        if (clickSound && buttons.length > 0 && toggleBtn) {

            toggleBtn.addEventListener('click', () => {
                const currentState = toggleBtn.getAttribute('data-sound-state');
                if (currentState === 'playing') {
                    toggleBtn.setAttribute('data-sound-state', 'paused');
                } else if (currentState === 'paused') {
                    toggleBtn.setAttribute('data-sound-state', 'playing');
                }
            });

            buttons.forEach(btn => {
                const isNotToggle = btn.id !== 'ex-btn-click-toggle-js' && btn.id !== 'ex-click-anchor-toggle-btn-js';

                if (isNotToggle) {
                    btn.addEventListener('click', () => {
                        const isEnabled = toggleBtn.getAttribute('data-sound-state');

                        if (isEnabled === 'playing') {
                            clickSound.currentTime = 0;
                            clickSound.volume = 0.4;
                            clickSound.play().catch(() => { });
                        }
                        else if (isEnabled === 'paused') {
                            // Muted
                        }
                    });
                }
            });
        }
    }

    function ctMusicPlayerJs() {
        const toggleBtn = document.getElementById('ex-toggle-music-btn-js');
        const music = document.getElementById('ex-bgm-link-js');

        if (toggleBtn && music) {
            toggleBtn.addEventListener('click', () => {
                const currentState = toggleBtn.getAttribute('data-sound-state');
                music.volume = 0.15;

                if (currentState === 'playing') {
                    toggleBtn.setAttribute('data-sound-state', 'paused');
                    music.pause();
                } else if (currentState === 'paused') {
                    toggleBtn.setAttribute('data-sound-state', 'playing');
                    music.play();
                } else {
                    console.error('Unexpected error', currentState);
                }
            });
        } else {
            console.error('Button or music element not found', { toggleBtn, music });
        }
    }

}

function ctDropDownJs() {

    const userProfile = document.getElementById('ex-user-profile-dropdown-menu-js');

    if (userProfile) {
        const dropDownBtn = userProfile.querySelector('.ex-user-profile-btn-js');
        const dropDownMenu = userProfile.querySelector('.ex-dropdown-menu-js');

        if (dropDownBtn && dropDownMenu) {
            dropDownBtn.addEventListener('click', () => {
                const currentMenuState = dropDownMenu.getAttribute('menu-state');
                if (currentMenuState === 'closed') {
                    dropDownBtn.setAttribute('menu-btn', 'on');
                    dropDownMenu.setAttribute('menu-state', 'open');
                } else if (currentMenuState === 'open') {
                    dropDownBtn.setAttribute('menu-btn', 'off');
                    dropDownMenu.setAttribute('menu-state', 'closed');
                } else {
                    console.error('Unexpected menu state', currentMenuState);
                }
            });
        } else {
            console.error('Dropdown button or menu element not found', { dropDownBtn, dropDownMenu });
        }
    } else {
        console.error('User profile dropdown container not found', { userProfile });
    }
}
