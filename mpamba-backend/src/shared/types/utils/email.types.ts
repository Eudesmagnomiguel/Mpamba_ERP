interface EmailOptions {
	to: string;
	subject: string;
	text?: string;
	html?: string;
	attachments?: Array<{
		filename: string;
		content: any;
		contentType?: string;
	}>;
}

interface EmailResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

export type { EmailOptions, EmailResult };