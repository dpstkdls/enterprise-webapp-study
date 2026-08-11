import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/features/auth/auth.client";
import { serversQuery } from "@/features/servers/servers.queries";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { createServer, updateServer } from "../../features/servers/servers.api";

export const Route = createFileRoute("/_auth/servers")({
	component: ServersPage,
});

function ServersPage() {
	const { data: session } = authClient.useSession();
	const orgId = session?.session.activeOrganizationId;
	const {
		data: servers,
		isPending,
		error,
	} = useQuery({ ...serversQuery(orgId ?? ""), enabled: !!orgId });
	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: serversQuery(orgId ?? "").queryKey,
		});

	const createMut = useMutation({
		mutationFn: createServer,
		onSuccess: invalidate,
	});
	const updateMut = useMutation({
		mutationFn: ({ id, status }: { id: number; status: number }) =>
			updateServer(id, { status }),
		onSuccess: invalidate,
	});

	const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = new FormData(e.currentTarget);
		createMut.mutate({
			hostname: form.get("hostname") as string,
			ip: form.get("ip") as string,
			status: 1,
		});
		e.currentTarget.reset();
	};

	if (!orgId) return <p>조직을 먼저 선택하십시오.</p>;
	if (isPending) return <p>불러오는 중...</p>;
	if (error) return <p className="text-destructive">목록 조회 실패</p>;

	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-lg font-semibold">서버 목록</h1>
			<form onSubmit={onCreate} className="flex items-end gap-2">
				<div className="flex flex-col gap-1">
					<Label htmlFor="hostname">호스트명</Label>
					<Input id="hostname" name="hostname" required />
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor="ip">IP</Label>
					<Input id="ip" name="ip" required />
				</div>
				<Button type="submit" disabled={createMut.isPending}>
					등록
				</Button>
			</form>
			{createMut.error && <p className="text-sm text-destructive">등록 실패</p>}
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b text-left text-muted-foreground">
						<th className="py-2">호스트명</th>
						<th>IP</th>
						<th>상태</th>
					</tr>
				</thead>
				<tbody>
					{servers.map((s) => (
						<tr key={s.id} className="border-b">
							<td className="py-2">{s.hostname}</td>
							<td>{s.ip}</td>
							<td>
								<Button
									variant="ghost"
									size="sm"
									disabled={updateMut.isPending}
									onClick={() =>
										updateMut.mutate({
											id: s.id,
											status: s.status === 1 ? 0 : 1,
										})
									}
								>
									{s.status === 1 ? "가동" : "중지"}
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
