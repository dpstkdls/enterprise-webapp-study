import { useEffect, useState } from "react";

const WS_URL = (import.meta.env.VITE_API_URL as string).replace(/^http/, "ws");
const MAX_POINTS = 60;

export type MetricPoint = {
	id: number;
	serverId: number;
	cpu: number;
	memory: number;
	createdAt: string;
};

export function useMetricsStream(orgId: string | undefined) {
	const [points, setPoints] = useState<MetricPoint[]>([]);

	useEffect(() => {
		if (!orgId) return;

		setPoints([]);
		let socket: WebSocket;
		let retry: number;
		let disposed = false;

		const connect = () => {
			socket = new WebSocket(`${WS_URL}/metrics/stream`);
			socket.onmessage = (e) => {
				const msg = JSON.parse(e.data);
				if (msg.type !== "metric") return;
				setPoints((prev) => [...prev.slice(-(MAX_POINTS - 1)), msg.data]);
			};
			socket.onclose = () => {
				if (!disposed) retry = window.setTimeout(connect, 3000);
			};
		};

		connect();

		return () => {
			disposed = true;
			clearTimeout(retry);
			socket.close();
		};
	}, [orgId]);

	return points;
}
