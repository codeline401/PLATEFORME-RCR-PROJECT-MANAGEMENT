import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusIcon,
  SettingsIcon,
  BarChart3Icon,
  CalendarIcon,
  FileStackIcon,
  ZapIcon,
  FileDown,
} from "lucide-react";

// Components
import ProjectAnalytics from "../components/ProjectAnalytics";
import ProjectSettings from "../components/ProjectSettings";
import CreateTaskDialog from "../components/CreateTaskDialog";
import ProjectCalendar from "../components/ProjectCalendar";
import ProjectTasks from "../components/ProjectTasks";
import ProjectObjectives from "../components/ProjectObjectives";
import {
  MaterialResourcesSection,
  HumanResourcesSection,
  FinancialResourcesSection,
} from "../components/ProjectResources";
import {
  MaterialContributionModal,
  FinancialContributionModal,
  HumanParticipationModal,
  ObjectiveModal,
  IndicatorModal,
  EditIndicatorModal,
} from "../components/modals";

// Hooks
import {
  useProjectDetails,
  useObjectives,
  useIndicators,
  useContributions,
} from "../hooks/useProjectDetails";
import { generateProjectPdf } from "../utils/generateProjectPdf";

// Status colors constant
const statusColors = {
  PLANNING: "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-200",
  ACTIVE:
    "bg-emerald-200 text-emerald-900 dark:bg-emerald-500 dark:text-emerald-900",
  ON_HOLD: "bg-amber-200 text-amber-900 dark:bg-amber-500 dark:text-amber-900",
  COMPLETED: "bg-blue-200 text-blue-900 dark:bg-blue-500 dark:text-blue-900",
  CANCELLED: "bg-red-200 text-red-900 dark:bg-red-500 dark:text-red-900",
};

export default function ProjectDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab");
  const id = searchParams.get("id");

  // Custom hooks for data and logic
  const {
    project,
    tasks,
    financialContributions,
    setFinancialContributions,
    materialContributions,
    currentUserId,
    isProjectLead,
    canEditIndicator,
    totalFinancialNeeded,
    totalFinancialOwned,
    remainingFinancialNeeded,
    getToken,
    refreshData,
  } = useProjectDetails(id);

  const {
    createObjective,
    toggleObjective,
    deleteObjective,
    isSubmitting: isSubmittingObjective,
  } = useObjectives(getToken, refreshData);

  const {
    createIndicator,
    updateIndicatorValue,
    deleteIndicator,
    isSubmitting: isSubmittingIndicator,
  } = useIndicators(getToken, refreshData);

  const {
    submitMaterialContribution,
    submitFinancialContribution,
    submitHumanParticipation,
    isSubmittingMaterial,
    isSubmittingFinancial,
    isSubmittingHuman,
  } = useContributions(id, getToken, refreshData);

  // Local UI state
  const [activeTab, setActiveTab] = useState(tab || "tasks");
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Material contribution state
  const [selectedMaterialResource, setSelectedMaterialResource] =
    useState(null);
  const [materialContribution, setMaterialContribution] = useState({
    quantity: 1,
    message: "",
  });

  // Financial contribution state
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [financialDonation, setFinancialDonation] = useState({
    amount: "",
    reference: "",
  });

  // Human participation state
  const [selectedHumanResource, setSelectedHumanResource] = useState(null);
  const [humanParticipationMessage, setHumanParticipationMessage] =
    useState("");

  // Objective state
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [newObjective, setNewObjective] = useState({
    name: "",
    description: "",
    result: "",
    risk: "",
  });

  // Indicator state
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [selectedObjectiveForIndicator, setSelectedObjectiveForIndicator] =
    useState(null);
  const [newIndicator, setNewIndicator] = useState({
    name: "",
    target: 0,
    unit: "",
  });
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [indicatorDraft, setIndicatorDraft] = useState(0);

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleCreateObjective = async () => {
    const success = await createObjective(project.id, newObjective);
    if (success) {
      setShowObjectiveModal(false);
      setNewObjective({ name: "", description: "", result: "", risk: "" });
    }
  };

  const handleCreateIndicator = async () => {
    const success = await createIndicator(
      selectedObjectiveForIndicator,
      newIndicator,
    );
    if (success) {
      setShowIndicatorModal(false);
      setNewIndicator({ name: "", target: 0, unit: "" });
      setSelectedObjectiveForIndicator(null);
    }
  };

  const handleMaterialSubmit = async () => {
    const success = await submitMaterialContribution(
      selectedMaterialResource.id,
      materialContribution.quantity,
      materialContribution.message,
    );
    if (success) {
      setSelectedMaterialResource(null);
      setMaterialContribution({ quantity: 1, message: "" });
    }
  };

  const handleFinancialSubmit = async () => {
    const success = await submitFinancialContribution(
      parseFloat(financialDonation.amount),
      financialDonation.reference,
      setFinancialContributions,
    );
    if (success) {
      setFinancialDonation({ amount: "", reference: "" });
      setShowFinancialModal(false);
    }
  };

  const handleHumanSubmit = async () => {
    const success = await submitHumanParticipation(
      selectedHumanResource.id,
      humanParticipationMessage,
    );
    if (success) {
      setSelectedHumanResource(null);
      setHumanParticipationMessage("");
    }
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

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

  // ============================================================
  // MAIN RENDER
  // ============================================================

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
              className={`px-2 py-1 rounded text-xs capitalize ${statusColors[project.status]}`}
            >
              {project.status.replace("_", " ")}
            </span>
          </div>
        </div>
        {project?.progress === 100 && (
          <button
            onClick={() => generateProjectPdf(project, { financialContributions, materialContributions })}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileDown size={18} />
            Exporter PDF
          </button>
        )}
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

      {/* Stats Cards */}
      <StatsCards tasks={tasks} members={project.members} />

      {/* Resources Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <MaterialResourcesSection
          resources={project.materialResources}
          onContribute={(res) => {
            setSelectedMaterialResource(res);
            setMaterialContribution({ quantity: 1, message: "" });
          }}
        />
        <HumanResourcesSection
          resources={project.humanResources}
          currentUserId={currentUserId}
          onParticipate={(res) => {
            setSelectedHumanResource(res);
            setHumanParticipationMessage("");
          }}
        />
        <FinancialResourcesSection
          resources={project.financialResources}
          contributions={financialContributions}
          totalNeeded={totalFinancialNeeded}
          totalOwned={totalFinancialOwned}
          remainingNeeded={remainingFinancialNeeded}
          onDonate={() => setShowFinancialModal(true)}
        />
      </div>

      {/* Objectives */}
      <ProjectObjectives
        objectives={project.objectives || []}
        isProjectLead={isProjectLead}
        canEditIndicator={canEditIndicator}
        onAddObjective={() => setShowObjectiveModal(true)}
        onToggleObjective={toggleObjective}
        onDeleteObjective={deleteObjective}
        onAddIndicator={(objId) => {
          setSelectedObjectiveForIndicator(objId);
          setShowIndicatorModal(true);
        }}
        onEditIndicator={(ind) => {
          setSelectedIndicator(ind);
          setIndicatorDraft(ind.current);
        }}
        onDeleteIndicator={deleteIndicator}
      />

      {/* Tabs */}
      <TabsSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSearchParams={setSearchParams}
        id={id}
        tasks={tasks}
        project={project}
      />

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {showCreateTask && (
        <CreateTaskDialog
          showCreateTask={showCreateTask}
          setShowCreateTask={setShowCreateTask}
          projectId={id}
        />
      )}

      <MaterialContributionModal
        resource={selectedMaterialResource}
        contribution={materialContribution}
        setContribution={setMaterialContribution}
        onClose={() => setSelectedMaterialResource(null)}
        onSubmit={handleMaterialSubmit}
        isSubmitting={isSubmittingMaterial}
      />

      {showFinancialModal && (
        <FinancialContributionModal
          project={project}
          donation={financialDonation}
          setDonation={setFinancialDonation}
          onClose={() => setShowFinancialModal(false)}
          onSubmit={handleFinancialSubmit}
          isSubmitting={isSubmittingFinancial}
        />
      )}

      <HumanParticipationModal
        resource={selectedHumanResource}
        message={humanParticipationMessage}
        setMessage={setHumanParticipationMessage}
        onClose={() => setSelectedHumanResource(null)}
        onSubmit={handleHumanSubmit}
        isSubmitting={isSubmittingHuman}
      />

      {showObjectiveModal && (
        <ObjectiveModal
          objective={newObjective}
          setObjective={setNewObjective}
          onClose={() => {
            setShowObjectiveModal(false);
            setNewObjective({
              name: "",
              description: "",
              result: "",
              risk: "",
            });
          }}
          onSubmit={handleCreateObjective}
          isSubmitting={isSubmittingObjective}
        />
      )}

      {showIndicatorModal && (
        <IndicatorModal
          indicator={newIndicator}
          setIndicator={setNewIndicator}
          onClose={() => {
            setShowIndicatorModal(false);
            setNewIndicator({ name: "", target: 0, unit: "" });
            setSelectedObjectiveForIndicator(null);
          }}
          onSubmit={handleCreateIndicator}
          isSubmitting={isSubmittingIndicator}
        />
      )}

      {selectedIndicator && (
        <EditIndicatorModal
          indicator={selectedIndicator}
          value={indicatorDraft}
          setValue={setIndicatorDraft}
          onClose={() => setSelectedIndicator(null)}
          onSubmit={() => {
            updateIndicatorValue(selectedIndicator.id, indicatorDraft);
            setSelectedIndicator(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatsCards({ tasks, members }) {
  const cards = [
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
      value: members?.length || 0,
      color: "text-blue-700 dark:text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:flex flex-wrap gap-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex justify-between sm:min-w-60 p-4 py-2.5 rounded"
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
  );
}

function TabsSection({
  activeTab,
  setActiveTab,
  setSearchParams,
  id,
  tasks,
  project,
}) {
  const tabs = [
    { key: "tasks", label: "Asa", icon: FileStackIcon },
    { key: "calendar", label: "Tetiandro", icon: CalendarIcon },
    { key: "analytics", label: "Analytics", icon: BarChart3Icon },
    { key: "settings", label: "Hikirakira", icon: SettingsIcon },
  ];

  return (
    <div>
      <div className="inline-flex flex-wrap max-sm:grid grid-cols-3 gap-2 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => {
              setActiveTab(tabItem.key);
              setSearchParams({ id, tab: tabItem.key });
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
          <div className="dark:bg-zinc-900/40 rounded max-w-6xl">
            <ProjectTasks tasks={tasks} />
          </div>
        )}
        {activeTab === "analytics" && (
          <div className="dark:bg-zinc-900/40 rounded max-w-6xl">
            <ProjectAnalytics tasks={tasks} project={project} />
          </div>
        )}
        {activeTab === "calendar" && (
          <div className="dark:bg-zinc-900/40 rounded max-w-6xl">
            <ProjectCalendar tasks={tasks} />
          </div>
        )}
        {activeTab === "settings" && (
          <div className="dark:bg-zinc-900/40 rounded max-w-6xl">
            <ProjectSettings project={project} />
          </div>
        )}
      </div>
    </div>
  );
}
