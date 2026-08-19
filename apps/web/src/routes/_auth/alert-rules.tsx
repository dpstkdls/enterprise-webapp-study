import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { CreateRuleBody } from "@/features/alerts/alert-rules.api";
import { alertRulesQuery } from "@/features/alerts/alert-rules.queries";
import { authClient } from "@/features/auth/auth.client";
import { serversQuery } from "@/features/servers/servers.queries";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import {
	createAlertRule,
	type UpdateRuleBody,
	updateAlertRule,
} from "../../features/alerts/alert-rules.api";

export const Route = createFileRoute("/_auth/alert-rules")({
	component: AlertRulesPage,
});

function AlertRulesPage() {
	const { data: session } = authClient.useSession();
	const orgId = session?.session.activeOrganizationId;
	const {
		data: alertRules,
		isPending,
		error,
	} = useQuery({
		...alertRulesQuery(orgId ?? ""),
		enabled: !!orgId,
		select: (data) => data ?? [],
	});
	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: alertRulesQuery(orgId ?? "").queryKey,
		});

	const createMut = useMutation({
		mutationFn: createAlertRule,
		onSuccess: invalidate,
	});
	const updateMut = useMutation({
		mutationFn: ({ id, ...body }: { id: number } & UpdateRuleBody) =>
			updateAlertRule(id, body),
		onSuccess: invalidate,
	});

	const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = new FormData(e.currentTarget);
		createMut.mutate({
			serverId: Number(form.get("serverId")),
			metric: form.get("metric") as CreateRuleBody["metric"],
			threshold: Number(form.get("threshold")),
			enabled: form.get("enabled") === "true",
		});
		e.currentTarget.reset();
	};

	if (!orgId) return <p>조직을 먼저 선택하십시오.</p>;
	if (isPending) return <p>불러오는 중...</p>;
	if (error) return <p className="text-destructive">목록 조회 실패</p>;

	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-lg font-semibold">알림 규칙 목록</h1>
			<form onSubmit={onCreate} className="flex items-center gap-2">
				<div className="flex flex-col gap-1">
					<Label htmlFor="serverId">서버 ID</Label>
					<ServerSelect name="serverId" />
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor="metric">메트릭</Label>
					<MetricSelect name="metric" />
				</div>

				<div className="flex flex-col gap-1">
					<Label htmlFor="threshold">임계값</Label>
					<Input id="threshold" name="threshold" required />
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor="enabled">사용 여부</Label>
					<Switch name="enabled" />
				</div>
				<Button type="submit" disabled={createMut.isPending}>
					등록
				</Button>
			</form>
			{createMut.error && <p className="text-sm text-destructive">등록 실패</p>}
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b text-left text-muted-foreground">
						<th className="py-2">메트릭</th>
						<th>임계값</th>
						<th>상태</th>
					</tr>
				</thead>
				<tbody>
					{alertRules.map((r) => (
						<tr key={r.id} className="border-b">
							<td className="py-2">{r.metric}</td>
							<td>{r.threshold}</td>
							<td>
								<Switch
									checked={r.enabled}
									onCheckedChange={(checked) =>
										updateMut.mutate({ id: r.id, enabled: checked })
									}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function MetricSelect({ name }: { name: string }) {
	const items = [
		{ label: "CPU", value: "cpu" },
		{ label: "Memory", value: "memory" },
	];
	return (
		<Select name={name} items={items} defaultValue={"cpu"}>
			<SelectTrigger className="w-32">
				<SelectValue placeholder="메트릭 선택" />
			</SelectTrigger>
			<SelectContent>
				{items.map((item) => (
					<SelectItem key={item.value} value={item.value}>
						{item.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function ServerSelect({ name }: { name: string }) {
	const { data: session } = authClient.useSession();
	const orgId = session?.session.activeOrganizationId;
	const { data: servers, isPending } = useQuery({
		...serversQuery(orgId ?? ""),
		enabled: !!orgId,
		select: (data) => {
			return data.map((server) => {
				return {
					label: server.hostname,
					value: String(server.id),
				};
			});
		},
	});

	return (
		<Select
			name={name}
			items={servers ?? []}
			defaultValue={servers?.[0]?.value}
		>
			<SelectTrigger className="w-32">
				{isPending ? (
					<div className="flex items-center gap-2 text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span>불러오는 중...</span>
					</div>
				) : (
					<SelectValue placeholder="서버 선택" />
				)}
			</SelectTrigger>
			<SelectContent>
				{(servers ?? []).map((server) => (
					<SelectItem key={server.value} value={server.value}>
						{server.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
