import type { PageKey } from "@/data";

export type PageAction =
  | "add-entry"
  | "weekly-plan"
  | "add-meal"
  | "duplicate-week"
  | "save-recipe"
  | "import-recipe"
  | "start-workout"
  | "view-split"
  | "export-report"
  | "change-range"
  | "add-price"
  | "compare-stores"
  | "add-item"
  | "clear-checked"
  | "save-settings"
  | "reset-settings";

export type PageActionDetail = {
  page: PageKey;
  action: PageAction;
};

const PAGE_ACTION_EVENT = "morex:page-action";

export function dispatchPageAction(detail: PageActionDetail) {
  window.dispatchEvent(new CustomEvent<PageActionDetail>(PAGE_ACTION_EVENT, { detail }));
}

export function listenForPageActions(
  listener: (detail: PageActionDetail) => void,
) {
  function handleEvent(event: Event) {
    const customEvent = event as CustomEvent<PageActionDetail>;
    listener(customEvent.detail);
  }

  window.addEventListener(PAGE_ACTION_EVENT, handleEvent);
  return () => window.removeEventListener(PAGE_ACTION_EVENT, handleEvent);
}
