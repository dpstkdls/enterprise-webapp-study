import {
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { MetricPoint } from "./useMetricsStream";

export function MetricsChart({ points }: { points: MetricPoint[] }) {
	const data = points.map((p) => ({
		...p,
		time: new Date(p.createdAt).toLocaleTimeString(),
	}));

	return (
		<ResponsiveContainer width="100%" height={200}>
			<LineChart data={data}>
				<XAxis dataKey="time" fontSize={11} />
				<YAxis domain={[0, 100]} fontSize={11} unit="%" />
				<Tooltip />
				<Line
					dataKey="cpu"
					stroke="var(--chart-1)"
					dot={false}
					isAnimationActive={false}
				/>
				<Line
					dataKey="memory"
					stroke="var(--chart-2)"
					dot={false}
					isAnimationActive={false}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
