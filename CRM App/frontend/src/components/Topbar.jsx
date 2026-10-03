import React from 'react';

export default function Topbar({ jobCount }) {
  return (
    <div className="topbar">
      <span>Customer &rarr; project &rarr; site execution control</span>
      <span style={{ fontWeight: 600, color: 'var(--acc)' }}>{jobCount || 0} jobs</span>
    </div>
  );
}
