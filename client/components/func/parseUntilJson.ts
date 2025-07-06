import { ALL, parseJSON } from 'partial-json';

export function parseUntilJson(jsonstr: string): Record<string, any> {
  let jsonRes: Record<string, any> | string = jsonstr;
  jsonRes = jsonRes.replaceAll('\n', '')
  if (jsonRes.startsWith('```json')) {
    jsonRes = jsonRes.replace('```json', '');
  }
  if (jsonRes.startsWith('`') || jsonRes.endsWith('`')) {
    jsonRes = jsonRes.replaceAll('```', '');
  }
  try {
    const properlyParsedJson = JSON.parse(jsonRes);
    if (typeof properlyParsedJson === 'object' && properlyParsedJson !== null) {
      return properlyParsedJson;
    } else {
      jsonRes = properlyParsedJson;
    }
  } catch (error) {
    // console.error(error);
  }
  const curlIndex =
    jsonRes.indexOf('{') === -1 ? jsonRes.length : jsonRes.indexOf('{');
  const sqIndex =
    jsonRes.indexOf('[') === -1 ? jsonRes.length : jsonRes.indexOf('[');
  jsonRes = jsonRes.slice(Math.min(curlIndex, sqIndex));

  if (jsonRes.startsWith('```json')) {
    jsonRes = jsonRes.replace('```json', '');
  }
  if (jsonRes.startsWith('`') || jsonRes.endsWith('`')) {
    jsonRes = jsonRes.replaceAll('```', '');
  }
  jsonRes = jsonRes.replaceAll('{\\n', '{').replaceAll('\\n}', '}');
  try {
    while (typeof jsonRes === 'string') {
      jsonRes = parseJSON(jsonRes, ALL);
    }
    return jsonRes;
  } catch (error) {
    // console.error(error);
    return {};
  }
}