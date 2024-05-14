import type { Request } from "express";
import type { InternalBreadcrumb } from "./types";
import { getBreadcrumbs } from "./raygun.breadcrumbs";

const debug = require("debug")("raygun").bind(
  null,
  "[raygun.breadcrumbs.express.ts]",
);

/**
 * Parses an ExpressJS Request and adds it to the breadcrumbs store
 * @param request
 */
export function addRequestBreadcrumb(request: Request) {
  const crumbs = getBreadcrumbs();

  if (!crumbs) {
    debug("Add request breadcrumb skip, no store!");
    return;
  }

  const internalCrumb: InternalBreadcrumb = {
    category: "http",
    message: `${request.method} ${request.url}`,
    level: "info",
    timestamp: Number(new Date()),
    type: "request",
  };

  debug(`recorded request breadcrumb: ${internalCrumb}`);

  crumbs.push(internalCrumb);
}
