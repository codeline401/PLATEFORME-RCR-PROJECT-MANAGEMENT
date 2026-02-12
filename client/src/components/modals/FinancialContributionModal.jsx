import { XIcon } from "lucide-react";

/**
 * Modal de contribution financière
 */
export default function FinancialContributionModal({
  project,
  donation,
  setDonation,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md mx-4 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-white text-sm">
              Fanohanana ara-bola
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Azafady alefaso amin'ny nomeraon'ny mpitahiry vola.
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
              {project?.treasurerName || "Tsy misy anarana"} •{" "}
              {project?.treasurerPhone || "Tsy misy nomerao"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              Montant nalefa (Ar) *
            </label>
            <input
              type="number"
              min="1"
              value={donation.amount}
              onChange={(e) =>
                setDonation({ ...donation, amount: e.target.value })
              }
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              Reference transfert *
            </label>
            <input
              type="text"
              value={donation.reference}
              onChange={(e) =>
                setDonation({ ...donation, reference: e.target.value })
              }
              className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            Hiverina
          </button>
          <button
            disabled={isSubmitting}
            onClick={onSubmit}
            className="px-3 py-1.5 text-xs rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            {isSubmitting ? "Eo am-pandefasana..." : "Hamarina"}
          </button>
        </div>
      </div>
    </div>
  );
}
