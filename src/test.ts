import jwt from "jsonwebtoken";

const token = jwt.sign({ id: "heue" }, "test", { expiresIn: "3s" });

setTimeout(() => {
	try {
		jwt.verify(token, "test");
	} catch (error: any) {
		console.log(error.message);
	}
}, 4000);
