import { XIcon, PackageIcon, CheckCircleIcon } from "lucide-react";

/**
 * Modal de contribution matérielle
 */
export default function MaterialContributionModal({
  resource,
  contribution,
  setContribution,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  if (!resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md mx-4 border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <PackageIcon className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-white">
                Fanolorana Fitaovana
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Handray anjara amin'ity tetikasa ity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Resource Info */}
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-zinc-900 dark:text-white">
                {resource.name}
              </span>
              <span
                className={`text-sm px-2 py-0.5 rounded ${
                  resource.owned >= resource.needed
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}
              >
                {resource.owned >= resource.needed ? "Ampy" : "Tsy Ampy"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                Efa misy: <strong>{resource.owned}</strong>
              </span>
              <span>
                Ilaina: <strong>{resource.needed}</strong>
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (resource.owned / resource.needed) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Mbola ilaina:{" "}
              <strong>{Math.max(0, resource.needed - resource.owned)}</strong>
            </p>
          </div>

          {/* Contribution Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Isa holotra
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, resource.needed - resource.owned)}
                value={contribution.quantity}
                onChange={(e) =>
                  setContribution({
                    ...contribution,
                    quantity: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Hafatra (tsy voatery)
              </label>
              <textarea
                rows={3}
                value={contribution.message}
                onChange={(e) =>
                  setContribution({
                    ...contribution,
                    message: e.target.value,
                  })
                }
                placeholder="Anontanio na lazao ny fomba hanateranao azy..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            Hiverina
          </button>
          <button
            disabled={isSubmitting}
            onClick={onSubmit}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <CheckCircleIcon className="size-4" />
            )}
            Hanolotra
          </button>
        </div>
      </div>
    </div>
  );
}
