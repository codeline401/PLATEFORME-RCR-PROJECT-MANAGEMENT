import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../configs/api.js";
import { fetchWorkspaces } from "../features/workspaceSlice.js";
import {
  ArrowLeftIcon,
  PlusIcon,
  SettingsIcon,
  BarChart3Icon,
  CalendarIcon,
  FileStackIcon,
  ZapIcon,
  XIcon,
  PackageIcon,
  CheckCircleIcon,
  UsersIcon,
} from "lucide-react";
import ProjectAnalytics from "../components/ProjectAnalytics";
import ProjectSettings from "../components/ProjectSettings";
import CreateTaskDialog from "../components/CreateTaskDialog";
import ProjectCalendar from "../components/ProjectCalendar";
import ProjectTasks from "../components/ProjectTasks";

export default function ProjectDetail() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const id = searchParams.get("id");

  const navigate = useNavigate();
  const projects = useSelector(
    (state) => state?.workspace?.currentWorkspace?.projects || [],
  );

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeTab, setActiveTab] = useState(tab || "tasks");
  const [selectedMaterialResource, setSelectedMaterialResource] =
    useState(null);
  const [materialContribution, setMaterialContribution] = useState({
    quantity: 1,
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Human resource participation state
  const [selectedHumanResource, setSelectedHumanResource] = useState(null);
  const [humanParticipationMessage, setHumanParticipationMessage] =
    useState("");
  const [isSubmittingHuman, setIsSubmittingHuman] = useState(false);

  // Get current workspace to find current user ID
  const currentWorkspace = useSelector(
    (state) => state.workspace?.currentWorkspace,
  );
  const currentMember = currentWorkspace?.members?.find(
    (m) => m.user?.email === user?.primaryEmailAddress?.emailAddress,
  );
  const currentUserId = currentMember?.user?.id;

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    if (projects && projects.length > 0) {
      const proj = projects.find((p) => p.id === id);
      setProject(proj);
      setTasks(proj?.tasks || []);
    }
  }, [id, projects]);

  const statusColors = {
    PLANNING: "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-200",
    ACTIVE:
      "bg-emerald-200 text-emerald-900 dark:bg-emerald-500 dark:text-emerald-900",
    ON_HOLD:
      "bg-amber-200 text-amber-900 dark:bg-amber-500 dark:text-amber-900",
    COMPLETED: "bg-blue-200 text-blue-900 dark:bg-blue-500 dark:text-blue-900",
    CANCELLED: "bg-red-200 text-red-900 dark:bg-red-500 dark:text-red-900",
  };

  if (!project) {
    return (
      <div className="p-6 text-center text-zinc-900 dark:text-zinc-200">
        <p className="text-3xl md:text-5xl mt-40 mb-10">
          Tsy Hita Ilay Tetikasa
        </p>
        <button
          onClick={() => navigate("/projects")}
          className="mt-4 px-4 py-2 rounded bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
        >
          Hiverina any amin'ny Tetikasa
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto text-zinc-900 dark:text-white">
      {/* Header */}
      <div className="flex max-md:flex-col gap-4 flex-wrap items-start justify-between max-w-6xl">
        <div className="flex items-center gap-4">
          <button
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium">{project.name}</h1>
            <span
              className={`px-2 py-1 rounded text-xs capitalize ${
                statusColors[project.status]
              }`}
            >
              {project.status.replace("_", " ")}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowCreateTask(true)}
          className="flex items-center gap-2 px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white"
        >
          <PlusIcon className="size-4" />
          Asa Vaovao
        </button>
      </div>

      {/* Description */}
      <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Famaritana
      </label>
      {project.description && (
        <div className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {project.description}
          </p>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:flex flex-wrap gap-6">
        {[
          {
            label: "Totalin'ny Asa",
            value: tasks.length,
            color: "text-zinc-900 dark:text-white",
          },
          {
            label: "Vita",
            value: tasks.filter((t) => t.status === "DONE").length,
            color: "text-emerald-700 dark:text-emerald-400",
          },
          {
            label: "Efa Mandeha",
            value: tasks.filter(
              (t) => t.status === "IN_PROGRESS" || t.status === "TODO",
            ).length,
            color: "text-amber-700 dark:text-amber-400",
          },
          {
            label: "Mpikambana ao amin'ny Ekipa",
            value: project.members?.length || 0,
            color: "text-blue-700 dark:text-blue-400",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className=" dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex justify-between sm:min-w-60 p-4 py-2.5 rounded"
          >
            <div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {card.label}
              </div>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </div>
            <ZapIcon className={`size-4 ${card.color}`} />
          </div>
        ))}
      </div>

      {/* Resources Section */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Ressources Matérielles */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded p-4">
          <h3 className="text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">
            Fitaovana Ilaina
          </h3>
          {project.materialResources?.length > 0 ? (
            <ul className="space-y-2">
              {project.materialResources.map((res) => {
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
                        onClick={() => {
                          setSelectedMaterialResource(res);
                          setMaterialContribution({ quantity: 1, message: "" });
                        }}
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

        {/* Ressources Humaines */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded p-4">
          <h3 className="text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">
            Olona Ilaina
          </h3>
          {project.humanResources?.length > 0 ? (
            <ul className="space-y-2">
              {project.humanResources.map((res) => {
                const hasParticipated = res.participants?.some(
                  (p) => p.participant?.id === currentUserId,
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
                      <span className={`${isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}>
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
                          onClick={() => {
                            setSelectedHumanResource(res);
                            setHumanParticipationMessage("");
                          }}
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
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1"
                          >
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
                              <span className="text-zinc-300 dark:text-zinc-600">
                                ,
                              </span>
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

        {/* Ressources Financières */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded p-4">
          <h3 className="text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">
            Vola Ilaina
          </h3>
          {project.financialResources?.length > 0 ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Ilaina :</span>
                <span>
                  {project.financialResources
                    .reduce((acc, r) => acc + r.amount, 0)
                    .toLocaleString()}{" "}
                  Ar
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Efa Hanana:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {project.financialResources
                    .reduce((acc, r) => acc + r.owned, 0)
                    .toLocaleString()}{" "}
                  Ar
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mt-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (project.financialResources.reduce(
                        (acc, r) => acc + r.owned,
                        0,
                      ) /
                        project.financialResources.reduce(
                          (acc, r) => acc + r.amount,
                          0,
                        )) *
                        100 || 0,
                    )}%`,
                  }}
                ></div>
              </div>
              <button className="w-full mt-3 text-xs px-3 py-2 rounded bg-amber-500 hover:bg-amber-600 text-white font-medium">
                Hanohana ara-bola
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Tsy misy vola ilaina</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="inline-flex flex-wrap max-sm:grid grid-cols-3 gap-2 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
          {[
            { key: "tasks", label: "Asa", icon: FileStackIcon },
            { key: "calendar", label: "Tetiandro", icon: CalendarIcon },
            { key: "analytics", label: "Analytics", icon: BarChart3Icon },
            { key: "settings", label: "Hikirakira", icon: SettingsIcon },
          ].map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => {
                setActiveTab(tabItem.key);
                setSearchParams({ id: id, tab: tabItem.key });
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-all ${
                activeTab === tabItem.key
                  ? "bg-zinc-100 dark:bg-zinc-800/80"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              <tabItem.icon className="size-3.5" />
              {tabItem.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "tasks" && (
            <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
              <ProjectTasks tasks={tasks} />
            </div>
          )}
          {activeTab === "analytics" && (
            <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
              <ProjectAnalytics tasks={tasks} project={project} />
            </div>
          )}
          {activeTab === "calendar" && (
            <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
              <ProjectCalendar tasks={tasks} />
            </div>
          )}
          {activeTab === "settings" && (
            <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
              <ProjectSettings project={project} />
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskDialog
          showCreateTask={showCreateTask}
          setShowCreateTask={setShowCreateTask}
          projectId={id}
        />
      )}

      {/* Material Resource Contribution Dialog */}
      {selectedMaterialResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md mx-4 border border-zinc-200 dark:border-zinc-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <PackageIcon className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-white">
                    Fanolorana Fitaovana
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Handray anjara amin'ity tetikasa ity
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMaterialResource(null)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Resource Info */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {selectedMaterialResource.name}
                  </span>
                  <span
                    className={`text-sm px-2 py-0.5 rounded ${
                      selectedMaterialResource.owned >=
                      selectedMaterialResource.needed
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {selectedMaterialResource.owned >=
                    selectedMaterialResource.needed
                      ? "Ampy"
                      : "Tsy Ampy"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                  <span>
                    Efa misy: <strong>{selectedMaterialResource.owned}</strong>
                  </span>
                  <span>
                    Ilaina: <strong>{selectedMaterialResource.needed}</strong>
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (selectedMaterialResource.owned / selectedMaterialResource.needed) * 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Mbola ilaina:{" "}
                  <strong>
                    {Math.max(
                      0,
                      selectedMaterialResource.needed -
                        selectedMaterialResource.owned,
                    )}
                  </strong>
                </p>
              </div>

              {/* Contribution Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Isa holotra
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(
                      1,
                      selectedMaterialResource.needed -
                        selectedMaterialResource.owned,
                    )}
                    value={materialContribution.quantity}
                    onChange={(e) =>
                      setMaterialContribution({
                        ...materialContribution,
                        quantity: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Hafatra (tsy voatery)
                  </label>
                  <textarea
                    rows={3}
                    value={materialContribution.message}
                    onChange={(e) =>
                      setMaterialContribution({
                        ...materialContribution,
                        message: e.target.value,
                      })
                    }
                    placeholder="Anontanio na lazao ny fomba hanateranao azy..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setSelectedMaterialResource(null)}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                Hiverina
              </button>
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const token = await getToken();
                    const { data } = await api.post(
                      "/api/contributions/material",
                      {
                        resourceId: selectedMaterialResource.id,
                        projectId: id,
                        quantity: materialContribution.quantity,
                        message: materialContribution.message || null,
                      },
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    // Message différent selon si auto-approuvé ou en attente
                    if (data.autoApproved) {
                      toast.success("Voatahiry ny fanampiana natolotrao!");
                      // Rafraîchir les données car auto-approuvé
                      dispatch(fetchWorkspaces(token));
                    } else {
                      toast.success(
                        "Lasa ilay fangatahana hanampy. Miandry ny fankatoavan'ny mpandrindra ny tetikasa.",
                      );
                    }
                    setSelectedMaterialResource(null);
                    setMaterialContribution({ quantity: 1, message: "" });
                  } catch (error) {
                    toast.error(
                      error?.response?.data?.message || "Nisy olana nitranga",
                    );
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <CheckCircleIcon className="size-4" />
                )}
                Hanolotra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human Resource Participation Dialog */}
      {selectedHumanResource && (
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
                onClick={() => setSelectedHumanResource(null)}
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
                    {selectedHumanResource.name}
                  </span>
                </div>
                {selectedHumanResource.participants?.length > 0 && (
                  <p className="text-xs text-zinc-500">
                    {selectedHumanResource.participants.length} efa nandray ny
                    andraikitra
                  </p>
                )}
              </div>

              {/* Confirmation text */}
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <p>
                  Raha manaiky ianao, dia hanjary mpikambana amin'ity tetikasa
                  ity ary hahazo email fanamarinana.
                </p>
              </div>

              {/* Optional Message */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Hafatra (tsy voatery)
                </label>
                <textarea
                  rows={3}
                  value={humanParticipationMessage}
                  onChange={(e) => setHumanParticipationMessage(e.target.value)}
                  placeholder="Lazao ny traikefanao na ny antony hirotsahanao..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setSelectedHumanResource(null)}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                Hanafoana
              </button>
              <button
                disabled={isSubmittingHuman}
                onClick={async () => {
                  setIsSubmittingHuman(true);
                  try {
                    const token = await getToken();
                    await api.post(
                      "/api/contributions/human",
                      {
                        resourceId: selectedHumanResource.id,
                        projectId: id,
                        message: humanParticipationMessage || null,
                      },
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    toast.success(
                      "Voatahiry ny firotsahanao! Hahazo email fanamarinana ianao.",
                    );
                    setSelectedHumanResource(null);
                    setHumanParticipationMessage("");
                    // Refresh workspace data
                    dispatch(fetchWorkspaces(token));
                  } catch (error) {
                    toast.error(
                      error?.response?.data?.message || "Nisy olana nitranga",
                    );
                  } finally {
                    setIsSubmittingHuman(false);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingHuman ? (
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <CheckCircleIcon className="size-4" />
                )}
                Manaiky
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// TODO
// - Add project description in the header - OK
// - Add Ressources needed for the project : - OK
// - Participation feature from user, guest,
// - Confirmation bouton within participation ressources
// - Send email to project (lead, creator) when someone filled his participation form

// - Add objectif section
// - Add results section
// - Add Risk section
// - Facteur clé || élément déclencheur

// - Add Stat foeach Task
// - Recup taskStat to update Project Stat in real time

// - Add discussion section for each project
