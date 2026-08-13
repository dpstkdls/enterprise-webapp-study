const API = process.env.API_URL ?? "http://localhost:3000";
const EMAIL = process.env.AGENT_EMAIL ?? "phase3@test.com";
const PASSWORD = process.env.AGENT_PASSWORD ?? "practice-1234";
const SERVER_ID = Number(process.env.AGENT_SERVER_ID ?? 1);
const ORIGIN = "http://localhost:5173";

const login = await fetch(`${API}/api/auth/sign-in/email`, {
	method: "POST",
	headers: { "Content-Type": "application/json", Origin: ORIGIN },
	body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
if (!login.ok) throw new Error(`로그인 실패 ${login.status}`);
const cookie = login.headers
	.getSetCookie()
	.map((c) => c.split(";")[0])
	.join("; ");

const orgs = await (
	await fetch(`${API}/api/auth/organization/list`, { headers: { cookie } })
).json();
await fetch(`${API}/api/auth/organization/set-active`, {
	method: "POST",
	headers: { "Content-Type": "application/json", Origin: ORIGIN, cookie },
	body: JSON.stringify({ organizationId: orgs[0].id }),
});

console.log(`에이전트 시작 — serverId=${SERVER_ID}, org=${orgs[0].name}`);

setInterval(async () => {
	const body = {
		serverId: SERVER_ID,
		cpu: Math.round(Math.random() * 100 * 10) / 10,
		memory: Math.round((30 + Math.random() * 40) * 10) / 10,
	};
	const res = await fetch(`${API}/metrics`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Origin: ORIGIN, cookie },
		body: JSON.stringify(body),
	});
	console.log(res.status, JSON.stringify(body));
}, 5000);
