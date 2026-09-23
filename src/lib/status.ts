// DESIGN.md "The one flow", step 9: the aria-live status line. The text is
// written at once, never on an animation frame — Chrome runs no frames for
// a page it isn't painting, and "Saved." would silently never appear.
export interface StatusElement {
  textContent: string | null;
  classList: { add(name: string): void; remove(name: string): void };
}

export interface Timers {
  set(fn: () => void, ms: number): number;
  clear(handle: number): void;
}

const browserTimers: Timers = {
  set: (fn, ms) => window.setTimeout(fn, ms),
  clear: (handle) => window.clearTimeout(handle),
};

export function createStatus(el: StatusElement, timers: Timers = browserTimers) {
  let hide: number | undefined;
  return function say(text: string, ms = 2000): void {
    // Same text again: add a trailing no-break space so the region's text
    // still changes and a screen reader announces it a second time.
    el.textContent = el.textContent === text ? `${text} ` : text;
    el.classList.add("is-visible");
    if (hide !== undefined) timers.clear(hide);
    hide = timers.set(() => el.classList.remove("is-visible"), ms);
  };
}
