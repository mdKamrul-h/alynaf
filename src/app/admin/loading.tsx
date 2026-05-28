export default function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "rgba(200,146,14,0.15)", border: "1px solid rgba(200,146,14,0.3)" }}
        >
          <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#C8920E" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M7 1V13M1 4L13 10M13 4L1 10" stroke="#C8920E" strokeWidth="1" strokeOpacity="0.5" />
          </svg>
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full w-1/2 animate-[shimmer-gold_1.2s_linear_infinite] rounded-full" style={{ background: "#C8920E" }} />
        </div>
      </div>
    </div>
  );
}
