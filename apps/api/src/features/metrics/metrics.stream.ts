import type { WebSocket } from "@fastify/websocket";

const subscribers = new Map<string, Set<WebSocket>>();

export const subscribe = (orgId: string, socket: WebSocket) => {
	let set = subscribers.get(orgId);
	if (!set) {
		set = new Set();
		subscribers.set(orgId, set);
	}
	set.add(socket);
	socket.on("close", () => {
		set.delete(socket);
		if (set.size === 0) subscribers.delete(orgId);
	});
};

export const broadcast = (orgId: string, payload: unknown) => {
	const set = subscribers.get(orgId);
	if (!set) return;
	const message = JSON.stringify(payload);
	for (const socket of set) {
		if (socket.bufferedAmount > 1_000_000) continue;
		socket.send(message);
	}
};
