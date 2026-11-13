# Visual direction

User-provided planet explorer reference: large celestial body, black canvas, oversized white type, sparse navigation, restrained accent. Pinterest short link was inaccessible; the attached reference image guided the layout.

LunarSight applies this to a usable location explorer with sourced lunar texture, a compact selected-point panel and accessible mission controls. Navy/white, NASA-inspired blue actions and small red accents. System typography, no remote fonts, ornamental orbit rings, glass panels or promotional filler. Warm chart colour denotes Sun and blue denotes Earth; comparison identifies scenario curves explicitly.

No NASA logo or implied agency endorsement. Mobile stacks location and comparison panels. Keyboard-accessible manual controls are the alternative to pointer-based 3D selection.

## Celestial model update

Earth and Sun are now procedural Three.js spheres instead of flat SVG/CSS discs. Earth uses generated continent/ocean patterns, clouds, ice, specular water and an atmospheric rim; these are illustrative patterns, not a geographic dataset. The Sun uses animated surface noise and limb darkening with a restrained corona. Reduced-motion preference freezes animation. Both remain decorative and are excluded from scientific outputs. Moon retains the sourced LROC texture, with view-relative studio lighting, tone mapping and smaller markers to improve relief legibility. Sizes and positions are compositional.

Production build and three targeted desktop/mobile/WebGL-fallback browser checks passed after this update.

## Interface refinement

Refined the full-width explorer with a clearer primary action, live coordinate/time readout and view-offset composition that gives the Moon and text their own space. The mission planner remains below the scene, with a section heading, larger date/coordinate controls and selectable reference cards. Shared navigation, panel, form and typography styling now carries through Analyze, Compare and Sources. Mobile projection fits the lunar disc within the viewport below the heading and actions. Nine browser journeys passed during refinement; mobile layout and raycast/focus were rechecked after the final camera adjustment.

## Grey / white theme

Changed the interface to a neutral grey/white palette with soft charcoal panel fades and white-to-silver primary actions. Navigation, location markers, form focus, scrollbar and selection states use monochrome contrast. Charts distinguish scenarios by brightness and Sun/Earth by solid/dashed lines. The decorative Earth and Sun keep their natural illustrative colours; these are separate from the interface palette.

## Current requested palette

Applied #021024 (deep background), #052659 (navy surfaces), #5483B3 (steel-blue accents), #7DA0CA (secondary text), and #C1E8FF (primary text/highlights). Surfaces and actions use soft fades within that palette. Site-wide condensed display typography follows the user's SPACE lettering reference. Chart brightness and line patterns preserve distinctions. Earth/Sun artwork retains illustrative natural colours.
