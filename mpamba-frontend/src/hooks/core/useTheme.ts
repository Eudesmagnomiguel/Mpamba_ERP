import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'mpamba:theme';

function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function useTheme() {
	const [theme, setTheme] = useState<Theme>('light');

	useEffect(() => {
		const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
		const initial = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		setTheme(initial);
		applyTheme(initial);
	}, []);

	const toggleTheme = () => {
		setTheme((prev) => {
			const next: Theme = prev === 'dark' ? 'light' : 'dark';
			window.localStorage.setItem(THEME_KEY, next);
			applyTheme(next);
			return next;
		});
	};

	return { theme, toggleTheme };
}
