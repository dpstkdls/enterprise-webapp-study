import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/features/auth/auth.client";
import { MetricsChart } from "@/features/metrics/MetricsChart";
import { useMetricsStream } from "@/features/metrics/useMetricsStream";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export const Route = createFileRoute("/_auth/")({
	component: HomePage,
});

function HomePage() {
	const { data: session } = authClient.useSession();
	const orgId = session?.session.activeOrganizationId ?? undefined;
	const points = useMetricsStream(orgId);
	return (
		<Card>
			<CardHeader>
				<CardTitle>실시간 메트릭</CardTitle>
			</CardHeader>
			<CardContent>
				{points.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						수신 대기 중 - 에이전트를 켜면 흐르기 시작한다.
					</p>
				) : (
					<MetricsChart points={points} />
				)}
			</CardContent>
		</Card>
	);
}
