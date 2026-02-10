import { format } from "date-fns";
import {
  Plus,
  Save,
  PlusIcon,
  TrashIcon,
  PackageIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import AddProjectMember from "./AddProjectMember";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../configs/api.js";
import { fetchWorkspaces } from "../features/workspaceSlice.js";

export default function ProjectSettings({ project }) {
  const dispatch = useDispatch();
  // FIX: Destructurer correctement getToken depuis useAuth()
  const { getToken } = useAuth();

  // Récupérer l'utilisateur courant pour vérifier s'il est le lead
  const currentUser = useSelector((state) => state.workspace?.user);
  const isProjectLead = project?.team_lead === currentUser?.id;

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

  // État pour les contributions en attente
  const [pendingContributions, setPendingContributions] = useState([]);
  const [isLoadingContributions, setIsLoadingContributions] = useState(false);
  const [processingContributionId, setProcessingContributionId] =
    useState(null);

  // Charger les contributions en attente
  const fetchPendingContributions = async () => {
    if (!project?.id || !isProjectLead) return;

    setIsLoadingContributions(true);
    try {
      const token = await getToken();
      const { data } = await api.get(
        `/api/contributions/project/${project.id}?status=PENDING`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPendingContributions(data);
    } catch (error) {
      console.error("Erreur chargement contributions:", error);
    } finally {
      setIsLoadingContributions(false);
    }
  };

  // Approuver une contribution
  const handleApprove = async (contributionId) => {
    setProcessingContributionId(contributionId);
    try {
      const token = await getToken();
      await api.put(
        `/api/contributions/${contributionId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Contribution approuvée !");
      // Retirer de la liste et rafraîchir les données
      setPendingContributions((prev) =>
        prev.filter((c) => c.id !== contributionId),
      );
      // Rafraîchir les workspaces pour mettre à jour les ressources
      dispatch(fetchWorkspaces(token));
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Erreur lors de l'approbation",
      );
    } finally {
      setProcessingContributionId(null);
    }
  };

  // Rejeter une contribution
  const handleReject = async (contributionId) => {
    setProcessingContributionId(contributionId);
    try {
      const token = await getToken();
      await api.put(
        `/api/contributions/${contributionId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Contribution rejetée");
      setPendingContributions((prev) =>
        prev.filter((c) => c.id !== contributionId),
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erreur lors du rejet");
    } finally {
      setProcessingContributionId(null);
    }
  };

  // Charger les contributions au montage
  useEffect(() => {
    fetchPendingContributions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, isProjectLead]);

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
            {isSubmitting ? "Eo am-panovana..." : "Hovaina"}
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

        {/* Pending Contributions - Visible only for Lead */}
        {isProjectLead && (
          <div className={cardClasses}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <ClockIcon className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300">
                  Fanolorana Miandry
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Mila fankatoavanao
                </p>
              </div>
              {pendingContributions.length > 0 && (
                <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {pendingContributions.length}
                </span>
              )}
            </div>

            {isLoadingContributions ? (
              <div className="flex items-center justify-center py-8">
                <span className="size-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500 rounded-full animate-spin"></span>
              </div>
            ) : pendingContributions.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <PackageIcon className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tsy misy fanolorana miandry</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {pendingContributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
                  >
                    {/* Contributor Info */}
                    <div className="flex items-center gap-3 mb-2">
                      {contribution.contributor?.image ? (
                        <img
                          src={contribution.contributor.image}
                          alt={contribution.contributor.name}
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                          {contribution.contributor?.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {contribution.contributor?.name || "Inconnu"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(contribution.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Resource & Quantity */}
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <PackageIcon className="size-4 text-zinc-400" />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        <strong>{contribution.quantity}x</strong>{" "}
                        {contribution.resource?.name}
                      </span>
                    </div>

                    {/* Message if any */}
                    {contribution.message && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mb-3 pl-6">
                        "{contribution.message}"
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleApprove(contribution.id)}
                        disabled={processingContributionId === contribution.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                      >
                        {processingContributionId === contribution.id ? (
                          <span className="size-3 border border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                          <CheckIcon className="size-3.5" />
                        )}
                        Ekena
                      </button>
                      <button
                        onClick={() => handleReject(contribution.id)}
                        disabled={processingContributionId === contribution.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-50"
                      >
                        <XIcon className="size-3.5" />
                        Lavina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
