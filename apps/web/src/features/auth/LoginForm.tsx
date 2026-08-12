import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
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
		<div className="flex min-h-screen items-center justify-center">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>로그인</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="email">이메일</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="이메일"
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="password">비밀번호</Label>
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="비밀번호"
								required
								minLength={8}
							/>
						</div>
						{error && <p className="text-sm text-destructive">{error}</p>}
						<Button type="submit">로그인</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
