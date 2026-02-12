import { XIcon, UsersIcon, CheckCircleIcon } from "lucide-react";

/**
 * Modal de participation aux ressources humaines
 */
export default function HumanParticipationModal({
  resource,
  message,
  setMessage,
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
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <UsersIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-white">
                Firotsahana
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
          {/* Role Info */}
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="size-4 text-zinc-400" />
              <span className="font-medium text-zinc-900 dark:text-white">
                {resource.name}
              </span>
            </div>
            {resource.participants?.length > 0 && (
              <p className="text-xs text-zinc-500">
                {resource.participants.length} efa nandray ny andraikitra
              </p>
            )}
          </div>

          {/* Confirmation text */}
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              Raha manaiky ianao, dia hanjary mpikambana amin'ity tetikasa ity
              ary hahazo email fanamarinana.
            </p>
          </div>

          {/* Optional Message */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Hafatra (tsy voatery)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Lazao ny traikefanao na ny antony hirotsahanao..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
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
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <CheckCircleIcon className="size-4" />
            )}
            Manaiky
          </button>
        </div>
      </div>
    </div>
  );
}
