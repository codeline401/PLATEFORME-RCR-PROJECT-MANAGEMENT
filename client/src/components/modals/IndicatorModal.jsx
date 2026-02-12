import { XIcon, PlusIcon } from "lucide-react";

/**
 * Modal de création d'indicateur
 */
export default function IndicatorModal({
  indicator,
  setIndicator,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const handleClose = () => {
    setIndicator({ name: "", target: 0, unit: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-sm mx-4 border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-white">
            Hanampy Mari-pandrefesana
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              Anarana *
            </label>
            <input
              type="text"
              value={indicator.name}
              onChange={(e) =>
                setIndicator({ ...indicator, name: e.target.value })
              }
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
              placeholder="Ex: Hazo voavoly, Olona nandray anjara..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                Tanjona (cible)
              </label>
              <input
                type="number"
                min="0"
                value={indicator.target}
                onChange={(e) =>
                  setIndicator({
                    ...indicator,
                    target: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                Singa (unité)
              </label>
              <input
                type="text"
                value={indicator.unit}
                onChange={(e) =>
                  setIndicator({ ...indicator, unit: e.target.value })
                }
                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
                placeholder="Ex: hazo, olona, Ar..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Hiverina
          </button>
          <button
            onClick={onSubmit}
            disabled={!indicator.name.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <PlusIcon className="size-4" />
            )}
            Hampiditra
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal d'édition de valeur d'indicateur
 */
export function EditIndicatorModal({
  indicator,
  value,
  setValue,
  onClose,
  onSubmit,
}) {
  if (!indicator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-sm mx-4 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-white text-sm">
            Ovaina mari-pandrefesana
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="p-4">
          <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
            {indicator.name}
          </label>
          <input
            type="number"
            min="0"
            max={indicator.target}
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
          />
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            Hiverina
          </button>
          <button
            onClick={onSubmit}
            className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white"
          >
            Ovaina
          </button>
        </div>
      </div>
    </div>
  );
}
