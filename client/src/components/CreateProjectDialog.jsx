import { useState } from "react";
import { XIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
// FIX: Importer addProject comme action (destructuré)
import { addProject } from "../features/workspaceSlice.js";
import api from "../configs/api.js";

const CreateProjectDialog = ({ isDialogOpen, setIsDialogOpen }) => {
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const { currentWorkspace } = useSelector((state) => state.workspace);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    start_date: "",
    end_date: "",
    team_members: [],
    team_lead: "",
    progress: 0,
    isPublic: false,
    // Ressources
    materialResources: [],
    humanResources: [],
    financialResources: { needed: 0, owned: 0 },
    objectives: [],
    treasurerName: "",
    treasurerPhone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.team_lead) {
        return toast.error("Azafady, mifidiana mpitarika ny tetikasa.");
      }
      const hasFinancialResource =
        (formData.financialResources?.needed || 0) > 0 ||
        (formData.financialResources?.owned || 0) > 0;
      if (hasFinancialResource) {
        if (!formData.treasurerName?.trim()) {
          return toast.error("Ampidiro ny anaran'ny mpitahiry vola.");
        }
        if (!formData.treasurerPhone?.trim()) {
          return toast.error("Ampidiro ny nomeraon-telefaona.");
        }
      }
      setIsSubmitting(true);

      // FIX: API call avec le bon chemin (/api/projects)
      const { data } = await api.post(
        "/api/projects",
        { workspaceId: currentWorkspace.id, ...formData },
        { headers: { Authorization: `Bearer ${await getToken()}` } },
      );

      // FIX: Utiliser data.project (structure correcte du serveur)
      console.log("✅ Project créé:", data.project);
      dispatch(addProject(data.project));

      // FIX: Réinitialiser le formulaire
      setFormData({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: "",
        end_date: "",
        team_members: [],
        team_lead: "",
        progress: 0,
        isPublic: false,
        materialResources: [],
        humanResources: [],
        financialResources: { needed: 0, owned: 0 },
        objectives: [],
        treasurerName: "",
        treasurerPhone: "",
      });

      setIsDialogOpen(false);
      toast.success("Tetikasa voaforina soa aman-tsara!"); // FIX: Message de succès
    } catch (error) {
      console.error("❌ Erreur création project:", error);
      toast.error(
        error?.response?.data?.message ||
          "Nisy zavatra tsy nety tamin'ny famoronana tetikasa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeTeamMember = (email) => {
    setFormData((prev) => ({
      ...prev,
      team_members: prev.team_members.filter((m) => m !== email),
    }));
  };

  if (!isDialogOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur flex items-center justify-center text-left z-50 p-4">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto text-zinc-900 dark:text-zinc-200 relative">
        <button
          className="absolute top-3 right-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          onClick={() => setIsDialogOpen(false)}
        >
          <XIcon className="size-5" />
        </button>

        <h2 className="text-xl font-medium mb-1">Hamorona Tetikasa</h2>
        {currentWorkspace && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Ato amin'ny Tranon'Asa:{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {currentWorkspace.name}
            </span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm mb-1">Anaran'ny Tetikasa</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Hampidiro eto ny anaran'ny tetikasa"
              className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm mb-1">
              Fanazavana ilay Tetikasa
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Velabelaro ny momba ny tetikasanao"
              className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm h-20"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              >
                <option value="PLANNING">Eo amin'ny Fandrafetana</option>
                <option value="ACTIVE">Efa Mandeha</option>
                <option value="COMPLETED">Efa vita</option>
                <option value="ON_HOLD">Mbola Miantona</option>
                <option value="CANCELLED">Nofoanana</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Daty Fanombohany</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Daty Hifaranany</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                min={
                  formData.start_date &&
                  new Date(formData.start_date).toISOString().split("T")[0]
                }
                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              />
            </div>
          </div>

          {/* Lead */}
          <div>
            <label className="block text-sm mb-1">Mpitarika ny Tetikasa</label>
            <select
              value={formData.team_lead}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  team_lead: e.target.value,
                  team_members: e.target.value
                    ? [...new Set([...formData.team_members, e.target.value])]
                    : formData.team_members,
                })
              }
              className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
            >
              <option value="">Tsy misy Mpitarika</option>
              {currentWorkspace?.members?.map((member) => (
                <option key={member.user.email} value={member.user.email}>
                  {member.user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-sm mb-1">Ekipa Mpikambana</label>
            <select
              className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              onChange={(e) => {
                if (
                  e.target.value &&
                  !formData.team_members.includes(e.target.value)
                ) {
                  setFormData((prev) => ({
                    ...prev,
                    team_members: [...prev.team_members, e.target.value],
                  }));
                }
              }}
            >
              <option value="">Ampiditra Mpikambana Ao Anaty Ekipa</option>
              {/* FIX: Utiliser member.user.email correctement */}
              {currentWorkspace?.members
                ?.filter(
                  (member) =>
                    !formData.team_members.includes(member.user.email),
                )
                .map((member) => (
                  <option key={member.user.email} value={member.user.email}>
                    {member.user.email}
                  </option>
                ))}
            </select>

            {formData.team_members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.team_members.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-1 bg-blue-200/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md text-sm"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeTeamMember(email)}
                      className="ml-1 hover:bg-blue-300/30 dark:hover:bg-blue-500/30 rounded"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                      { name: "", needed: "", owned: "" },
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
                  className="w-32 px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
                <input
                  type="number"
                  placeholder="Efa hananana"
                  value={mat.owned}
                  min={0}
                  onChange={(e) => {
                    const updated = [...formData.materialResources];
                    updated[idx].owned = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, materialResources: updated });
                  }}
                  className="w-32 px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
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
                    humanResources: [
                      ...formData.humanResources,
                      { name: "", needed: 1 },
                    ],
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
                <input
                  type="number"
                  placeholder="Isa"
                  min="1"
                  value={hr.needed || 1}
                  onChange={(e) => {
                    const updated = [...formData.humanResources];
                    updated[idx].needed = parseInt(e.target.value) || 1;
                    setFormData({ ...formData, humanResources: updated });
                  }}
                  className="w-16 px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm text-center"
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
                  value={formData.financialResources.needed}
                  min={0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      financialResources: {
                        ...formData.financialResources,
                        needed: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Efa eo (Ar)
                </label>
                <input
                  type="number"
                  value={formData.financialResources.owned}
                  min={0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      financialResources: {
                        ...formData.financialResources,
                        owned: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border border-zinc-300 dark:border-zinc-700 rounded p-3">
            <label className="block text-sm font-medium mb-2">
              Mpitahiry vola
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              Azonao atao ny mameno azy any aoriana raha tsy misy vola ilaina.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Anarana
                </label>
                <input
                  type="text"
                  value={formData.treasurerName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      treasurerName: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Nomeraon-telefaona
                </label>
                <input
                  type="tel"
                  value={formData.treasurerPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      treasurerPhone: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Objectives */}
          <div className="border border-zinc-300 dark:border-zinc-700 rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <div>
                <label className="block text-sm font-medium">Tanjona</label>
                <p className="text-xs text-zinc-500">
                  Azonao atao ny mameno azy any aoriana.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    objectives: [
                      ...formData.objectives,
                      { name: "", description: "", result: "", risk: "" },
                    ],
                  })
                }
                className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <PlusIcon className="size-3" /> Hanampy
              </button>
            </div>
            {formData.objectives.length === 0 && (
              <p className="text-xs text-zinc-500">Tsy misy tanjona</p>
            )}
            {formData.objectives.map((obj, idx) => (
              <div key={idx} className="space-y-2 mb-3">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Anaran'ny tanjona"
                    value={obj.name}
                    onChange={(e) => {
                      const updated = [...formData.objectives];
                      updated[idx].name = e.target.value;
                      setFormData({ ...formData, objectives: updated });
                    }}
                    className="flex-1 px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.objectives.filter(
                        (_, i) => i !== idx,
                      );
                      setFormData({ ...formData, objectives: updated });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Fanazavana (tsy voatery)"
                  value={obj.description}
                  onChange={(e) => {
                    const updated = [...formData.objectives];
                    updated[idx].description = e.target.value;
                    setFormData({ ...formData, objectives: updated });
                  }}
                  className="w-full px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
                <input
                  type="text"
                  placeholder="Vokatra andrasana (tsy voatery)"
                  value={obj.result}
                  onChange={(e) => {
                    const updated = [...formData.objectives];
                    updated[idx].result = e.target.value;
                    setFormData({ ...formData, objectives: updated });
                  }}
                  className="w-full px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
                <input
                  type="text"
                  placeholder="Loza mety hitranga (tsy voatery)"
                  value={obj.risk}
                  onChange={(e) => {
                    const updated = [...formData.objectives];
                    updated[idx].risk = e.target.value;
                    setFormData({ ...formData, objectives: updated });
                  }}
                  className="w-full px-2 py-1 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm"
                />
              </div>
            ))}
          </div>

          {/*Public/Private Toggle*/}
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
              <span className="font-medium">
                Atao Ho olon-drehetra (public)
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Ireo tsy Mpikambana RCR / T.OLO.N.A dia hahita ity tetikasa ity
                ihany koa
              </p>
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 text-sm">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              Hiverina
            </button>
            <button
              disabled={isSubmitting || !currentWorkspace}
              className="px-4 py-2 rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white dark:text-zinc-200"
            >
              {isSubmitting ? "Eo am-pamoronana..." : "Foronina ilay tetikasa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// - TODO
// - Possibility to create Project without lead (lead can be added later)

export default CreateProjectDialog;
