export type UpgradeRouter = { push: (href: string) => void };

export function getUpgradeHref(isAuthenticated: boolean) {
  return isAuthenticated ? "/app/upgrade" : "/pricing";
}

export function goToUpgrade(
  router: UpgradeRouter,
  isAuthenticated: boolean
) {
  router.push(getUpgradeHref(isAuthenticated));
}
