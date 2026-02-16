import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/api.js";
import toast from "react-hot-toast";
import { addTask, updateProjectProgress } from "../features/workspaceSlice.js";

export default function CreateTaskDialog({
  showCreateTask,
  setShowCreateTask,
  projectId,
}) {
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const currentWorkspace = useSelector(
    (state) => state.workspace?.currentWorkspace || null,
  );
  const project = currentWorkspace?.projects.find((p) => p.id === projectId);

  // Récupérer tous les membres du WORKSPACE (pas seulement du projet)
  const workspaceMembers = currentWorkspace?.members || [];

  console.log("🔍 Workspace:", currentWorkspace);
  console.log("🔍 Workspace Members:", workspaceMembers);
  console.log("🔍 Project:", project);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "TASK",
    status: "TODO",
    priority: "MEDIUM",
    assigneeId: "",
    due_date: "",
    objective: "",
    result: "",
    risk: "",
    keyFactor: "",
    keyFactorAcquired: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/tasks/",
        {
          ...formData,
          workspaceId: currentWorkspace.id,
          projectId,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setShowCreateTask(false);
      setFormData({
        title: "",
        description: "",
        type: "TASK",
        status: "TODO",
        priority: "MEDIUM",
        assigneeId: "",
        due_date: "",
        objective: "",
        result: "",
        risk: "",
        keyFactor: "",
        keyFactorAcquired: false,
      });
      toast.success(data.message);
      dispatch(addTask(data.task));
      
      // Update project progress
      if (data.projectProgress !== undefined) {
        dispatch(updateProjectProgress({
          projectId,
          progress: data.projectProgress,
        }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return showCreateTask ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-lg w-full max-w-md p-6 text-zinc-900 dark:text-white">
        <h2 className="text-xl font-bold mb-4">Hamorona Asa</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium">
              Lohateny
            </label>
            <input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Task title"
              className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              Mombamomba ilay asa
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the task"
              className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1"
              >
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="TASK">Task</option>
                <option value="IMPROVEMENT">Improvement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Assignee and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Asa ho an'i :</label>
              <select
                value={formData.assigneeId}
                onChange={(e) =>
                  setFormData({ ...formData, assigneeId: e.target.value })
                }
                className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1"
                required
              >
                <option value="">Tsy omena olona</option>
                {workspaceMembers && workspaceMembers.length > 0 ? (
                  workspaceMembers.map((member) => (
                    <option key={member?.user?.id} value={member?.user?.id}>
                      {member?.user?.name || member?.user?.email}
                    </option>
                  ))
                ) : (
                  <option disabled>Tsy misy mpikambana</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1"
              >
                <option value="TODO">Vao Ho Atao</option>
                <option value="IN_PROGRESS">Efa Mandeha</option>
                <option value="DONE">Efa Vita</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Due Date</label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-5 text-zinc-500 dark:text-zinc-400" />
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1"
              />
            </div>
            {formData.due_date && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {format(new Date(formData.due_date), "PPP")}
              </p>
            )}
          </div>

          {/* Objective - Tanjona */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Tanjona (Objectif)</label>
            <textarea
              value={formData.objective}
              onChange={(e) =>
                setFormData({ ...formData, objective: e.target.value })
              }
              placeholder="Inona no tanjona kendren'ity asa ity?"
              className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 h-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Result - Vokatra */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Vokatra (Résultat attendu)
            </label>
            <textarea
              value={formData.result}
              onChange={(e) =>
                setFormData({ ...formData, result: e.target.value })
              }
              placeholder="Inona no vokatra andrasana?"
              className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 h-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Risk - Loza */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Loza (Risque)</label>
            <textarea
              value={formData.risk}
              onChange={(e) =>
                setFormData({ ...formData, risk: e.target.value })
              }
              placeholder="Inona avy ireo loza mety hiseho?"
              className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 h-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Key Factor - Singa fototra */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Singa fototra (Facteur clé / Élément déclencheur)
            </label>
            <textarea
              value={formData.keyFactor}
              onChange={(e) =>
                setFormData({ ...formData, keyFactor: e.target.value })
              }
              placeholder="Inona no singa fototra na antony manosika?"
              className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 h-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.keyFactor && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.keyFactorAcquired}
                  onChange={(e) =>
                    setFormData({ ...formData, keyFactorAcquired: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Efa azo ny singa fototra (Déjà acquis)
                </span>
              </label>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateTask(false)}
              className="rounded border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Hiverina
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded px-5 py-2 text-sm bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white dark:text-zinc-200 transition"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
}
