type DrawerListener = (open: boolean) => void;

let mobileDrawerOpen = false;
const listeners = new Set<DrawerListener>();

export function setMobileDrawerOpen(open: boolean) {
  mobileDrawerOpen = open;
  listeners.forEach((listener) => listener(open));
}

export function subscribeMobileDrawerOpen(listener: DrawerListener) {
  listeners.add(listener);
  listener(mobileDrawerOpen);
  return () => {
    listeners.delete(listener);
  };
}
