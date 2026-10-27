function panelOrder(path: string): number {
  return path === '/search' ? 1 : path === '/add' ? 2 : 0;
}

export function pageDirection({ from, to, viaPanelMenu, back, previousIndex, nextIndex }: {
  from: string; to: string; viaPanelMenu: boolean; back: boolean; previousIndex: number; nextIndex: number;
}): 'forward' | 'back' {
  // Main panels are physically ordered Home → Search → Add. Item links and
  // browser history retain their own navigation semantics instead.
  if (viaPanelMenu && panelOrder(from) !== panelOrder(to)) {
    return panelOrder(to) > panelOrder(from) ? 'forward' : 'back';
  }
  return back || nextIndex < previousIndex ? 'back' : 'forward';
}
