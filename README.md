# TimeLineSlider

A lightweight, customizable timeline slider for web apps. Define a year range, customize step intervals, and highlight milestone years while keeping the timeline implementation independent from external slider libraries.

---

## Features 🌟
- Custom year range: `startYear` and `endYear` define the timeline span.
- Flexible granularity: `step` controls the interval between markers.
- Milestone styling: `specialStep` highlights selected years.
- Draggable pointer: snap to closest allowed year on release.
- External slider sync: no dependency on any slider library.
- Optional labels: show year labels for special markers with `showLabels`.
- Works via npm (ESM/CJS) or directly via CDN (`<script>` tag, no build step).
- Ships with TypeScript-friendly type declarations (`.d.ts`).

---

## Installation 🛠️

Install from npm:

```bash
npm install timeline-slider
```

## Usage 📖

Import the component and CSS, then create a new `TimeLineSlider` instance.

### Basic HTML example

```html
<div id="time-line"></div>
<script type="module">
  import TimeLineSlider from 'timeline-slider';
  import 'timeline-slider/css';

  const timeLineSlider = new TimeLineSlider({
    container: '#time-line',
    startYear: 1950,
    endYear: 2020,
    step: 1,
    specialStep: 10,
    showLabels: true,
    sliderValues: [1950, 1960, 1975, 1990, 2000, 2015],
    initialValue: 1960,
    onChange: (value) => {
      console.log('active year:', value);
    },
  });
</script>
```

### CDN example (no npm/build step) 🌐

Use the prebuilt global bundle directly via unpkg or jsDelivr:

```html
<link rel="stylesheet" href="https://unpkg.com/timeline-slider/css/main.css">
<div id="time-line"></div>

<script src="https://unpkg.com/timeline-slider"></script>
<script>
  const timeLineSlider = new TimeLineSlider({
    container: '#time-line',
    startYear: 1990,
    endYear: 2030,
    step: 5,
    specialStep: 10,
    sliderValues: [2000, 2015, 2020],
    initialValue: 2000,
    onChange: (value) => console.log('active year:', value),
  });
</script>
```

This exposes a global `TimeLineSlider` class — no module loader or bundler required. You can pin a specific version with `https://unpkg.com/timeline-slider@2.1.1`.

### React example

```jsx
import { useEffect, useRef } from 'react';
import TimeLineSlider from 'timeline-slider';
import 'timeline-slider/css';

function App() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const slider = new TimeLineSlider({
      container: containerRef.current,
      startYear: 1900,
      endYear: 2023,
      step: 5,
      specialStep: 10,
      showLabels: true,
      sliderValues: [1900, 1920, 1950, 2000, 2020],
      initialValue: 1950,
      onChange: (value) => console.log('year changed', value),
    });

    return () => slider.destroy();
  }, []);

  return <div ref={containerRef} />;
}
```

### Vue example

```vue
<template>
  <div ref="timeLineContainer"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import TimeLineSlider from 'timeline-slider';
import 'timeline-slider/css';

const timeLineContainer = ref(null);
let slider;

onMounted(() => {
  slider = new TimeLineSlider({
    container: timeLineContainer.value,
    startYear: 1920,
    endYear: 2024,
    step: 2,
    specialStep: 10,
    showLabels: true,
    sliderValues: [1920, 1940, 1960, 1980, 2000, 2024],
    initialValue: 1960,
  });
});

onBeforeUnmount(() => {
  slider?.destroy();
});
</script>
```

## External slider synchronization

The package is intentionally slider-agnostic. Use the timeline API and DOM events to keep any external slider in sync.

### Recommended approach

- Call `timeLineSlider.syncToYear(year)` from the external slider when its active slide changes.
- Listen for timeline changes with `timeLineSlider.on('change', callback)` or the container DOM event `timeline-change`.
- Keep the actual slider implementation outside this package.

### Example event bridge

```js
const container = document.querySelector('#time-line');

externalSlider.on('slideChange', ({ year }) => {
  timeLineSlider.syncToYear(year);
});

container.addEventListener('timeline-change', (event) => {
  const year = event.detail.value;
  externalSlider.setActiveByYear?.(year);
});
```

### Important notes

- The timeline emits `timeline-change` on the container element.
- The internal callback passed via `onChange` is also invoked when the active year changes.
- `sliderValues` defaults to the full generated year range when omitted.
- `setValue(year)` and `syncToYear(year)` snap to the nearest allowed year.

## API Reference 🚀

### Constructor options

| Option | Type | Default | Description |
|---|---|---|---|
| `container` | `string \| HTMLElement` | `'#time-line'` | Selector or DOM element where the timeline renders. |
| `startYear` | `number` | `1010` | First year in the timeline range. |
| `endYear` | `number` | `2100` | Last year in the timeline range. |
| `step` | `number` | `10` | Interval between generated timeline markers. |
| `specialStep` | `number` | `100` | Interval used to mark milestone years. |
| `showLabels` | `boolean` | `true` | Render year labels under special markers. |
| `activeSlideClass` | `string` | `'active'` | Class name applied to the active timeline marker. |
| `sliderValues` | `number[]` | full range | Allowed snap points for the timeline pointer. |
| `initialValue` | `number` | first value | Starting selected year. |
| `onChange` | `(value: number) => void` | `null` | Callback invoked whenever the active year changes. |

### Instance methods

| Method | Description |
|---|---|
| `getValue()` | Returns the currently active year. |
| `setValue(year, options?)` | Programmatically move the pointer to the nearest allowed year. |
| `syncToYear(year, options?)` | Alias for `setValue`. |
| `on(eventName, listener)` | Subscribe to timeline events. |
| `off(eventName, listener)` | Remove a previously registered listener. |
| `setStartEnd(startYear, endYear, step?)` | Update the timeline range and rebuild markers. |
| `setStep(step)` | Update the step interval and rebuild markers. |
| `setSpecialStep(specialStep)` | Update the milestone interval and rebuild markers. |
| `setShowLabels(showLabels)` | Toggle year labels below milestone markers. |
| `setSliderValues(values)` | Update allowed snap points and rebuild the timeline. |
| `setActiveSlideClass(className)` | Change the active marker CSS class name. |
| `destroy()` | Remove event listeners and clear the rendered timeline. |

## Styling 🎨

Customize the timeline appearance by overriding these classes in your own stylesheet:

| Class | Description |
|---|---|
| `.timeline-line` | Every marker line. |
| `.one-line` | Normal (non-milestone) marker style. |
| `.specific-line` | Highlighted milestone marker. |
| `.timeline-line.active` | Active marker state. |
| `.line-label` | Year label under milestone markers. |
| `.timeline-handle` | The draggable pointer. |

## Development 🧰

```bash
npm install       # install dependencies
npm run build     # build ESM, CJS, and the CDN/global bundle into dist/
npm run dev       # build in watch mode
npm run typecheck # run TypeScript type checking via JSDoc annotations
```

Build output in `dist/`:
- `timeline-slider.js` — ESM bundle
- `timeline-slider.cjs` — CommonJS bundle
- `timeline-slider.global.js` — minified IIFE/global bundle for CDN `<script>` usage
- `timeline-slider.d.ts` — TypeScript type declarations