import { Request } from "express";

const buildLink = (req: Request, page: string, limit: string) => {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(req.query)) {
		if (key !== "page" && key !== "limit") {
			params.set(key, String(value));
		}
	}
	params.set("page", page);
	params.set("limit", limit);

	return `${req.baseUrl}${req.path}?${params.toString()}`;
};

export default buildLink;
