export const dynamicImport = new Function('specifier', 'return import(specifier);') as <T = any>(
  specifier: string
) => Promise<T>;