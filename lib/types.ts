export type IndexableError = Error & {
  [key: string]: any;
};

export type MessageBuilderOptions = {
  reportColumnNumbers?: boolean;
  useHumanStringForObject?: boolean;
  innerErrorFieldName?: string;
  filters?: string[];
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
  callback: Function;
  http: HTTPOptions;
  batch: boolean;
}

export type HTTPOptions = {
  useSSL: boolean;
  host: string | undefined;
  port: number | undefined;
  apiKey: string;
};


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

export type UserDetails = {
  identifier?: string;
  uuid?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
};

export type RawUserData = {
  identifier?: string;
  uuid?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
};

export type OfflineStorageOptions = {
  cachePath: string;
  cacheLimit?: number;
};

export type Transport = {
  send(message: string, callback?: Function): void;
}
