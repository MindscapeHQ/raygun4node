import type { AsyncLocalStorage } from "async_hooks";
import type { Breadcrumb, InternalBreadcrumb } from "./types";
const debug = require("debug")("raygun");

let asyncLocalStorage: AsyncLocalStorage<InternalBreadcrumb[]> | null = null;

try {
  asyncLocalStorage = new (require("async_hooks").AsyncLocalStorage)();
  debug("[raygun.breadcrumbs.ts] initialized successfully");
} catch (e) {
  debug(
    "[raygun.breadcrumbs.ts] failed to load async_hooks.AsyncLocalStorage - initialization failed\n",
    e,
  );
}

type SourceFile = {
  fileName: string;
  functionName: string;
  lineNumber: number | null;
};

function returnCallerSite(
  err: Error,
  callsites: NodeJS.CallSite[],
): SourceFile | null {
  for (const callsite of callsites) {
    const fileName = callsite.getFileName() || "";

    if (fileName.startsWith(__dirname)) {
      continue;
    }

    return {
      fileName: fileName,
      functionName: callsite.getFunctionName() || "<anonymous>",
      lineNumber: callsite.getLineNumber(),
    };
  }

  return null;
}

function getCallsite(): SourceFile | null {
  const originalPrepareStacktrace = Error.prepareStackTrace;

  Error.prepareStackTrace = returnCallerSite;

  // Ignore use of any, required for captureStackTrace
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = {};

  Error.captureStackTrace(output);

  const callsite = output.stack;
  Error.prepareStackTrace = originalPrepareStacktrace;
  return callsite;
}

export function addBreadcrumb(
  breadcrumb: string | Breadcrumb,
  type: InternalBreadcrumb["type"] = "manual",
) {
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

  const callsite = getCallsite();

  const internalCrumb: InternalBreadcrumb = {
    ...(breadcrumb as Breadcrumb),
    category: breadcrumb.category || "",
    message: breadcrumb.message || "",
    level: breadcrumb.level || "info",
    timestamp: Number(new Date()),
    type,
    className: callsite?.fileName,
    methodName: callsite?.functionName,

    // TODO - do we need to do any source mapping?
    lineNumber: callsite?.lineNumber || undefined,
  };

  debug(`[raygun.breadcrumbs.ts] recorded breadcrumb: ${internalCrumb}`);

  crumbs.push(internalCrumb);
}

export function getBreadcrumbs(): InternalBreadcrumb[] | null {
  if (!asyncLocalStorage) {
    return null;
  }

  const store = asyncLocalStorage.getStore();

  if (store) {
    return store;
  }

  const newStore: InternalBreadcrumb[] = [];

  debug("[raygun.breadcrumbs.ts] enter with new store");
  asyncLocalStorage.enterWith(newStore);

  return newStore;
}

export function runWithBreadcrumbs(
  f: () => void,
  store: InternalBreadcrumb[] = [],
) {
  if (!asyncLocalStorage) {
    f();
    return;
  }

  debug("[raygun.breadcrumbs.ts] running function with breadcrumbs");
  asyncLocalStorage.run(store, f);
}

export function clear() {
  if (!asyncLocalStorage) {
    return;
  }

  debug("[raygun.breadcrumbs.ts] clearing stored breadcrumbs, entering with new store");
  asyncLocalStorage.enterWith([]);
}

// const consoleMethods: [keyof typeof console, InternalBreadcrumb["level"]][] = [
//   ["debug", "debug"],
//   ["log", "info"],
//   ["info", "info"],
//   ["warn", "warning"],
//   ["error", "error"],
// ];

// for (const [method, level] of consoleMethods) {
//   const oldMethod = (console as any)[method];
//   (console as any)[method] = function logWithBreadcrumb<T>(
//     this: T,
//     ...args: any[]
//   ) {
//     addBreadcrumb({ message: args.join(" "), level }, "console");
//     return oldMethod.apply(this, args);
//   };
// }
