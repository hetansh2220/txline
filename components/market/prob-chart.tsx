"use client";

// Zero-dependency SVG probability chart. Renders a smooth area+line for a
// series of values in [0,1]. The series is illustrative (a seeded walk) until
// real odds history is wired from TxLINE.

export function ProbChart({
    points,
    color = "#818cf8",
    height = 260,
}: {
    points: number[];
    color?: string;
    height?: number;
}) {
    const n = points.length;
    if (n < 2) return <div style={{ height }} />;

    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = Math.max(max - min, 0.02);
    // pad the vertical range so the line isn't glued to the edges
    const pad = 0.15;
    const toY = (v: number) => {
        const t = (v - min) / span; // 0..1
        return (1 - (t * (1 - 2 * pad) + pad)) * 100;
    };
    const toX = (i: number) => (i / (n - 1)) * 100;

    const line = points.map((v, i) => `${toX(i).toFixed(2)},${toY(v).toFixed(2)}`).join(" ");
    const area = `0,100 ${line} 100,100`;

    const lastX = toX(n - 1);
    const lastY = toY(points[n - 1]);
    const gradId = `g-${color.replace("#", "")}`;

    return (
        <div className="relative w-full" style={{ height }}>
            <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={area} fill={`url(#${gradId})`} />
                <polyline
                    points={line}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
            {/* live end dot (kept round via absolute positioning) */}
            <span
                className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4"
                style={{
                    left: `${lastX}%`,
                    top: `${lastY}%`,
                    background: color,
                    // @ts-expect-error css var
                    "--tw-ring-color": `${color}33`,
                }}
            />
        </div>
    );
}
