/**
 * Hook for theme export/import functionality.
 * @module
 */
import { useThemeStore } from '@/stores/theme';

export function useThemeExport() {
  const exportTheme = useThemeStore((state) => state.exportTheme);
  const importTheme = useThemeStore((state) => state.importTheme);

  const handleExport = () => {
    const json = exportTheme();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cgraph-theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; // safe downcast – DOM element
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          // type assertion: FileReader.result is string when readAsText() is used
          const json = e.target?.result as string;
          const success = importTheme(json);
          if (success) {
            alert('Theme imported successfully!');
          } else {
            alert('Failed to import theme. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return { handleExport, handleImport };
}
