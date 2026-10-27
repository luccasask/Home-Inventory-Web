/** Filled faces with open seams, matching the supplied filter-icon reference. */
export function FilledTypeIcon({ storage }: { storage: boolean }) {
  return <svg className="filled-type-icon" viewBox="0 0 24 24" aria-hidden="true">
    <g fill="currentColor" stroke="currentColor" strokeWidth=".8" strokeLinejoin="round">
      {storage ? <>
        <path d="M12 1.4 22 7.2 18.2 9.4 8.2 3.6Z" />
        <path d="m5.2 5.35 10 5.8L12 13 2 7.2Z" />
      </> : <path d="M12 1.4 22 7.2 12 13 2 7.2Z" />}
      <path d="m1.5 9.5 9.2 5.3V23l-9.2-5.3Z" />
      <path d="m22.5 9.5-9.2 5.3V23l9.2-5.3Z" />
    </g>
  </svg>;
}
