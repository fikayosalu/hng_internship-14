class ApiErrorClass extends Error {
	status: string;
	statusCode: number;
	isOperational: boolean;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.status = `${this.statusCode}`.startsWith("4") ? "failed" : "error";
		this.isOperational = true;
	}
}

export default ApiErrorClass;
