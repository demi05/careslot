export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <div
      className="relative rounded-[7px] bg-primary shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute bg-accent rounded-sm"
        style={{ top: size * 0.17, left: size * 0.17, right: size * 0.17, height: Math.max(2, size * 0.1) }}
      />
      <div
        className="absolute bg-white rounded-[1px]"
        style={{ bottom: size * 0.2, left: size * 0.2, width: size * 0.17, height: size * 0.17 }}
      />
    </div>
  );
}

export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {withWordmark && (
        <span className="text-xl font-bold text-primary">CareSlot</span>
      )}
    </div>
  );
}
