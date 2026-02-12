import { XIcon, TargetIcon, PlusIcon } from "lucide-react";

/**
 * Modal de création d'objectif
 */
export default function ObjectiveModal({
  objective,
  setObjective,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const handleClose = () => {
    setObjective({ name: "", description: "", result: "", risk: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md mx-4 border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <TargetIcon className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-medium text-zinc-900 dark:text-white">
              Hanampy Tanjona
            </h3>
          </div>
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
              value={objective.name}
              onChange={(e) =>
                setObjective({ ...objective, name: e.target.value })
              }
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
              placeholder="Inona no tanjona?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              Fanazavana
            </label>
            <textarea
              value={objective.description}
              onChange={(e) =>
                setObjective({ ...objective, description: e.target.value })
              }
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
              rows={2}
              placeholder="Fanazavana fanampiny..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-emerald-600 dark:text-emerald-400">
              Vokatra (Résultat attendu)
            </label>
            <textarea
              value={objective.result}
              onChange={(e) =>
                setObjective({ ...objective, result: e.target.value })
              }
              className="w-full px-3 py-2 rounded border border-emerald-300 dark:border-emerald-700 dark:bg-zinc-800 text-sm"
              rows={2}
              placeholder="Inona no vokatra andrasana?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-orange-600 dark:text-orange-400">
              Loza (Risques)
            </label>
            <textarea
              value={objective.risk}
              onChange={(e) =>
                setObjective({ ...objective, risk: e.target.value })
              }
              className="w-full px-3 py-2 rounded border border-orange-300 dark:border-orange-700 dark:bg-zinc-800 text-sm"
              rows={2}
              placeholder="Inona avy no loza mety hitranga?"
            />
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
            disabled={!objective.name.trim() || isSubmitting}
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
