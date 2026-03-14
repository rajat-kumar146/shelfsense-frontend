/**
 * Loading Spinner Component
 */

export default function Loader({ fullScreen = false }) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-surface-500 border-t-brand-500 rounded-full animate-spin" />
      <p className="text-sm text-gray-500 font-body">Loading...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-surface-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <span className="text-gray-900 font-bold text-lg">S</span>
          </div>
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12">{spinner}</div>
  );
}