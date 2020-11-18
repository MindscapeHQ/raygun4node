import type { AsyncLocalStorage } from "async_hooks";
import type { Breadcrumb, InternalBreadcrumb } from "./types";
const debug = require("debug")("raygun").bind(null, "[breadcrumbs]");

let asyncLocalStorage: AsyncLocalStorage<InternalBreadcrumb[]> | null = null;

try {
  asyncLocalStorage = new (require("async_hooks").AsyncLocalStorage)();
  debug("initialized successfully");
} catch (e) {
  debug(
    "failed to load async_hooks.AsyncLocalStorage - initialization failed\n",
    e
  );
}

export function addBreadcrumb(breadcrumb: string | Breadcrumb) {
  debug("adding breadcrumb:", breadcrumb);

  const crumbs = getBreadcrumbs();

  if (!crumbs) {
    return;
  }

  if (typeof breadcrumb === "string") {
    const expandedBreadcrumb: Breadcrumb = {
      message: breadcrumb,
      level: "info",
      category: "",
    };

    breadcrumb = expandedBreadcrumb;
  }

  const internalCrumb: InternalBreadcrumb = {
    ...(breadcrumb as Breadcrumb),
    timestamp: Number(new Date()),
    type: "manual",
  };

  crumbs.push(internalCrumb);
}

export function getBreadcrumbs(): InternalBreadcrumb[] | null {
  if (!asyncLocalStorage) {
    return null;
  }

  return asyncLocalStorage.getStore() || null;
}

export function runWithBreadcrumbs(f: () => void) {
  if (!asyncLocalStorage) {
    f();
    return;
  }
  debug("running function with breadcrumbs");

  asyncLocalStorage.run([], f);
}
