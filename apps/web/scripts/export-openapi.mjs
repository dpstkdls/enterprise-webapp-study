import { writeFile } from "node:fs/promises";

const res = await fetch("http://localhost:3000/docs/json");
if (!res.ok) {
	throw new Error(`스펙 요청 실패 ${res.status} — API dev 서버 떠 있는지 확인`);
}
const spec = await res.json();
await writeFile(
	new URL("../openapi.json", import.meta.url),
	`${JSON.stringify(spec, null, 2)}\n`,
);
console.log("openapi.json 갱신");
