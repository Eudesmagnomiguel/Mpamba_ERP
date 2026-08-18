import nodemailer from "nodemailer";
import ENV  from "../shared/utils/env.utils.js";
import type { Transporter } from "nodemailer";

const transporter: Transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: ENV.EMAIL_USER || "",
		pass: ENV.EMAIL_PASS || "",
	},
});

export default transporter