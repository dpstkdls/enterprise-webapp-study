import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "./auth.client";

export function LoginForm() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = new FormData(e.currentTarget);
		const { error } = await authClient.signIn.email({
			email: form.get("email") as string,
			password: form.get("password") as string,
		});
		if (error) {
			setError(error.message ?? "로그인 실패");
			return;
		}
		navigate({ to: "/" });
	};

	return (
		<form onSubmit={onSubmit}>
			<h1>로그인</h1>
			<input name="email" type="email" placeholder="이메일" required />
			<input
				name="password"
				type="password"
				placeholder="비밀번호"
				required
				minLength={8}
			/>
			{error && <p>{error}</p>}
			<button type="submit">로그인</button>
		</form>
	);
}
