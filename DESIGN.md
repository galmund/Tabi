---
name: Tabi
description: A two-person Japan trip planner printed as a series of stations under a Prussian sky.
colors:
  prussian-sky: "#1d3d63"
  prussian-deep: "#12294a"
  prussian-ink: "#1f4f86"
  fog: "#eceff2"
  paper: "#ffffff"
  paper-recess: "#e2e6eb"
  paper-rule: "#c9d0d9"
  sumi: "#111d2b"
  sumi-dim: "#54606f"
  vermilion: "#c03a24"
  ochre: "#9a5f0c"
  pine: "#2a7650"
  night-ground: "#0a1626"
  night-paper: "#112035"
  night-paper-raised: "#1a2b43"
  night-sky: "#17385e"
  night-sky-deep: "#0f2744"
  night-prussian-ink: "#8db8ea"
  night-ink: "#e9eef5"
  night-vermilion: "#ff6a52"
  night-ochre: "#e9ac45"
  night-pine: "#5ec28c"
  city-teal: "#2a93a6"
  city-plum: "#8e3b8f"
  city-moss: "#3c8d6e"
  city-persimmon: "#d9822b"
  city-wisteria: "#6a5fb0"
  city-azalea: "#c4476a"
  city-indigo: "#2f6db5"
  city-chestnut: "#8c6239"
  city-mustard: "#c99a1a"
  city-celadon: "#4f9f8f"
typography:
  countdown:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 0.82
    letterSpacing: "-0.05em"
    fontFeature: "tnum"
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: "24px"
    letterSpacing: "-0.022em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-0.011em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "-0.011em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  station-number:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  japanese:
    fontFamily: "Hiragino Mincho ProN, Hiragino Mincho Pro, Yu Mincho, YuMincho, Noto Serif JP, serif"
    letterSpacing: "0.02em"
rounded:
  cartouche: "2px"
  tile: "3px"
  chip-sm: "8px"
  control: "11px"
  field-group: "12px"
  card: "14px"
  sheet: "16px"
  pill: "999px"
spacing:
  hairline: "2px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  section: "32px"
  gutter-desktop: "32px"
components:
  button-primary:
    backgroundColor: "{colors.prussian-ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.field-group}"
    height: "48px"
  button-tinted:
    textColor: "{colors.prussian-ink}"
    rounded: "{rounded.control}"
    height: "44px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "16px"
  station-cartouche:
    textColor: "{colors.sumi}"
    rounded: "{rounded.cartouche}"
    width: "38px"
    height: "44px"
  station-cartouche-unprinted:
    textColor: "{colors.vermilion}"
    rounded: "{rounded.cartouche}"
    width: "38px"
    height: "44px"
  tag:
    rounded: "{rounded.pill}"
    padding: "2px 8px"
    typography: "{typography.label}"
  day-tile:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.sumi}"
    rounded: "{rounded.chip-sm}"
    width: "44px"
    height: "48px"
  day-tile-active:
    backgroundColor: "{colors.prussian-ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.chip-sm}"
  segmented-thumb:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.sumi}"
    rounded: "{rounded.chip-sm}"
    height: "32px"
  sidebar-rail:
    backgroundColor: "{colors.prussian-deep}"
    textColor: "{colors.paper}"
    width: "240px"
---

# Design System: Tabi

## Overview

**Creative North Star: "Tōkaidō Stations"**

The trip is a print series. Each day is a numbered station, each night takes the colour of the city it is slept in, and a night with no bed is left unprinted: hatched in vermilion so it reads as an alarm, not as empty space. Prussian blue (bero-ai) owns the shell. A solid sky band sits behind every page title and fades, by bokashi, into a cool fog ground; on desktop the same Prussian runs down a left rail. Work happens on white sheets with hairline edges laid on the fog.

The system is dense and practical, in the register of a well-made phone utility. Latin text is set in the platform's own sans with tabular numerals wherever a count, date or price appears; Japanese place names switch to a mincho serif. Colour does two jobs only: city identity (flat pigment fields) and status (vermilion, ochre, pine). Everything else is Prussian, fog, paper and sumi ink.

Dark mode is the same print at night: the ground becomes night Prussian, sheets become raised Prussian panes, and the status pigments brighten so they keep their contrast.

**Key Characteristics:**
- Solid Prussian sky header with a bokashi fade into the fog ground; collapses to a flat Prussian bar on scroll.
- Station cartouche (double-ruled rectangle holding a day number) as the identity mark for a day.
- Per-night route strip of city-tinted tiles, with hatched vermilion for unprinted nights.
- White hairline-edged sheets on fog; flat at rest, lifted only for modals.
- Tabular numerals everywhere numbers appear; mincho only for Japanese.

## Colors

A Prussian shell on cool fog, with a ten-pigment city palette and three status pigments held in reserve.

### Primary
- **Prussian Sky** (prussian-sky): the sky band behind page titles, from the bar down to the bokashi fade.
- **Prussian Deep** (prussian-deep): the top of the sky gradient, the collapsed header bar, the desktop rail and the browser theme colour. The app icon is the exception: a bold vermilion torii on a fog field, so it reads at home-screen size.
- **Prussian Ink** (prussian-ink): the interactive accent on fog and paper: primary buttons, active tab, active day tile, checked checkboxes, date and amount values in forms, focus rings, caret. In night mode it becomes the pale **Night Prussian Ink** so it reads on dark panes.

### Secondary
- **City pigments** (city-teal through city-celadon): ten flat, slightly muted pigments, assigned one per city in order. They fill route tiles, city dots, legend swatches, the top band of day tiles and night tiles, and tint city tags at about 14% opacity with the text mixed 55% toward ink. Legacy saturated iOS colours stored in the database are mapped onto this palette at read time, so no surface ever shows the old system colours.
- **Idea-kind pigments**: a parallel seven-colour set from the same family keyed to idea type (sight, food, shopping, onsen, experience, nightlife, walk), used for icon tiles at about 12% fill with the glyph mixed 70% toward ink.

### Tertiary (status)
- **Vermilion** (vermilion): unprinted nights (hatched), overdue items, destructive actions and form errors. Nothing else.
- **Ochre** (ochre): due-soon.
- **Pine** (pine): done, confirmed, and switch-on states.

### Neutral
- **Fog** (fog): the page ground in day mode, and the sheet ground.
- **Paper** (paper): cards, grouped lists, segmented thumbs.
- **Paper Recess** (paper-recess) and **Paper Rule** (paper-rule): secondary raised fills and the in-transit route tile.
- **Rental cars** use the Prussian accent: solid for booked, a dashed accent outline (chips, badges) or dimmed mark (route, day strip) for an option that is only planned.
- **Sumi** (sumi): primary text. **Sumi Dim** (sumi-dim): secondary text, subtitles, trailing counts.
- **Hairline**: line colour is sumi at 12% (day) or pale Prussian at 16% (night), always drawn at 0.5px.
- **Fill**: pressed and tinted-button backgrounds use Prussian at 7.5% (day) or 13% (night).

### Named Rules
**The Unprinted Night Rule.** Vermilion is the colour of a missing bed. It appears as diagonal hatching on route tiles, as the tone of the cartouche leading a "no hotel" row, and on overdue or destructive states. It is never decoration and never a brand accent.

**The Pigment Field Rule.** City colours are identity, not mood. One pigment per city, applied as a flat field, a dot, a 3px top band or a light tint; never as text colour at full strength and never on chrome.

**The Shell Is Prussian Rule.** Header sky, collapsed bar, desktop rail and theme colour are all Prussian (the app icon is fog with a vermilion torii). Content surfaces never take the sky colour.

## Typography

**Display Font:** the platform sans (-apple-system / SF Pro, with Segoe UI, Roboto, Helvetica fallbacks)
**Body Font:** the same
**Japanese Font:** Hiragino Mincho ProN (with Yu Mincho, Noto Serif JP fallbacks)

**Character:** one native sans for every Latin role, tightened slightly (-0.011em body tracking, down to -0.05em on the countdown), with mincho reserved for Japanese names so they read as printed captions rather than UI.

### Hierarchy
- **Countdown** (700, 64px, 76px on desktop, 0.82 line-height, tabular): the days-to-go figure in the Home sky. One per screen.
- **Display** (700, 34px/40px, 40px/46px on desktop, -0.03em): page titles inside the sky band. A medium-weight 15px dim subtitle sits directly beneath the title, never above it.
- **Headline** (700, 20px/24px, -0.022em): section headers on the fog, with an optional tabular trailing count in 14px dim.
- **Title** (600, 17px): row titles, sheet titles, collapsed bar title, primary button labels.
- **Body** (400, 15px, about 1.375 line-height): secondary row text, hints (capped near 34ch in empty states), notes. Form rows use 17px.
- **Label** (600, 12px): tags, city tags, route dates.
- **Station Number** (700, 17px, tabular, -0.03em): numbers inside cartouches and day tiles, with a 9-10px uppercase unit label ("day", "night", "D3") tucked under the number inside the tile.

### Named Rules
**The Tabular Rule.** Every count, date, night total, price and countdown uses tabular numerals. Columns of numbers never jitter.

**The Mincho Caption Rule.** Japanese text (city names, the 旅 mark) is set in mincho with 0.02em tracking, at a lighter weight and lower emphasis than the Latin it accompanies. Latin is never set in mincho.

## Layout

A single phone column (max 32rem, 16px gutters) that becomes a two-column work area on desktop (max 64rem, 32px gutters) beside a fixed 240px Prussian rail. Below 1024px a translucent bottom tab bar (56px plus safe area) carries navigation; from 1024px the rail replaces it and the header bar grows from 44px to 52px.

Every top-level page opens with the sky band: header bar, large title, subtitle and page-specific content (countdown, day strip) on Prussian, then a 46px bokashi fade into the fog. The sky spans the full viewport width (minus the rail on desktop) even though the content column is narrower. Content starts on the fog below the fade.

Sections stack at 32px on phone; on desktop they flow into two columns with 24px column gaps and about 36px row gaps. Section header to content is 12px. Cards pad 16px; list rows inset their hairline separators 16px from the leading edge (or past a leading cartouche or icon).

**The Sky Then Fog Rule.** The page title always sits on the Prussian sky; working content always sits on the fog. Nothing interactive straddles the bokashi fade.

## Elevation & Depth

Depth is tonal and hairline, not shadowed. Cards sit on the fog with a 0.5px outline and a very soft ambient drop (day) or a 0.5px Prussian outline and a faint top highlight (night). Real lift appears only on modal sheets on desktop and the photo lightbox. Translucency is reserved for the bottom tab bar (blurred, 84-86% opaque) and the sheet backdrop.

### Shadow Vocabulary
- **Card edge** (`--shadow-card`): hairline outline plus ambient drop. Every card, grouped list and resting day tile.
- **Thumb** (`--shadow-thumb`): a small 2px/6px drop for the segmented-control thumb and the active day tile, which read as pieces laid on top of a track.
- **Lift** (`--shadow-lift`): a deep 28px/64px drop for the desktop modal sheet only.

### Named Rules
**The Flat Sheet Rule.** Surfaces are flat at rest. Lift is a property of modality (desktop sheet, lightbox), not of importance.

## Shapes

Two shape families meet. The print family is nearly square: cartouches at 2px with a second rule offset 2px outside, route tiles at 3px with 2px gaps, city dots and legend swatches at 2-3px. The tool family is softly rounded: day tiles and segmented thumbs at 8px, tinted buttons at 11px, primary buttons and field groups at 12px, cards at 14px, the mobile sheet's top corners at 16px. Tags, checkboxes, switches and the sheet grabber are full pills or circles. Icon tiles round at 30% of their size.

**The Square Print Rule.** The printed marks (cartouche, route tile, city dot and legend swatch) keep a near-square corner of 3px or less. Day tiles and night tiles are tappable or badge-like, so they belong to the tool family (6-8px); cards and controls round further.

## Components

### Buttons
Quiet, native and tactile.
- **Shape:** gently rounded (12px primary, 11px tinted), 44-48px tall.
- **Primary:** Prussian Ink fill, paper text, 17px semibold, full width in sheets.
- **Tinted:** fill-tinted background with Prussian Ink text and a leading 16px icon (map buttons, "Add stay"; status-toned variants use the status pigment at 15%).
- **Press:** every pressable scales to 0.97 over 160ms on the ease-out curve; bar buttons and back links fade to 50% opacity instantly and recover over 200ms.
- **Focus:** a 2px Prussian Ink outline offset 2px.

### Chips / Tags
- **Style:** pill, 12px semibold, status or neutral tone at 15% fill with the full-strength tone as text.
- **City tag:** city pigment at about 14% fill, text mixed 55% toward ink, with the Japanese name in mincho at 80% opacity.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** paper (day) or night paper.
- **Shadow Strategy:** card edge (see Elevation).
- **Internal Padding:** 16px.
- **Grouped list:** a card holding rows divided by 0.5px hairlines inset 16px; rows highlight with the fill colour instantly on press and fade it out over 220ms on release.

### Inputs / Fields
- **Style:** iOS-style grouped rows on a 12px paper group: 48px rows, 17px label left, value right-aligned. Date and amount values take Prussian Ink. Text areas sit in their own 12px group. Inputs never go below 16px to prevent zoom.
- **Switch:** 51x31 pill, pine when on, with a knob that stretches while pressed.
- **Error:** a vermilion-at-15% rounded block with vermilion text, rising in.

### Navigation
- **Header:** transparent over the sky at rest; once the large title scrolls under it, a solid Prussian Deep bar fades in (200ms) and the title appears centred at 17px semibold.
- **Tab bar (phone):** translucent bar with a top hairline; 25px line icons with 10px labels; active is Prussian Ink with a heavier stroke; icons scale to 0.9 on press.
- **Rail (desktop):** Prussian Deep, 240px, app icon and "Tabi 旅" wordmark at top, 36px items with 18px icons; active item is a white-14% pane, hover white-7%; Settings pinned at the bottom.
- **Segmented control:** fill track with 2px inset, paper thumb with thumb shadow, 32px segments.

### Station Cartouche (signature)
A 38x44 rectangle with a 1px rule and a second 1px rule offset 2px outside it, in the current text colour, holding a tabular day number over a tiny uppercase unit. Ink tone for ordinary days, Prussian Ink for today, vermilion for a night with no bed. Used only to identify a day: Days list rows and the "No hotel yet" rows on Home.

### Route Strip (signature)
One tile per night in a 32px-tall row with 2px gaps and 3px corners. A stay tile is its city pigment at the top, fading by bokashi to a light tint at the bottom; an in-transit night is a neutral raised tile; an unprinted night is hatched vermilion at 80% opacity. On desktop (md and up) the strip is one tile per night; with a mouse, hovering a night shows a popover (date, day number, cities, where you sleep, car, plans, note), and clicking one night then another selects a range offering Add stay and Plan car; on touch, each run opens its booking or Add stay. A row of car marks sits under the tiles when any night has a rental: accent for booked, dimmed dim-ink for an option. Below md the strip becomes a Monday-first calendar: 48px day cells tinted about 20% with the night's city pigment over a 6px pigment band (hatched vermilion for no bed, neutral for transit, a flag on the last day), the car mark in the lower right, and a tapped day opening an inline panel with the same day details and actions. Tonight carries an ink outline. Below a hairline the stops read in order, joined by chevrons, and rental cars follow as chips (dashed outline for an option).

### Day Strip and Night Tiles
- **Day tile:** 44x48, 8px corners, a 3px top band of the day's city pigments, a tiny "D#" label over the date number, a vermilion dot when that night has no bed. Active tile fills with Prussian Ink; today gets a 2px Prussian Ink ring.
- **Night tile (bookings):** 40x44, 6px corners, city pigment at 13% with a 3px pigment top band and the night count.

### Sheets
- **Phone:** bottom sheet on the sheet ground, 16px top corners, grabber, 56px title bar with leading/trailing text actions; opens in 420ms on the drawer curve, closes in 260ms, backdrop dims and blurs 6px, both tracking drag.
- **Desktop:** centred 34rem modal, 14px corners, hairline border and lift shadow; scales in from 0.96 over 240ms ease-out and out over 160ms.

## Do's and Don'ts

### Do:
- **Do** put every page title on the Prussian sky with its subtitle directly underneath, and start working content on the fog below the bokashi fade.
- **Do** mark a night with no bed in vermilion hatching on the route strip and a vermilion cartouche in lists; keep vermilion for that, overdue and destructive states.
- **Do** colour cities only from the ten pigments, as flat fields, dots, 3px bands or light tints.
- **Do** use tabular numerals for every count, date, price and countdown.
- **Do** set Japanese names in mincho and Latin in the platform sans.
- **Do** keep press feedback consistent: scale 0.97 on the ease-out curve for controls, instant highlight with a 220ms fade for list rows, opacity fade for bar text buttons.
- **Do** honour reduced motion (fades replace movement), reduced transparency (solid bars) and increased contrast (stronger hairlines).

### Don't:
- **Don't** reintroduce the old iOS grouped-list skin with saturated system colours or a vermilion glow; legacy colours are remapped for a reason.
- **Don't** use the cartouche or the bokashi band outside day identity, the header sky and the route strip.
- **Don't** put a small uppercase kicker or eyebrow above a title; subtitles go beneath.
- **Don't** add shadows to show importance; lift is for modal surfaces only.
- **Don't** round the printed marks (cartouche, route tile, city dot) beyond 3px.
- **Don't** add a second accent; Prussian Ink is the only interactive colour.
