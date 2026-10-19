/** The only reader of DEMO_MODE. Demo deployments run on their own database. */
export function isDemo(): boolean {
  return process.env.DEMO_MODE === "1";
}
