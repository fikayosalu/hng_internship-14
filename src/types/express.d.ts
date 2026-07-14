declare namespace Express {
	interface User {
		[key: string]: any;
		save(): Promise<this>;
	}
}
