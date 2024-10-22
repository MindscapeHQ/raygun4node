import type { IncomingMessage } from "http";

// IndexableError is a type that extends the Error type
// and allows for any additional properties to be added to it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IndexableError = Error & Record<string, any>;

export type MessageBuilderOptions = {
  reportColumnNumbers?: boolean;
  useHumanStringForObject?: boolean;
  innerErrorFieldName?: string;
  filters?: string[];
  timestamp?: Date;
};

export type StackFrame = {
  lineNumber: number;
  columnNumber?: number;
  className: string;
  fileName: string;
  methodName: string;
};

export type Message = {
  occurredOn: Date;
  details: MessageDetails;
};

export type MessageBuilding = {
  occurredOn: Date;
  details: Partial<MessageDetails>;
};

export type BuiltError = {
  message: string;
  stackTrace?: StackFrame[];
  className?: string;
  innerError?: BuiltError;
};

export type MessageDetails = {
  client: {
    name: string;
    version: string;
  };
  groupingKey: string | null;
  error: BuiltError;
  version: string;
  user: UserDetails;
  request: RequestDetails;
  tags: Tag[];
  userCustomData: CustomData;
  machineName: string;
  environment: Environment;
  correlationId: string | null;
  breadcrumbs?: Breadcrumb[];
};

export type Environment = {
  osVersion: string;
  architecture: string;
  totalPhysicalMemory: number;
  availablePhysicalMemory: number;
  utcOffset: number;
  processorCount?: number;
  cpu?: string;
};

export type Tag = string;

export type SendOptions = {
  message: string;
  http?: HTTPOptions;
};

export type HTTPOptions = {
  useSSL: boolean;
  host: string | undefined;
  port: number | undefined;
  apiKey: string;
  timeout?: number;
};

// Allow any because users are free to set anything as CustomData
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CustomData = any;

export type RequestParams = ({ host: string } | { hostname: string }) &
  CommonRequestParams;

type CommonRequestParams = {
  path: string;
  method: string;
  ip: string;
  query: object;
  headers: object;
  body: object;
};

export type RequestDetails = {
  hostName: string;
  url: string;
  httpMethod: string;
  ipAddress: string;
  queryString: object;
  headers: object;
  form: object;
};

// Internal type to attach to crash reports
export type UserDetails = {
  // Unique identifier for the user
  identifier?: string;
  // Flag indicating if the user is anonymous or not
  isAnonymous?: boolean;
  // User's first name (what you would use if you were emailing them - "Hi {{firstName}}, ...")
  firstName?: string;
  // User's full name
  fullName?: string;
  // User's email address
  email?: string;
  // Device unique identifier. Useful if sending errors from a mobile device.
  uuid?: string;
};

/**
 * Either a string identifier or a RawUserData object
 * Supports legacy clients providing identifier directly
 */
export type UserMessageData = RawUserData | string;

export type RawUserData = {
  // Unique identifier for the user
  identifier?: string;
  // Flag indicating if the user is anonymous or not
  isAnonymous?: boolean;
  // User's first name (what you would use if you were emailing them - "Hi {{firstName}}, ...")
  firstName?: string;
  // User's full name
  fullName?: string;
  // User's email address
  email?: string;
  // Device unique identifier. Useful if sending errors from a mobile device.
  uuid?: string;
};

export type OfflineStorageOptions = {
  cachePath: string;
  cacheLimit?: number;
};

export type Transport = {
  send(options: SendOptions): Promise<IncomingMessage>;
};

export type MessageTransport = {
  send(message: string): void;
};

export type Hook<T> = (
  message: Message,
  exception: Error | string,
  customData: CustomData,
  request?: RequestParams,
  tags?: Tag[],
) => T;

export interface IOfflineStorage {
  init(options: OfflineStorageOptions | undefined): void;
  save(message: string, callback: (error: Error | null) => void): void;
  retrieve(
    callback: (error: NodeJS.ErrnoException | null, items: string[]) => void,
  ): void;
  send(callback: (error: Error | null, items?: string[]) => void): void;
}

export type RaygunOptions = {
  apiKey: string;
  filters?: string[];
  host?: string;
  port?: number;
  useSSL?: boolean;
  timeout?: number;
  onBeforeSend?: Hook<Message>;
  offlineStorage?: IOfflineStorage;
  offlineStorageOptions?: OfflineStorageOptions;
  isOffline?: boolean;
  groupingKey?: Hook<string>;
  tags?: Tag[];
  useHumanStringForObject?: boolean;
  reportColumnNumbers?: boolean;
  innerErrorFieldName?: string;
  batch?: boolean;
  batchFrequency?: number;
  reportUncaughtExceptions?: boolean;
};

/**
 * Internal type, sent to the Raygun API as part of MessageDetails
 */
export type Breadcrumb = {
  timestamp: number;
  level: "debug" | "info" | "warning" | "error";
  type: "manual" | "navigation" | "click-event" | "request" | "console";
  category: string;
  message: string;
  customData?: CustomData;
  className?: string;
  methodName?: string;
  lineNumber?: number;
};

/**
 * Public type, for users to create their own custom Breadcrumb
 */
export type BreadcrumbMessage = Partial<
  Pick<Breadcrumb, "level" | "category" | "message" | "customData">
>;

export interface SendParameters {
  customData?: CustomData;
  request?: RequestParams;
  tags?: Tag[];
  timestamp?: Date | number;
  userInfo?: UserMessageData;
}
