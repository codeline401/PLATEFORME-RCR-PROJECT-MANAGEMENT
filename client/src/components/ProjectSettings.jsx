import { format } from "date-fns";
import { Plus, Save, PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import AddProjectMember from "./AddProjectMember";
import { useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../configs/api.js";
import { fetchWorkspaces } from "../features/workspaceSlice.js";

export default function ProjectSettings({ project }) {
  const dispatch = useDispatch();
  // FIX: Destructurer correctement getToken depuis useAuth()
  const { getToken } = useAuth();

  const [formData, setFormData] = useState({
    name: "New Website Launch",
    description: "Initial launch for new web platform.",
    status: "PLANNING",
    priority: "MEDIUM",
    start_date: "2025-09-10",
    end_date: "2025-10-15",
    progress: 30,
    isPublic: false,
    materialResources: [],
    humanResources: [],
    financialResources: [],
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    toast.loading("Eo ampanovana...");
    try {
      // FIX: Chemin API correct avec projectId en paramètre + le / au début
      console.log("📝 Envoi update project...");
      console.log("  projectId:", project.id);
      console.log("  formData:", formData);

      const url = `/api/projects/${project.id}`;
      console.log("  URL:", url);

      const { data } = await api.put(url, formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      console.log("✅ Réponse serveur:", data);
      toast.dismiss();
      toast.success(data.message || "Tetikasa voavao soa aman-tsara!");
      setIsDialogOpen(false);

      // FIX: Obtenir le token d'abord, puis l'envoyer à fetchWorkspaces
      const token = await getToken();
      dispatch(fetchWorkspaces(token));
    } catch (error) {
      console.error("❌ Erreur update project:", error);
      console.error("  Status:", error?.response?.status);
      console.error("  Data:", error?.response?.data);
      toast.dismissAll();
      toast.error(
        error?.response?.data?.message || "Failed to update project.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (project) {
      const formattedProject = {
        ...project,
        start_date: project.start_date
          ? new Date(project.start_date)
          : new Date(),
        end_date: project.end_date ? new Date(project.end_date) : new Date(),
        materialResources: project.materialResources || [],
        humanResources: project.humanResources || [],
        financialResources: project.financialResources || [],
      };
      setFormData(formattedProject);
    }
  }, [project]);

  const inputClasses =
    "w-full px-3 py-2 rounded mt-2 border text-sm dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300";

  const cardClasses =
    "rounded-lg border p-6 not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-300 dark:border-zinc-800";

  const labelClasses = "text-sm text-zinc-600 dark:text-zinc-400";

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Project Details */}
      <div className={cardClasses}>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">
          Mombamoban'ny Tetikasa
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className={labelClasses}>Anaran'ny Tetikasa</label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={inputClasses}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className={labelClasses}>Mombamomban'ny Tetikasa</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={inputClasses + " h-24"}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClasses}>Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className={inputClasses}
              >
                <option value="PLANNING">Eo ampandrafetana</option>
                <option value="ACTIVE">Efa Mandeha</option>
                <option value="ON_HOLD">Mbola Miantona</option>
                <option value="COMPLETED">Efa Vita</option>
                <option value="CANCELLED">Nofoanana</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={labelClasses}>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className={inputClasses}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClasses}>Daty Hanombohany</label>
              <input
                type="date"
                value={
                  formData.start_date
                    ? format(formData.start_date, "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    start_date: new Date(e.target.value),
                  })
                }
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>Daty Famaranana</label>
              <input
                type="date"
                value={format(formData.end_date, "yyyy-MM-dd")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    end_date: new Date(e.target.value),
                  })
                }
                className={inputClasses}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <label className={labelClasses}>
              Fizotran'ny Tetikasa: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progress}
              onChange={(e) =>
                setFormData({ ...formData, progress: Number(e.target.value) })
              }
              className="w-full accent-blue-500 dark:accent-blue-400"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) =>
                setFormData({ ...formData, isPublic: e.target.checked })
              }
              className="w-4 h-4 rounded"
            />
            <label htmlFor="isPublic" className="text-sm cursor-pointer">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Ireo Tsy mpikambana RCR / T.OLO.N.A dia hahita ity tetikasa ity
                ihany koa
              </span>
            </label>
          </div>

          {/* Ressources Matérielles */}
          <div className="border border-zinc-300 dark:border-zinc-700 rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">
                Fitaovana Ilaina
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    materialResources: [
                      ...formData.materialResources,
                      { name: "", needed: 1, owned: 0 },
                    ],
                  })
                }
                className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <PlusIcon className="size-3" /> Hanampy
              </button>
            </div>
            {formData.materialResources.length === 0 && (
              <p className="text-xs text-zinc-500">Tsy misy fitaovana ilaina</p>
            )}
            {formData.materialResources.map((mat, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  placeholder="Anaran'ny fitaovana"
                  value={mat.name}
                  onChange={(e) => {
                    const updated = [...formData.materialResources];
                    updated[idx].name = e.target.value;
                    setFormData({ ...formData, materialResources: updated });
                  }}
                  className="flex-1 px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
                <input
                  type="number"
                  placeholder="Ilaina"
                  value={mat.needed}
                  min={0}
                  onChange={(e) => {
                    const updated = [...formData.materialResources];
                    updated[idx].needed = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, materialResources: updated });
                  }}
                  className="w-16 px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
                <input
                  type="number"
                  placeholder="Efa eo"
                  value={mat.owned}
                  min={0}
                  onChange={(e) => {
                    const updated = [...formData.materialResources];
                    updated[idx].owned = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, materialResources: updated });
                  }}
                  className="w-16 px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = formData.materialResources.filter(
                      (_, i) => i !== idx,
                    );
                    setFormData({ ...formData, materialResources: updated });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Ressources Humaines */}
          <div className="border border-zinc-300 dark:border-zinc-700 rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Olona Ilaina</label>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    humanResources: [...formData.humanResources, { name: "" }],
                  })
                }
                className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <PlusIcon className="size-3" /> Hanampy
              </button>
            </div>
            {formData.humanResources.length === 0 && (
              <p className="text-xs text-zinc-500">Tsy misy olona ilaina</p>
            )}
            {formData.humanResources.map((hr, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  placeholder="Anaran'ny olona / Andraikitra"
                  value={hr.name}
                  onChange={(e) => {
                    const updated = [...formData.humanResources];
                    updated[idx].name = e.target.value;
                    setFormData({ ...formData, humanResources: updated });
                  }}
                  className="flex-1 px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = formData.humanResources.filter(
                      (_, i) => i !== idx,
                    );
                    setFormData({ ...formData, humanResources: updated });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Ressources Financières */}
          <div className="border border-zinc-300 dark:border-zinc-700 rounded p-3">
            <label className="block text-sm font-medium mb-2">
              Vola Ilaina
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Tokony ho eo (Ar)
                </label>
                <input
                  type="number"
                  value={formData.financialResources?.[0]?.amount || 0}
                  min={0}
                  onChange={(e) => {
                    const current = formData.financialResources?.[0] || {
                      amount: 0,
                      owned: 0,
                    };
                    setFormData({
                      ...formData,
                      financialResources: [
                        { ...current, amount: parseFloat(e.target.value) || 0 },
                      ],
                    });
                  }}
                  className="w-full px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Efa eo (Ar)
                </label>
                <input
                  type="number"
                  value={formData.financialResources?.[0]?.owned || 0}
                  min={0}
                  onChange={(e) => {
                    const current = formData.financialResources?.[0] || {
                      amount: 0,
                      owned: 0,
                    };
                    setFormData({
                      ...formData,
                      financialResources: [
                        { ...current, owned: parseFloat(e.target.value) || 0 },
                      ],
                    });
                  }}
                  className="w-full px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto flex items-center text-sm justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded"
          >
            <Save className="size-4" />{" "}
            {isSubmitting ? "Eo am-panovana" : "Hovaina"}
          </button>
        </form>
      </div>

      {/* Team Members */}
      <div className="space-y-6">
        <div className={cardClasses}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">
              Ekipa Mpikambana{" "}
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                ({project.members.length})
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Plus className="size-4 text-zinc-900 dark:text-zinc-300" />
            </button>
            <AddProjectMember
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
            />
          </div>

          {/* Member List */}
          {project.members.length > 0 && (
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {project.members.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 rounded dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-300"
                >
                  <span> {member?.user?.email || "Unknown"} </span>
                  {project.team_lead === member.user.id && (
                    <span className="px-2 py-0.5 rounded-xs ring ring-zinc-200 dark:ring-zinc-600">
                      Mpitarika ny Ekipa
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
