import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMetricsStream } from "@/features/metrics/useMetricsStream";

const socket = () =>
	(WebSocket as unknown as { last: { onmessage: ((e: { data: string }) => void) | null }}).last;

const frame = (id: number) => ({
	data: JSON.stringify({
		type: "metric",
		data: {
			id,
			serverId: 5,
			cpu: 50,
			memory: 60,
			createdAt: "2026-08-13T00:00:00.000Z",
		},
	}),
});

describe("useMetricsStream", () => {
	it("메시지가 누적되고 60개 상한이 지켜지는지 확인", () => {
		const { result } = renderHook(() => useMetricsStream("org-1"));

		act(() => {
			for (let i = 1; i <= 70; i++) socket().onmessage?.(frame(i));
		});

		expect(result.current).toHaveLength(60);
		expect(result.current[0].id).toBe(11);
		expect(result.current[59].id).toBe(70);
	});

	it("metric 외 타입은 무시한다.", () => {
		const { result } = renderHook(() => useMetricsStream("org-1"));

		act(() => {
			socket().onmessage?.({
				data: JSON.stringify({ type: "other" }),
			});
		});

		expect(result.current).toHaveLength(0);
	});

	it("org가 바뀌면 버퍼를 비운다.", () => {
		const { result, rerender } = renderHook(
			({ orgId }) => useMetricsStream(orgId),
			{
				initialProps: { orgId: "org-1" },
			},
		);

		act(() => socket().onmessage?.(frame(1)));
		expect(result.current).toHaveLength(1);

		rerender({ orgId: "org-2" });
		expect(result.current).toHaveLength(0);
	});
});
