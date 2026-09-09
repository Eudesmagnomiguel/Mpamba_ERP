/**
 * Gera o PDF do Manual do Utilizador a partir de docs/manual-do-utilizador.html.
 *
 *   node docs/build-manual-pdf.mjs
 *
 * Usa o Chrome instalado, conduzido pelo DevTools Protocol em vez do
 * `--print-to-pdf` da linha de comandos: só o protocolo aceita um rodapé
 * personalizado, e é dele que vêm os números de página que um documento de
 * consulta precisa. Não instala nada — o WebSocket é o global do Node.
 */

import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HTML = resolve('docs/manual-do-utilizador.html');
const PDF = resolve('docs/Manual-do-Utilizador-Mpamba.pdf');
const PORT = 9333;

const CHROME_CANDIDATES = [
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
	'/usr/bin/google-chrome',
	'/usr/bin/chromium',
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const FOOTER = `
<div style="width:100%;margin:0 14mm;font-family:'Segoe UI',Arial,sans-serif;font-size:7pt;color:#8a8a99;
            display:flex;justify-content:space-between;border-top:0.5px solid #d8d8e0;padding-top:2mm;">
  <span>Manual do Utilizador — Mpamba ERP</span>
  <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Espera que o Chrome abra a porta de depuração e devolve o endereço do WebSocket. */
async function waitForDebugger(timeoutMs = 30000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
			const info = await response.json();
			if (info.webSocketDebuggerUrl) return info.webSocketDebuggerUrl;
		} catch {
			// O Chrome ainda não está a ouvir; tenta outra vez.
		}
		await sleep(250);
	}
	throw new Error(`O Chrome não abriu a porta de depuração ${PORT} em ${timeoutMs / 1000}s`);
}

/** Cliente mínimo do DevTools Protocol: envia comandos e espera pela resposta com o mesmo id. */
function cdpClient(url) {
	const socket = new WebSocket(url);
	const pending = new Map();
	const listeners = new Map();
	let nextId = 1;

	const ready = new Promise((accept, reject) => {
		socket.addEventListener('open', accept, { once: true });
		socket.addEventListener('error', () => reject(new Error('Falha na ligação ao Chrome')), { once: true });
	});

	socket.addEventListener('message', (event) => {
		const message = JSON.parse(event.data);
		if (message.id && pending.has(message.id)) {
			const { accept, reject } = pending.get(message.id);
			pending.delete(message.id);
			message.error ? reject(new Error(message.error.message)) : accept(message.result);
			return;
		}
		if (message.method && listeners.has(message.method)) {
			listeners.get(message.method)();
			listeners.delete(message.method);
		}
	});

	return {
		ready,
		send(method, params = {}, sessionId) {
			const id = nextId++;
			return new Promise((accept, reject) => {
				pending.set(id, { accept, reject });
				socket.send(JSON.stringify({ id, method, params, sessionId }));
			});
		},
		once(method) {
			return new Promise((accept) => listeners.set(method, accept));
		},
		close: () => socket.close(),
	};
}

async function main() {
	if (!existsSync(HTML)) throw new Error(`Não encontrei ${HTML}`);

	const chrome = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
	if (!chrome) throw new Error('Não encontrei o Chrome nem o Edge para renderizar o PDF');

	const profile = await mkdtemp(join(tmpdir(), 'mpamba-pdf-'));
	const browser = spawn(chrome, [
		'--headless=new',
		'--disable-gpu',
		`--remote-debugging-port=${PORT}`,
		`--user-data-dir=${profile}`,
		'--no-first-run',
		'--no-default-browser-check',
		'about:blank',
	], { stdio: 'ignore' });

	const client = cdpClient(await waitForDebugger());
	await client.ready;

	try {
		const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
		const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });

		await client.send('Page.enable', {}, sessionId);
		const loaded = client.once('Page.loadEventFired');
		await client.send('Page.navigate', { url: pathToFileURL(HTML).href }, sessionId);
		await loaded;
		// Deixa assentar tipos de letra e a paginação antes de imprimir.
		await sleep(1500);

		const { data } = await client.send('Page.printToPDF', {
			printBackground: true,
			preferCSSPageSize: true,
			displayHeaderFooter: true,
			headerTemplate: '<span></span>',
			footerTemplate: FOOTER,
			generateTaggedPDF: true,
			generateDocumentOutline: true,
		}, sessionId);

		await writeFile(PDF, Buffer.from(data, 'base64'));
		console.log(`PDF gerado: ${PDF}`);
	} finally {
		client.close();
		browser.kill();
		await rm(profile, { recursive: true, force: true }).catch(() => {});
	}
}

main().catch((error) => {
	console.error(`Falha ao gerar o PDF: ${error.message}`);
	process.exit(1);
});
