---
name: Warehouse Logistics
colors:
  surface: '#f8f9ff'
  surface-dim: '#d4dae7'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e7eefb'
  surface-container-high: '#e2e8f5'
  surface-container-highest: '#dce3f0'
  on-surface: '#151c25'
  on-surface-variant: '#45474c'
  inverse-surface: '#2a313b'
  inverse-on-surface: '#eaf1fe'
  outline: '#75777c'
  outline-variant: '#c5c6cc'
  surface-tint: '#575f6d'
  primary: '#060e1a'
  on-primary: '#ffffff'
  primary-container: '#1c2430'
  on-primary-container: '#838b9a'
  inverse-primary: '#bfc7d7'
  secondary: '#8c4f00'
  on-secondary: '#ffffff'
  secondary-container: '#fca956'
  on-secondary-container: '#713f00'
  tertiary: '#001105'
  on-tertiary: '#ffffff'
  tertiary-container: '#082915'
  on-tertiary-container: '#709377'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe3f3'
  primary-fixed-dim: '#bfc7d7'
  on-primary-fixed: '#141c28'
  on-primary-fixed-variant: '#3f4754'
  secondary-fixed: '#ffdcbf'
  secondary-fixed-dim: '#ffb874'
  on-secondary-fixed: '#2d1600'
  on-secondary-fixed-variant: '#6b3b00'
  tertiary-fixed: '#c7eccc'
  tertiary-fixed-dim: '#abcfb1'
  on-tertiary-fixed: '#01210e'
  on-tertiary-fixed-variant: '#2e4e37'
  background: '#f8f9ff'
  on-background: '#151c25'
  surface-variant: '#dce3f0'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is built for the high-intensity environment of logistics and inventory management. The brand personality is **utilitarian, industrial, and high-precision**. It prioritizes rapid information scanning over aesthetic fluff, drawing inspiration from **Modern Industrialism** and **Functional Brutalism**.

The aesthetic avoids all "softness"—no blurs, no gradients, and no organic curves. Instead, it utilizes sharp geometry, rigid structural lines, and a high-contrast color palette to ensure legibility in various lighting conditions, such as warehouse floors or loading docks. The emotional response is one of reliability and "tool-like" efficiency.

## Colors
The palette is inspired by raw industrial materials: steel, cardboard, and safety markings.

- **Ink Navy (#1C2430):** Used for all primary text, headers, and structural borders. It provides a heavy visual anchor.
- **Paper (#F6F4EF):** The primary background color. It reduces eye strain compared to pure white while maintaining a "physical form" feel.
- **Warehouse Amber (#C77D2E):** The primary action color. Used for buttons and key interactive states to mimic safety hazard tape and high-visibility equipment.
- **Functional Accents:** Sage (#6E9075) indicates healthy stock or successful syncs, while Rust Red (#B5482F) is reserved strictly for critical errors or depleted inventory. Slate Gray (#9CA3AF) is used for secondary metadata and inactive states.

## Typography
The typography system uses a tri-font approach to categorize information types:

1.  **Space Grotesk (Headers):** Used for titles and section headers. Its mechanical terminals and geometric construction reinforce the industrial theme.
2.  **Inter (Body):** Used for all descriptive text and general UI labels to ensure maximum readability and a humanist touch for long-form data.
3.  **JetBrains Mono (Data):** Used for SKUs, quantities, coordinates, and timestamps. The monospaced nature ensures that columns of numbers align perfectly for quick comparison.

All headers should utilize tighter letter-spacing, while labels should be slightly tracked out for clarity.

## Layout & Spacing
The layout follows a **Rigid Grid** philosophy. All spacing is derived from a 4px base unit, ensuring that elements feel mathematically aligned.

- **Grid:** Use a 12-column grid for desktop and a 4-column grid for mobile. Gutters are fixed at 16px to maintain a dense, information-rich environment.
- **Density:** This design system favors high density. Use `stack-sm` (8px) for related items within a card and `stack-md` (16px) for spacing between major UI components.
- **Hard Edges:** Content should be contained within defined borders rather than floating in negative space.

## Elevation & Depth
This design system rejects shadows. Depth is communicated through **Solid Outlines** and **Tonal Layering**:

- **Borders:** All interactive or contained elements must have a solid 2px border in Ink Navy.
- **Active State:** To show "elevation" or focus, use a 4px offset solid shadow (hard-edged) in Ink Navy, mimicking a physical stamp or raised plate.
- **Layering:** Use the Paper background for the base, and white (#FFFFFF) for interior card surfaces to create a subtle "layered sheet" effect without using blurs.

## Shapes
The shape language is strictly **Sharp (0px)**. 

Every element—buttons, cards, input fields, and badges—must have 90-degree corners. This reinforces the architectural and mechanical nature of the warehouse environment. Avoid any property that introduces a radius.

## Components
- **Buttons:** Primary buttons use a Warehouse Amber fill with an Ink Navy 2px border and Ink Navy bold Space Grotesk text. On hover, the button should shift 2px down and right to simulate a physical press.
- **Cards:** Use a white background with a 2px solid Ink Navy border. Headers within cards should have a bottom border of 1px to separate metadata from content.
- **Inputs:** Numeric inputs must use JetBrains Mono. Input fields use a 2px solid border that thickens to 3px on focus. Background remains Paper or White.
- **Badges/Tags:** Styled as shipping labels. They feature a 1px border, "notched" corners (clipped via CSS path if possible), and use `label-caps` typography. 
- **Status Indicators:** Represented by solid squares or "LED" style rectangles. No glows.
- **Data Tables:** Use heavy horizontal rules (2px) for headers and thin rules (1px) for rows. Alternate row striping is permitted using a subtle 5% tint of Ink Navy.