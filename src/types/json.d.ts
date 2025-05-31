/**
 * TypeScript declaration for JSON imports
 * This allows us to import JSON files directly in TypeScript
 */
declare module "*.json" {
  const value: Record<string, unknown>;
  export default value;
}