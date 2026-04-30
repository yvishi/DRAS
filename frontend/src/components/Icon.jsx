export default function Icon({ name, size = 14, stroke = 1.5 }) {
  const paths = {
    dashboard: <><rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="5" height="5"/><rect x="9" y="9" width="5" height="5"/></>,
    inbox:     <><path d="M2 9l2-6h8l2 6"/><path d="M2 9v4h12V9"/><path d="M5 9h6"/></>,
    package:   <><path d="M2 5l6-3 6 3v6l-6 3-6-3z"/><path d="M2 5l6 3 6-3"/><path d="M8 8v6"/></>,
    truck:     <><rect x="1" y="5" width="9" height="6"/><path d="M10 7h3l2 2v2h-5"/><circle cx="4" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/></>,
    alert:     <><path d="M8 2l6 11H2z"/><path d="M8 7v3M8 11.5v.5"/></>,
    settings:  <><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"/></>,
    chevron:   <path d="M5 3l4 5-4 5"/>,
    chevronLeft: <path d="M10 3l-4 5 4 5"/>,
    chevronDown: <path d="M3 5l5 4 5-4"/>,
    plus:      <path d="M8 3v10M3 8h10"/>,
    search:    <><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></>,
    user:      <><circle cx="8" cy="6" r="2.5"/><path d="M3 14c1-3 3-4 5-4s4 1 5 4"/></>,
    bell:      <><path d="M4 7a4 4 0 018 0v4l1 2H3l1-2z"/><path d="M6.5 13.5a1.5 1.5 0 003 0"/></>,
    download:  <><path d="M8 2v8M4 7l4 4 4-4M2 13h12"/></>,
    filter:    <path d="M2 3h12l-4.5 5.5V13l-3-1V8.5z"/>,
    check:     <path d="M3 8l3 3 7-7"/>,
    x:         <path d="M3 3l10 10M13 3L3 13"/>,
    file:      <><path d="M3 1h7l3 3v11H3z"/><path d="M10 1v3h3"/></>,
    warehouse: <><path d="M1 6l7-4 7 4v8H1z"/><path d="M5 14V9h6v5"/></>,
    camp:      <><path d="M2 13L8 3l6 10z"/><path d="M5.5 13V8h5v5"/></>,
    log:       <><path d="M3 2h10v12H3z"/><path d="M5 5h6M5 8h6M5 11h4"/></>,
    arrow:     <path d="M3 8h10M9 4l4 4-4 4"/>,
    ellipsis:  <><circle cx="3" cy="8" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="13" cy="8" r="1"/></>,
    eye:       <><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></>,
    map:       <><path d="M2 4l4-1 4 1 4-1v10l-4 1-4-1-4 1z"/><path d="M6 3v10M10 4v10"/></>,
    logout:    <><path d="M10 3h3v10h-3"/><path d="M7 10l3-2-3-2"/><path d="M3 8h7"/></>,
  };
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16"
      fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {paths[name] ?? null}
    </svg>
  );
}
