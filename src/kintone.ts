export type FieldType =
  | "SINGLE_LINE_TEXT"
  | "MULTI_LINE_TEXT"
  | "RICH_TEXT"
  | "NUMBER"
  | "CALC"
  | "RADIO_BUTTON"
  | "CHECK_BOX"
  | "MULTI_SELECT"
  | "DROP_DOWN"
  | "DATE"
  | "TIME"
  | "DATETIME"
  | "FILE"
  | "LINK"
  | "USER_SELECT"
  | "ORGANIZATION_SELECT"
  | "GROUP_SELECT"
  | "REFERENCE_TABLE"
  | "SPACER"
  | "GROUP"
  | "SUBTABLE"
  | "RECORD_NUMBER"
  | "CREATOR"
  | "CREATED_TIME"
  | "MODIFIER"
  | "UPDATED_TIME";

export const ALL_FIELD_TYPES: FieldType[] = [
  "SINGLE_LINE_TEXT",
  "MULTI_LINE_TEXT",
  "RICH_TEXT",
  "NUMBER",
  "CALC",
  "RADIO_BUTTON",
  "CHECK_BOX",
  "MULTI_SELECT",
  "DROP_DOWN",
  "DATE",
  "TIME",
  "DATETIME",
  "FILE",
  "LINK",
  "USER_SELECT",
  "ORGANIZATION_SELECT",
  "GROUP_SELECT",
  "REFERENCE_TABLE",
  "SPACER",
  "GROUP",
  "SUBTABLE",
  "RECORD_NUMBER",
  "CREATOR",
  "CREATED_TIME",
  "MODIFIER",
  "UPDATED_TIME"
];

type KintoneApi = (
  pathOrUrl: string,
  method: "GET" | "POST",
  params: any
) => Promise<any>;

type KintoneApiObject = {
  url: (url: string, opt_detectGuestSpace?: boolean) => string;
};

export interface KintoneObject {
  api: KintoneApi & KintoneApiObject;
  app: {
    getId: () => number;
  };
}

export interface KintoneClient {
  fetchFormInfoByFields: (appId: number) => Promise<any>;
  fetchFormInfoByLayout: (appId: number) => Promise<any>;
}

export function createKintoneClient(kintone: KintoneObject) {
  function fetchFormInfoByFields(appId: number): any {
    const url = kintone.api.url("/k/v1/preview/app/form/fields", true);
    const body = {
      app: appId
    };
    return kintone.api(url, "GET", body).then(resp => {
      return resp.properties;
    });
  }

  function fetchFormInfoByLayout(appId?: number): any {
    const url = kintone.api.url("/k/v1/preview/app/form/layout", true);
    const body = {
      app: appId
    };
    return kintone.api(url, "GET", body).then(resp => {
      return resp.layout;
    });
  }

  return {
    fetchFormInfoByFields,
    fetchFormInfoByLayout
  };
}
