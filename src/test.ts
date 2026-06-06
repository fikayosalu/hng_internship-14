import jwt from "jsonwebtoken";

const token = jwt.sign({ id: "heue" }, "uieieiie", { expiresIn: "3s" });

setTimeout(() => {
	try {
		jwt.verify("uuwuq", "uieieiie");
	} catch (error: any) {
		console.log(error);
	}
}, 4000);
