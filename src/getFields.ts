import { ALL_FIELD_TYPES, KintoneClient } from "./kintone";
import { NOT_EXIST_MESSAGE, NOT_MATCH_MESSAGE } from "./messages";

type PromiseType = typeof Promise;

export function createGetFields(
  kintoneClient: KintoneClient,
  Promise_: PromiseType
) {
  const Promise: PromiseType = Promise_;
  const { fetchFormInfoByFields, fetchFormInfoByLayout } = kintoneClient;

  function removeUnnecessaryProperties(field: any) {
    const { size: _, ...rest } = field;
    return rest;
  }

  function getFieldInfo(layoutFields: any) {
    return layoutFields
      .filter((layout: any) => layout.type !== "LABEL" && layout.type !== "HR")
      .map((field: any) => removeUnnecessaryProperties(field));
  }

  function modifiedLayoutResp(layoutList: any) {
    return layoutList.reduce((acc: any, layout: any) => {
      switch (layout.type) {
        case "ROW":
          return [...acc, ...getFieldInfo(layout.fields)];
        case "GROUP":
          return [
            ...acc,
            { type: layout.type, code: layout.code },
            ...layout.layout
              .map((childLayout: any) => getFieldInfo(childLayout.fields))
              .reduce((acc: any, cur: any) => acc.concat(cur), [])
          ];
        case "SUBTABLE":
          const layoutFieldsIncludeSubtableCode = layout.fields.map(
            (layoutField: any) => ({
              ...layoutField,
              subtableCode: layout.code
            })
          );
          return [
            ...acc,
            { type: layout.type, code: layout.code },
            ...getFieldInfo(layoutFieldsIncludeSubtableCode)
          ];
      }
    }, []);
  }

  function getLabeledFields(fieldsResp: any): any {
    return Object.keys(fieldsResp).reduce((acc, key) => {
      const field = fieldsResp[key];
      if (field.type === "SUBTABLE") {
        return { ...acc, ...getLabeledFields(field.fields) };
      }
      return field.label ? { ...acc, [field.code]: field.label } : acc;
    }, {});
  }

  function addLabel(layoutFieldList: any, fieldsResp: any) {
    const labeledFields: { [code: string]: string } = getLabeledFields(
      fieldsResp
    );
    return layoutFieldList.map((layoutField: any) =>
      labeledFields[layoutField.code]
        ? { ...layoutField, label: labeledFields[layoutField.code] }
        : layoutField
    );
  }

  function getLookupFieldKeys(fieldsResp: any) {
    return Object.keys(fieldsResp).filter(
      key => typeof fieldsResp[key].lookup !== "undefined"
    );
  }

  function addIsLookup(layoutFieldList: any, fieldsResp: any) {
    const lookupFieldKeys = getLookupFieldKeys(fieldsResp);
    if (lookupFieldKeys.length === 0) layoutFieldList;

    return layoutFieldList.reduce((acc: any, layoutField: any) => {
      if (lookupFieldKeys.includes(layoutField.code)) {
        layoutField.isLookup = true;
      }
      acc.push(layoutField);
      return acc;
    }, []);
  }

  function flattenFieldsForSubtable(fieldsResp: any) {
    return Object.keys(fieldsResp).reduce((fields, key) => {
      if (fieldsResp[key].type === "SUBTABLE") {
        return {
          ...fields,
          [key]: fieldsResp[key],
          ...fieldsResp[key].fields
        };
      }
      return {
        ...fields,
        [key]: fieldsResp[key]
      };
    }, {});
  }

  function fetchAllFields(appId: number, selectFieldTypes?: string[]): Promise<any> {
    return Promise.all([fetchFormInfoByFields(appId), fetchFormInfoByLayout(appId)]).then(
      ([fieldsResp, layoutResp]) => {
        const fieldList = addLabel(
          addIsLookup(
            modifiedLayoutResp(layoutResp),
            flattenFieldsForSubtable(fieldsResp)
          ),
          fieldsResp
        );

        return selectFieldTypes
          ? fieldList.filter(
              (field: any) => selectFieldTypes.indexOf(field.type) !== -1
            )
          : fieldList;
      }
    );
  }

  function validateFieldType(fieldType: string): boolean {
    return ALL_FIELD_TYPES.some(type => type === fieldType);
  }

  function validateGetAllFieldsArgument(
    fieldType: string | string[]
  ): string | null {
    if (typeof fieldType === "string") {
      return validateFieldType(fieldType) ? null : NOT_EXIST_MESSAGE;
    }
    if (Array.isArray(fieldType)) {
      return fieldType.every(validateFieldType) ? null : NOT_EXIST_MESSAGE;
    }
    return NOT_MATCH_MESSAGE;
  }

  function getFields(appId: number, selectFieldType?: string | string[]): Promise<any> {
    if (typeof selectFieldType === "undefined") {
      return fetchAllFields(appId);
    }

    const error = validateGetAllFieldsArgument(selectFieldType);
    if (error) {
      return Promise.reject(new Error(error));
    }

    return fetchAllFields(
      appId, Array.isArray(selectFieldType) ? selectFieldType : [selectFieldType]
    );
  }
  return getFields;
}
