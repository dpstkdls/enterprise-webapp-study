export class AppError extends Error {
	constructor(
		public statusCode: number,
		public code: string,
		message: string,
	) {
		super(message);
		this.name = "AppError";
	}
}

// RFC 9457 확장
export type ErrorResponse = {
	type: string;
	title: string;
	status: number;
	code: string;
	requestId: string;
	detail?: string;
	errors?: { path: string; message: string }[];
};
