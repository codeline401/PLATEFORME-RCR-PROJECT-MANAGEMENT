/**
 * Section des ressources matérielles
 */
export function MaterialResourcesSection({ resources, onContribute }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded p-4">
      <h3 className="text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">
        Fitaovana Ilaina
      </h3>
      {resources?.length > 0 ? (
        <ul className="space-y-2">
          {resources.map((res) => {
            const isComplete = res.owned >= res.needed;
            return (
              <li
                key={res.id}
                className="flex items-center justify-between text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2 gap-2"
              >
                <span className="flex-1">{res.name}</span>
                <span
                  className={`${isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}
                >
                  {res.owned}/{res.needed}
                </span>
                {isComplete ? (
                  <span className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    ✓ Feno
                  </span>
                ) : (
                  <button
                    onClick={() => onContribute(res)}
                    className="text-xs px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Hanolotra
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-zinc-500">Tsy misy fitaovana ilaina</p>
      )}
    </div>
  );
}

/**
 * Section des ressources humaines
 */
export function HumanResourcesSection({ resources, currentUserId, onParticipate }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded p-4">
      <h3 className="text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">
        Olona Ilaina
      </h3>
      {resources?.length > 0 ? (
        <ul className="space-y-2">
          {resources.map((res) => {
            const hasParticipated = res.participants?.some(
              (p) => p.participant?.id === currentUserId
            );
            const participantCount = res.participants?.length || 0;
            const neededCount = res.needed || 1;
            const isComplete = participantCount >= neededCount;

            return (
              <li
                key={res.id}
                className="flex flex-col gap-2 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex-1">{res.name}</span>
                  <span
                    className={`${isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}
                  >
                    {participantCount}/{neededCount}
                  </span>
                  {isComplete ? (
                    <span className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      ✓ Ampy
                    </span>
                  ) : hasParticipated ? (
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      ✓ Nirotsaka
                    </span>
                  ) : (
                    <button
                      onClick={() => onParticipate(res)}
                      className="text-xs px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      Handray anjara
                    </button>
                  )}
                </div>
                {participantCount > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="text-zinc-400">→</span>
                    {res.participants?.map((p, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1">
                        {p.participant?.image ? (
                          <img
                            src={p.participant.image}
                            alt={p.participant.name}
                            className="size-4 rounded-full object-cover"
                          />
                        ) : (
                          <span className="size-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[9px] text-emerald-600 dark:text-emerald-400">
                            {p.participant?.name?.charAt(0) || "?"}
                          </span>
                        )}
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {p.participant?.name?.split(" ")[0]}
                        </span>
                        {idx < res.participants.length - 1 && (
                          <span className="text-zinc-300 dark:text-zinc-600">,</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-zinc-500">Tsy misy olona ilaina</p>
      )}
    </div>
  );
}

/**
 * Section des ressources financières
 */
export function FinancialResourcesSection({
  resources,
  contributions,
  totalNeeded,
  totalOwned,
  remainingNeeded,
  onDonate,
}) {
  const approvedContributions = contributions.filter((c) => c.status === "APPROVED");
  const pendingContributions = contributions.filter((c) => c.status === "PENDING");

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded p-4">
      <h3 className="text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">
        Vola Ilaina
      </h3>
      {resources?.length > 0 ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Ilaina :</span>
            <span>{(totalNeeded || 0).toLocaleString()} Ar</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Efa Hanana:</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {(totalOwned || 0).toLocaleString()} Ar
            </span>
          </div>
          {remainingNeeded > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Mbola ilaina:</span>
              <span className="text-amber-600 dark:text-amber-400">
                {remainingNeeded.toLocaleString()} Ar
              </span>
            </div>
          )}

          {/* Approved contributions */}
          {approvedContributions.length > 0 && (
            <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                Voaray ({approvedContributions.length})
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {approvedContributions.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {donation.contributor?.name || "Mpikambana"}
                      </span>
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {(donation.amount || 0).toLocaleString()} Ar
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending contributions */}
          {pendingContributions.length > 0 && (
            <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">
                Miandry ({pendingContributions.length})
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {pendingContributions.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between text-xs bg-amber-50 dark:bg-amber-900/20 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500">⏳</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {donation.contributor?.name || "Mpikambana"}
                      </span>
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {(donation.amount || 0).toLocaleString()} Ar
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mt-2">
            <div
              className="bg-emerald-500 h-2 rounded-full"
              style={{
                width: `${Math.min(100, ((totalOwned || 0) / (totalNeeded || 1)) * 100)}%`,
              }}
            ></div>
          </div>
          <button
            onClick={onDonate}
            className="w-full mt-3 text-xs px-3 py-2 rounded bg-amber-500 hover:bg-amber-600 text-white font-medium"
          >
            Hanohana ara-bola
          </button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Tsy misy vola ilaina</p>
      )}
    </div>
  );
}
