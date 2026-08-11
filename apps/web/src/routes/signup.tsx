import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "../features/auth/SignupForm";

export const Route = createFileRoute("/signup")({
	component: SignupForm,
});
