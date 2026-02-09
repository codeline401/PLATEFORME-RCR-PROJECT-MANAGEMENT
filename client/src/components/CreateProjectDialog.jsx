import { useState } from "react";
import { XIcon } from "lucide-react";
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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.team_lead) {
        return toast.error("Azafady, mifidiana mpitarika ny tetikasa.");
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
    <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur flex items-center justify-center text-left z-50">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-lg text-zinc-900 dark:text-zinc-200 relative">
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
              {isSubmitting ? "Creating..." : "Create Project"}
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
