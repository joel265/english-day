---
name: Tactile Gamified Arcade
colors:
  surface: '#f3faff'
  surface-dim: '#cfdce3'
  surface-bright: '#f3faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e9f6fd'
  surface-container: '#e3f0f7'
  surface-container-high: '#ddeaf1'
  surface-container-highest: '#d7e5eb'
  on-surface: '#111d22'
  on-surface-variant: '#3f4a36'
  inverse-surface: '#263237'
  inverse-on-surface: '#e6f3fa'
  outline: '#6f7b64'
  outline-variant: '#becbb1'
  surface-tint: '#2b6c00'
  primary: '#2b6c00'
  on-primary: '#ffffff'
  primary-container: '#58cc02'
  on-primary-container: '#1e5000'
  inverse-primary: '#6be026'
  secondary: '#006590'
  on-secondary: '#ffffff'
  secondary-container: '#2fb8ff'
  on-secondary-container: '#004666'
  tertiary: '#755b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ddad00'
  on-tertiary-container: '#574300'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#87fe45'
  primary-fixed-dim: '#6be026'
  on-primary-fixed: '#082100'
  on-primary-fixed-variant: '#1f5100'
  secondary-fixed: '#c8e6ff'
  secondary-fixed-dim: '#88ceff'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdf92'
  tertiary-fixed-dim: '#f4bf00'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#f3faff'
  on-background: '#111d22'
  surface-variant: '#d7e5eb'
typography:
  display-hero:
    fontFamily: Rubik
    fontSize: 36px
    fontWeight: '900'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Rubik
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Rubik
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Rubik
    fontSize: 20px
    fontWeight: '800'
    lineHeight: 26px
  headline-sm:
    fontFamily: Rubik
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Rubik
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Rubik
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
  body-sm:
    fontFamily: Rubik
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-lg:
    fontFamily: Rubik
    fontSize: 14px
    fontWeight: '800'
    lineHeight: 18px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Rubik
    fontSize: 12px
    fontWeight: '800'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Rubik
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system channels the energetic, tactile spirit of modern gamified learning platforms. Built for vocational students and dynamic language-learning events, it balances arcade-inspired playfulness with high-legibility educational structure.

The design movement is **Tactile Neobrutalism / Chunky Flat 3D**:
- Elements feel pressable, physical, and toy-like through solid, unblurred bottom "drop-rims" (simulated 3D bevels) rather than traditional diffused drop shadows.
- Visuals rely on bright saturated color blocking, heavy boundary strokes (2px), and generous structural curves.
- The interface creates an uplifting, frictionless loop of challenge and reward: mistakes feel gentle and actionable, while achievements trigger explosive micro-celebrations.

## Colors

The palette uses a high-energy primary gamification triad supplemented with a dedicated alert red, structural neutrals, and soft tinted highlights:

- **Primary (`#58CC02` / Bottom Rim `#46A302`)**: Progress, primary validation, success states, and standard action buttons. Paired with soft mint tint (`#DDF4C5`) for light backgrounds and container highlights.
- **Secondary (`#1CB0F6` / Bottom Rim `#1899D6`)**: Quests, knowledge tracks, active state selections, and interactive listening/audio triggers.
- **Tertiary (`#FFC800` / Bottom Rim `#E5A500`)**: XP points, star streaks, leaderboards, and celebratory badges.
- **Danger / Coral Red (`#FF4B4B` / Bottom Rim `#EA2B2B`)**: Heart depletion, error prompts, incorrect quiz answer states, and rapid timer alerts.
- **Neutral Dark (`#131F24`)**: Primary typography, heavy borders, and structural icon strokes.
- **Neutral Muted & Canvas (`#FFFFFF` Card Surface, `#F7F9FA` App Canvas, `#E5E5E5` Structural Outlines and Inactive Fill, `#77868C` Subtext)**: Keeps high-contrast readability across screen viewports.

Every primary interactive color must be paired with its exact darkened shade for bottom extrusion offsets.

## Typography

The design system uses **Rubik** across all typographic levels. Its softly rounded terminals, substantial heavy weights (800 and 900), and open counterspaces make it readable on mobile screens during fast-paced challenges.

- **Headlines & Display**: Set in extra-bold and black weights with snug tracking. All game milestone banners, level titles, and modal dialogs demand immediate scan-ability.
- **Labels & Interactive Prompts**: Set in uppercase for primary buttons and status badges to evoke arcade arcade punchiness without reducing readability.
- **Body & Prompts**: Set in medium and semi-bold weights (`500` / `600`) to guarantee contrast against white card surfaces and tinted quiz answer containers.

## Layout & Spacing

Layouts follow a fluid single-column model on mobile devices with sticky navigation anchors:
- **Mobile Grid**: 4 fluid columns with `0.75rem` (12px) gutters and `1rem` (16px) margins.
- **Tablet / Expanded Screen Grid**: Centered single-column canvas capped at `480px` max-width to preserve compact thumb-reach zones and maintain game balance.
- **HUD Zone (Top)**: Persistent 64px header pinning hearts, XP points, and streak flame counters.
- **Action Tray (Bottom)**: Persistent bottom-affixed control bar containing confirmation buttons and lesson-completion drawers.
- **Lesson Canvas**: Vertical scroll containing floating milestone nodes connected via curved SVG path ribbons.

## Elevation & Depth

This system avoids soft Gaussian blur shadows completely. Depth is represented physically through solid 3D extrusion extrusions and layered containers:

1. **Floor Level (Canvas)**: Background surface `#F7F9FA`.
2. **Layer 1 (Cards & Modules)**: Pure white background `#FFFFFF`, surrounded by a 2px solid border (`#E5E5E5`), anchored with a solid 4px bottom edge (`box-shadow: 0 4px 0 #E5E5E5`).
3. **Layer 2 (Interactive 3D Elements & Buttons)**: Elements have a matching base color with a solid 4px offset in their designated darker shade (e.g. `#58CC02` surface with `#46A302` bottom rim). When pressed (`:active`), the top surface translates down 2px to 4px (`transform: translateY(4px)`), collapsing the bottom shadow to simulate physical mechanical depression.
4. **Layer 3 (Overlays & Bottom Sheets)**: Modals and answer verification sheets slide upward over a solid `#131F24` scrim set to 40% opacity, bordered with a top 2px boundary line.

## Shapes

The shape system adopts a pill-centric, hyper-friendly geometry:
- **Buttons, Badges, and HUD Chips**: Maximum rounding (`rounded-full` / `9999px`) to create smooth, pressable pills.
- **Containers, Modals, and Challenge Cards**: Substantial corner radius of `1.5rem` to `2rem` (`rounded-3xl`), eliminating sharp edges across the mobile view.
- **Interactive Exercise Chips**: Minimum `1rem` corner rounding, maintaining consistency with lesson nodes on the learning path.

## Components

### 3D Chunky Buttons
- **Primary / Action Button**: Full-width pill, height 52px. Background `#58CC02`, text `#FFFFFF`, border-radius 9999px. Bottom extrusion: `box-shadow: 0 4px 0 #46A302`. Pressed state: `transform: translateY(4px); box-shadow: 0 0 0 #46A302;`.
- **Secondary / Utility Button**: Surface `#1CB0F6`, bottom extrusion `#1899D6`.
- **Ghost / Neutral Button**: Surface `#FFFFFF`, border `2px solid #E5E5E5`, bottom extrusion `0 4px 0 #E5E5E5`, text `#131F24`.
- **Disabled State**: Surface `#E5E5E5`, bottom extrusion `0 4px 0 #CECECE`, text `#AFAFAF`, cursor not allowed, no active transform.

### Game HUD Bar
- Pinned to the top of the viewport: Height 56px, horizontal padding `1rem`, background `#FFFFFF`, border-bottom `2px solid #E5E5E5`.
- Houses stat pills:
  - **Hearts**: Coral red icon (`#FF4B4B`), label count in bold `#131F24`.
  - **Streak**: Flame icon with tertiary yellow (`#FFC800`), tracking consecutive days.
  - **XP / Gems**: Sky blue badge (`#1CB0F6`) with crisp numeric counter.

### Quiz / Exercise Option Cards
- Layout: 2x2 grid or vertical stack.
- Inactive State: Pure white surface, 2px border `#E5E5E5`, bottom rim `0 4px 0 #E5E5E5`, padding `1rem`. Text aligned center or left with an index indicator (A, B, C, D).
- Selected State: Background `#DDF4C5`, border `2px solid #58CC02`, bottom rim `0 4px 0 #46A302`, text `#131F24`.
- Correct Validation: Background `#DDF4C5`, border `2px solid #58CC02`, bottom rim `0 4px 0 #46A302`.
- Incorrect Validation: Background `#FFDFE0`, border `2px solid #FF4B4B`, bottom rim `0 4px 0 #EA2B2B`.

### Progress Bar
- Height: 16px, background `#E5E5E5`, border-radius 9999px, inner fill `#58CC02`.
- Fill includes an inner highlight: A horizontal white translucent line (opacity 0.35, height 4px, border-radius 9999px) positioned along the top edge of the active green fill for a 3D sheen.

### Interactive Word Bank Chips
- Inline pills for sentence assembly: Height 40px, padding `0.5rem 1rem`, background `#FFFFFF`, border `2px solid #E5E5E5`, bottom rim `0 3px 0 #E5E5E5`, font weight 700.
- Used / Blank Slot State: Background `#E5E5E5`, border `2px dashed #CECECE`, no bottom rim, placeholder text hidden.

### Bottom Result Drawer (Feedback Sheet)
- Bottom-docked sheet sliding up on challenge submission:
  - **Success**: Background `#DDF4C5`, text `#46A302`, primary green button "CONTINUE".
  - **Mistake**: Background `#FFDFE0`, text `#EA2B2B`, coral red button "GOT IT".