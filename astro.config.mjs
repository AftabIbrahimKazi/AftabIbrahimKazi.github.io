// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import strataCSS from 'strata-css';

// https://astro.build/config
export default defineConfig({
    integrations: [icon()],
    devToolbar: { enabled: false },
    vite: {
        css: {
            postcss: {
                plugins: [strataCSS()],
            },
        },
        resolve: {
            dedupe: ['three'],
        },
        optimizeDeps: {
            include: [
                'three',
                'three/addons/controls/OrbitControls.js',
                'gsap',
                '@triforge/keyframe',
                '@triforge/geometry-nodes',
                '@triforge/radius-parametric-geometry',
                '@triforge/shader-core',
                '@strata-packages/offcanvas',
                '@strata-packages/modal',
                'swiper',
            ],
        },
    },
});
