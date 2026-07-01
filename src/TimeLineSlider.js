/**
 * @typedef {Object} TimeLineSliderOptions
 * @property {string | HTMLElement} [container]
 * @property {number} [startYear]
 * @property {number} [endYear]
 * @property {number} [step]
 * @property {number} [specialStep]
 * @property {boolean} [showLabels]
 * @property {string} [activeSlideClass]
 * @property {number[] | null} [sliderValues]
 * @property {number | null} [initialValue]
 * @property {((value: number) => void) | null} [onChange]
 */

/**
 * @typedef {Object} SetValueOptions
 * @property {boolean} [animate]
 * @property {boolean} [notify]
 */

/**
 * @typedef {Object} UpdateActiveLineOptions
 * @property {boolean} [notify]
 * @property {boolean} [temporary]
 */

class TimeLineSlider {
  /**
   * @param {TimeLineSliderOptions} [options]
   */
  constructor(options = {}) {
    /** @type {TimeLineSliderOptions} */
    const defaults = {
      container: '#time-line',
      startYear: 1010,
      endYear: 2100,
      step: 10,
      specialStep: 100,
      showLabels: true,
      activeSlideClass: 'active',
      sliderValues: null,
      initialValue: null,
      onChange: null,
    };

    /** @type {TimeLineSliderOptions} */
    this.options = { ...defaults, ...options };

    /** @type {HTMLElement} */
    this.container = /** @type {HTMLElement} */ (
      typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container
    );

    if (!this.container) {
      throw new Error('TimeLineSlider: container element not found');
    }

    this.container.classList.add('timeline-slider-wrapper');

    /** @type {boolean} */
    this.isDragging = false;
    /** @type {number} */
    this.offsetX = 0;
    /** @type {number | null} */
    this.activeValue = null;

    /** @type {(event: PointerEvent) => void} */
    this.boundPointerMove = this.handlePointerMove.bind(this);
    /** @type {() => void} */
    this.boundPointerUp = this.handlePointerUp.bind(this);
    /** @type {(event: PointerEvent) => void} */
    this.boundPointerDown = this.handlePointerDown.bind(this);

    this.render();
    this.attachDocumentListeners();

    const initialValue = this.options.initialValue !== null
      ? Number(this.options.initialValue)
      : this.sliderYears[0];

    this.setValue(initialValue, { animate: false, notify: false });
  }

  attachDocumentListeners() {
    document.addEventListener('pointermove', this.boundPointerMove);
    document.addEventListener('pointerup', this.boundPointerUp);
  }

  /**
   * @param {string} eventName
   * @param {(detail: any) => void} listener
   * @returns {this}
   */
  on(eventName, listener) {
    if (typeof listener !== 'function') {
      return this;
    }

    this.eventListeners = this.eventListeners || {};
    this.eventListeners[eventName] = this.eventListeners[eventName] || [];
    this.eventListeners[eventName].push(listener);
    return this;
  }

  /**
   * @param {string} eventName
   * @param {(detail: any) => void} listener
   * @returns {this}
   */
  off(eventName, listener) {
    if (!this.eventListeners || !Array.isArray(this.eventListeners[eventName])) {
      return this;
    }

    this.eventListeners[eventName] = this.eventListeners[eventName].filter(
      (existing) => existing !== listener,
    );
    return this;
  }

  /**
   * @param {string} eventName
   * @param {any} [detail]
   * @returns {this}
   */
  emit(eventName, detail = {}) {
    if (this.eventListeners && Array.isArray(this.eventListeners[eventName])) {
      this.eventListeners[eventName].forEach((listener) => {
        listener(detail);
      });
    }

    if (this.container && typeof CustomEvent === 'function') {
      this.container.dispatchEvent(new CustomEvent(`timeline-${eventName}`, { detail }));
    }

    return this;
  }

  /**
   * @returns {number | null}
   */
  getValue() {
    return this.activeValue;
  }

  /**
   * @param {number} year
   * @param {SetValueOptions} [options]
   * @returns {void}
   */
  syncToYear(year, options = {}) {
    return this.setValue(year, options);
  }

  /**
   * @param {number} start
   * @param {number} end
   * @param {number} step
   * @returns {number[]}
   */
  createNumberRange(start, end, step) {
    const startNum = Number(start);
    const endNum = Number(end);
    const stepNum = Number(step) || 1;
    /** @type {number[]} */
    const years = [];

    if (!Number.isFinite(startNum) || !Number.isFinite(endNum) || stepNum <= 0) {
      return years;
    }

    if (startNum <= endNum) {
      for (let year = startNum; year <= endNum; year += stepNum) {
        years.push(year);
      }
    } else {
      for (let year = startNum; year >= endNum; year -= stepNum) {
        years.push(year);
      }
    }

    return years;
  }

  /**
   * @param {number[] | null | undefined} values
   * @returns {number[]}
   */
  normalizeYearValues(values) {
    if (!Array.isArray(values)) {
      return [];
    }

    return Array.from(new Set(values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))))
      .sort((a, b) => a - b);
  }

  render() {
    this.lineYears = this.createNumberRange(
      this.options.startYear,
      this.options.endYear,
      this.options.step,
    );

    this.sliderYears = this.normalizeYearValues(this.options.sliderValues || this.lineYears);

    if (this.sliderYears.length === 0) {
      this.sliderYears = [...this.lineYears];
    }

    /** @type {Set<number>} */
    this.valueSet = new Set(this.sliderYears);

    this.container.innerHTML = `
      <div class="lines"></div>
      <div class="timeline-handle"><div class="inner"></div></div>
    `;

    /** @type {HTMLElement} */
    this.linesElement = /** @type {HTMLElement} */ (this.container.querySelector('.lines'));
    /** @type {HTMLElement} */
    this.handle = /** @type {HTMLElement} */ (this.container.querySelector('.timeline-handle'));

    this.lineYears.forEach((year) => {
      const line = document.createElement('div');
      line.dataset.year = String(year);
      const specialStep = Number(this.options.specialStep);
      const isSpecific = Number.isFinite(specialStep)
        && specialStep > 0
        && ((year - Number(this.options.startYear)) % specialStep === 0);
      line.className = [
        'slide-line',
        'timeline-line',
        isSpecific ? 'specific-line' : 'one-line',
      ].join(' ');

      // optional label under specific (specialStep) lines
      if (isSpecific && this.options.showLabels) {
        const label = document.createElement('div');
        label.className = 'line-label';
        label.textContent = String(year);
        line.appendChild(label);
      }

      this.linesElement.appendChild(line);
    });

    /** @type {HTMLElement[]} */
    this.lineElements = /** @type {HTMLElement[]} */ (
      Array.from(this.container.querySelectorAll('.timeline-line'))
    );
    this.bindLineEvents();
    this.handle.style.left = '0px';
    this.handle.removeEventListener('pointerdown', this.boundPointerDown);
    this.handle.addEventListener('pointerdown', this.boundPointerDown);
  }

  bindLineEvents() {
    this.lineElements.forEach((line) => {
      line.addEventListener('click', () => {
        this.handleLineClick(Number(line.dataset.year));
      });
    });
  }

  /**
   * @param {number} year
   */
  handleLineClick(year) {
    const targetYear = this.valueSet.has(year)
      ? year
      : this.getNearestSliderValue(year);

    this.setValue(/** @type {number} */ (targetYear), { animate: true });
  }

  /**
   * @param {PointerEvent} event
   */
  handlePointerDown(event) {
    event.preventDefault();
    if (!this.handle) {
      return;
    }

    this.isDragging = true;
    this.handle.classList.remove('translate');
    this.handle.classList.add('dragging');
    this.offsetX = event.clientX - this.handle.getBoundingClientRect().left;

    if (event.pointerId && typeof this.handle.setPointerCapture === 'function') {
      this.handle.setPointerCapture(event.pointerId);
    }
  }

  /**
   * @param {PointerEvent} event
   */
  handlePointerMove(event) {
    if (!this.isDragging || !this.handle) {
      return;
    }

    event.preventDefault();

    const containerRect = this.container.getBoundingClientRect();
    const handleRect = this.handle.getBoundingClientRect();
    const rawLeft = event.clientX - containerRect.left - this.offsetX;
    // Allow a small overhang on each side equal to half the handle width,
    // so the handle can be dragged fully onto the first/last line
    // (which sit flush against the container edges).
    const overhang = handleRect.width / 2;
    const minLeft = -overhang;
    const maxLeft = containerRect.width - handleRect.width + overhang;
    const clampLeft = this.clamp(rawLeft, minLeft, maxLeft);

    this.handle.style.left = `${clampLeft}px`;

    const nearest = this.getNearestSliderValueByHandlePosition();
    if (nearest !== null) {
      this.updateActiveLine(nearest, { notify: false, temporary: true });
    }
  }

  handlePointerUp() {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    this.handle.classList.remove('dragging');
    this.handle.classList.add('translate');

    const nearest = this.getNearestSliderValueByHandlePosition();
    if (nearest !== null) {
      this.setValue(nearest, { animate: true });
    }
  }

  /**
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * @param {number} year
   * @returns {HTMLElement | undefined}
   */
  getLineElement(year) {
    return this.lineElements.find((line) => Number(line.dataset.year) === Number(year));
  }

  /**
   * @param {number} year
   * @returns {number | null}
   */
  getNearestSliderValue(year) {
    if (!Array.isArray(this.sliderYears) || this.sliderYears.length === 0) {
      return null;
    }

    const numericYear = Number(year);
    if (!Number.isFinite(numericYear)) {
      return null;
    }

    return this.sliderYears.reduce((closest, current) => {
      return Math.abs(current - numericYear) < Math.abs(closest - numericYear) ? current : closest;
    }, this.sliderYears[0]);
  }

  /**
   * @returns {number | null}
   */
  getNearestSliderValueByHandlePosition() {
    if (!this.handle || this.lineElements.length === 0) {
      return null;
    }

    const containerRect = this.container.getBoundingClientRect();
    const handleRect = this.handle.getBoundingClientRect();
    const handleCenterX = handleRect.left - containerRect.left + handleRect.width / 2;

    let nearestYear = this.sliderYears[0];
    let nearestCenterX = this.getLineCenterX(nearestYear, containerRect);
    let nearestDistance = Math.abs(nearestCenterX - handleCenterX);

    for (let i = 1; i < this.sliderYears.length; i += 1) {
      const currentYear = this.sliderYears[i];
      const line = this.getLineElement(currentYear);
      if (!line) {
        continue;
      }

      const lineRect = line.getBoundingClientRect();
      const lineCenterX = lineRect.left - containerRect.left + lineRect.width / 2;
      const distance = Math.abs(lineCenterX - handleCenterX);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestYear = currentYear;
      }
    }

    return nearestYear;
  }

  /**
   * @param {number} year
   * @param {DOMRect | null} [containerRect]
   * @returns {number}
   */
  getLineCenterX(year, containerRect = null) {
    const line = this.getLineElement(year);
    if (!line) {
      return 0;
    }

    const lineRect = line.getBoundingClientRect();
    const container = containerRect || this.container.getBoundingClientRect();
    return lineRect.left - container.left + lineRect.width / 2;
  }

  /**
   * @param {number} year
   * @param {UpdateActiveLineOptions} [options]
   */
  updateActiveLine(year, options = {}) {
    const { notify = true, temporary = false } = options;
    const normalizedYear = Number(year);
    if (!Number.isFinite(normalizedYear)) {
      return;
    }

    this.lineElements.forEach((line) => {
      line.classList.toggle(
        this.options.activeSlideClass,
        Number(line.dataset.year) === normalizedYear,
      );
    });

    this.activeValue = normalizedYear;

    if (notify && !temporary) {
      this.notifyChange(normalizedYear);
    }
  }

  /**
   * @param {number} year
   * @param {boolean} [animate]
   */
  moveHandleToYear(year, animate = true) {
    const line = this.getLineElement(year);
    if (!line || !this.handle) {
      return;
    }

    const containerRect = this.container.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    const handleRect = this.handle.getBoundingClientRect();
    // Center the handle on the line. Intentionally NOT clamped to the
    // container bounds: the first/last lines sit flush against the
    // container edges (because .lines uses justify-content: space-between),
    // so the handle must be allowed to overhang slightly past the edges
    // to stay visually centered on those lines.
    const targetLeft = lineRect.left - containerRect.left + lineRect.width / 2 - handleRect.width / 2;

    if (animate) {
      this.handle.classList.add('translate');
    }

    this.handle.style.left = `${targetLeft}px`;
  }

  /**
   * @param {number} value
   * @param {SetValueOptions} [options]
   */
  setValue(value, options = {}) {
    const { animate = true, notify = true } = options;
    const nearestValue = this.getNearestSliderValue(value);
    if (nearestValue === null) {
      return;
    }

    this.updateActiveLine(nearestValue, { notify, temporary: false });
    this.moveHandleToYear(nearestValue, animate);
  }

  /**
   * @param {number} value
   */
  notifyChange(value) {
    if (typeof this.options.onChange === 'function') {
      this.options.onChange(value);
    }

    this.emit('change', { value });
  }

  /**
   * @returns {number}
   */
  getActiveOrFirstYear() {
    return this.activeValue !== null && this.activeValue !== undefined
      ? this.activeValue
      : this.sliderYears[0];
  }

  /**
   * @param {number[]} values
   * @returns {this}
   */
  setSliderValues(values) {
    this.options.sliderValues = values;
    this.render();
    this.setValue(this.getActiveOrFirstYear(), { animate: false, notify: false });
    return this;
  }

  /**
   * @param {number} startYear
   * @param {number} endYear
   * @param {number} [step]
   * @returns {this}
   */
  setStartEnd(startYear, endYear, step = this.options.step) {
    this.options.startYear = startYear;
    this.options.endYear = endYear;
    this.options.step = step;
    this.render();
    this.setValue(this.getActiveOrFirstYear(), { animate: false, notify: false });
    return this;
  }

  /**
   * @param {number} step
   * @returns {this}
   */
  setStep(step) {
    this.options.step = step;
    this.render();
    this.setValue(this.getActiveOrFirstYear(), { animate: false, notify: false });
    return this;
  }

  /**
   * @param {number} specialStep
   * @returns {this}
   */
  setSpecialStep(specialStep) {
    this.options.specialStep = specialStep;
    this.render();
    this.setValue(this.getActiveOrFirstYear(), { animate: false, notify: false });
    return this;
  }

  /**
   * @param {boolean} showLabels
   * @returns {this}
   */
  setShowLabels(showLabels) {
    this.options.showLabels = Boolean(showLabels);
    this.render();
    this.setValue(this.getActiveOrFirstYear(), { animate: false, notify: false });
    return this;
  }

  /**
   * @param {string} className
   * @returns {this}
   */
  setActiveSlideClass(className) {
    this.options.activeSlideClass = className;
    this.updateActiveLine(this.getActiveOrFirstYear(), { notify: false, temporary: false });
    return this;
  }

  destroy() {
    document.removeEventListener('pointermove', this.boundPointerMove);
    document.removeEventListener('pointerup', this.boundPointerUp);
    if (this.handle) {
      this.handle.removeEventListener('pointerdown', this.boundPointerDown);
    }
    this.container.innerHTML = '';
  }
}

export default TimeLineSlider;