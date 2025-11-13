'use client';

import { useTheme } from '@/lib/theme';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type='button'
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className='flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800 dark:border-slate-500 dark:text-slate-200 dark:hover:border-slate-300 dark:hover:text-white'
    >
      <span suppressHydrationWarning role='img' aria-hidden='true'>
        {isDark ? '🌞' : '🌙'}
      </span>
      <span suppressHydrationWarning className='hidden sm:inline'>
        {isDark ? 'Light' : 'Dark'} mode
      </span>
    </button>
  );
};

export default ThemeToggle;
