import { TargetIcon, PlusIcon, TrashIcon } from "lucide-react";

/**
 * Section des objectifs du projet
 */
export default function ProjectObjectives({
  objectives = [],
  isProjectLead,
  canEditIndicator,
  onAddObjective,
  onToggleObjective,
  onDeleteObjective,
  onAddIndicator,
  onEditIndicator,
  onDeleteIndicator,
}) {
  const completedCount = objectives.filter((o) => o.isCompleted).length;
  const totalCount = objectives.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <TargetIcon className="size-4" />
          Tanjona (Objectifs)
        </h3>
        {isProjectLead && (
          <button
            onClick={onAddObjective}
            className="text-xs px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1"
          >
            <PlusIcon className="size-3" /> Hanampy
          </button>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Fandrosoana</span>
            <span>
              {completedCount}/{totalCount} vita
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Objectives list */}
      <div className="space-y-3">
        {objectives.map((obj) => (
          <ObjectiveItem
            key={obj.id}
            objective={obj}
            canEditIndicator={canEditIndicator}
            onToggle={() => onToggleObjective(obj.id)}
            onDelete={() => onDeleteObjective(obj.id)}
            onAddIndicator={() => onAddIndicator(obj.id)}
            onEditIndicator={onEditIndicator}
            onDeleteIndicator={onDeleteIndicator}
          />
        ))}

        {totalCount === 0 && (
          <p className="text-xs text-zinc-500 text-center py-4">Tsy misy tanjona</p>
        )}
      </div>
    </div>
  );
}

/**
 * Item d'un objectif individuel
 */
function ObjectiveItem({
  objective,
  canEditIndicator,
  onToggle,
  onDelete,
  onAddIndicator,
  onEditIndicator,
  onDeleteIndicator,
}) {
  return (
    <div
      className={`p-3 rounded border ${
        objective.isCompleted
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={objective.isCompleted}
          onChange={onToggle}
          className="mt-1 size-4 rounded accent-emerald-500"
        />
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium text-sm ${
              objective.isCompleted
                ? "line-through text-zinc-500"
                : "text-zinc-900 dark:text-white"
            }`}
          >
            {objective.name}
          </p>
          {objective.description && (
            <p className="text-xs text-zinc-500 mt-1">{objective.description}</p>
          )}
          {objective.result && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              <span className="font-medium">Vokatra:</span> {objective.result}
            </p>
          )}
          {objective.risk && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              <span className="font-medium">Loza:</span> {objective.risk}
            </p>
          )}

          {/* Indicators */}
          {objective.indicators && objective.indicators.length > 0 && (
            <IndicatorsList
              indicators={objective.indicators}
              canEdit={canEditIndicator}
              onEdit={onEditIndicator}
              onDelete={onDeleteIndicator}
            />
          )}

          {/* Add Indicator Button */}
          {canEditIndicator && (
            <button
              onClick={onAddIndicator}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <PlusIcon className="size-3" /> Hanampy mari-pandrefesana
            </button>
          )}
        </div>
        {canEditIndicator && (
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <TrashIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Liste des indicateurs d'un objectif
 */
function IndicatorsList({ indicators, canEdit, onEdit, onDelete }) {
  return (
    <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
        Mari-pandrefesana:
      </p>
      <div className="space-y-2">
        {indicators.map((ind) => {
          const progress =
            ind.target > 0 ? Math.min(100, (ind.current / ind.target) * 100) : 0;
          const isComplete = ind.current >= ind.target;

          return (
            <div key={ind.id} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-700 dark:text-zinc-300">{ind.name}</span>
                <div className="flex items-center gap-2">
                  <span className={isComplete ? "text-emerald-600" : "text-zinc-500"}>
                    {ind.current}/{ind.target} {ind.unit}
                  </span>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(ind)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                      >
                        Ovaina
                      </button>
                      <button
                        onClick={() => onDelete(ind.id)}
                        className="text-red-500 hover:text-red-700 p-0.5"
                      >
                        <TrashIcon className="size-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isComplete ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
