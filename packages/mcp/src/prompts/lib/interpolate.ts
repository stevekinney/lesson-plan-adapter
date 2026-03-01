export function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    if (key in variables) return variables[key];
    throw new Error(`Missing template variable: {${key}}`);
  });
}
