import type { Request } from "express";
import type { InternalBreadcrumb } from "./types";
import { getBreadcrumbs } from "./raygun.breadcrumbs";

const debug = require("debug")("raygun");

/**
 * Parses an ExpressJS Request and adds it to the breadcrumbs store
 * @param request
 */
export function addRequestBreadcrumb(request: Request) {
  const crumbs = getBreadcrumbs();

  if (!crumbs) {
    debug("[raygun.breadcrumbs.express.ts] Add request breadcrumb skip, no store!");
    return;
  }

  const internalCrumb: InternalBreadcrumb = {
    category: "http",
    message: `${request.method} ${request.url}`,
    level: "info",
    timestamp: Number(new Date()),
    type: "request",
  };

  debug(`[raygun.breadcrumbs.express.ts] recorded request breadcrumb: ${internalCrumb}`);

  crumbs.push(internalCrumb);
}
