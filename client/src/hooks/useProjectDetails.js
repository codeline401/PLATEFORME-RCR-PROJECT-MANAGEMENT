import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../configs/api.js";
import { fetchWorkspaces } from "../features/workspaceSlice.js";
import toast from "react-hot-toast";

/**
 * Custom hook pour gérer l'état et la logique de ProjectDetails
 * @param {string} projectId - ID du projet
 * @returns {Object} - État et fonctions du projet
 */
export const useProjectDetails = (projectId) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const dispatch = useDispatch();

  // Project state
  const projects = useSelector(
    (state) => state?.workspace?.currentWorkspace?.projects || []
  );
  const currentWorkspace = useSelector(
    (state) => state.workspace?.currentWorkspace
  );

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [financialContributions, setFinancialContributions] = useState([]);
  const [materialContributions, setMaterialContributions] = useState([]);

  // Current user info
  const currentMember = currentWorkspace?.members?.find(
    (m) => m.user?.email === user?.primaryEmailAddress?.emailAddress
  );
  const currentUserId = currentMember?.user?.id;

  // Permissions
  const isProjectLead = project?.team_lead === currentUserId;
  const isWorkspaceAdmin = currentMember?.role === "ADMIN";
  const isOrgAdmin = ["ADMIN", "org:admin"].includes(
    currentMember?.user?.role || ""
  );
  const isAdmin = isWorkspaceAdmin || isOrgAdmin;
  const canEditIndicator = isProjectLead || isAdmin;

  // Load project from store
  useEffect(() => {
    if (projects && projects.length > 0) {
      const proj = projects.find((p) => p.id === projectId);
      setProject(proj);
      setTasks(proj?.tasks || []);
    }
  }, [projectId, projects]);

  // Load financial contributions
  useEffect(() => {
    const loadFinancialContributions = async () => {
      if (!projectId) return;
      try {
        const token = await getToken();
        const { data } = await api.get(
          `/api/contributions/financial/project/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFinancialContributions(data || []);
      } catch (error) {
        console.error("Erreur contributions financières:", error);
      }
    };
    loadFinancialContributions();
  }, [getToken, projectId]);

  // Load material contributions
  useEffect(() => {
    const loadMaterialContributions = async () => {
      if (!projectId) return;
      try {
        const token = await getToken();
        const { data } = await api.get(
          `/api/contributions/project/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMaterialContributions(data || []);
      } catch (error) {
        console.error("Erreur contributions matérielles:", error);
      }
    };
    loadMaterialContributions();
  }, [getToken, projectId]);

  // Financial calculations
  const totalFinancialNeeded = project?.financialResources?.reduce(
    (acc, r) => acc + (r.amount || 0),
    0
  );
  const totalFinancialOwned = project?.financialResources?.reduce(
    (acc, r) => acc + (r.owned || 0),
    0
  );
  const totalFinancialPending = financialContributions
    .filter((c) => c.status === "PENDING")
    .reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const remainingFinancialNeeded = Math.max(
    0,
    (totalFinancialNeeded || 0) -
      (totalFinancialOwned || 0) -
      totalFinancialPending
  );

  // Refresh function
  const refreshData = async () => {
    const token = await getToken();
    dispatch(fetchWorkspaces(token));
  };

  return {
    project,
    tasks,
    financialContributions,
    setFinancialContributions,
    materialContributions,
    setMaterialContributions,
    currentUserId,
    isProjectLead,
    isAdmin,
    canEditIndicator,
    totalFinancialNeeded,
    totalFinancialOwned,
    totalFinancialPending,
    remainingFinancialNeeded,
    getToken,
    refreshData,
  };
};

/**
 * Hook pour gérer les objectifs
 */
export const useObjectives = (getToken, refreshData) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createObjective = async (projectId, objectiveData) => {
    if (!objectiveData.name.trim()) return false;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.post(`/api/objectives/project/${projectId}`, objectiveData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Tanjona voasoratra");
      await refreshData();
      return true;
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Tsy nahomby");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleObjective = async (objectiveId) => {
    try {
      const token = await getToken();
      await api.put(
        `/api/objectives/${objectiveId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshData();
    } catch (error) {
      console.error("Erreur toggle:", error);
      toast.error("Tsy nahomby");
    }
  };

  const deleteObjective = async (objectiveId) => {
    if (!confirm("Hofafana ve ity tanjona ity?")) return;

    try {
      const token = await getToken();
      await api.delete(`/api/objectives/${objectiveId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Tanjona voafafa");
      await refreshData();
    } catch (error) {
      console.error("Erreur delete:", error);
      toast.error("Tsy nahomby");
    }
  };

  return { createObjective, toggleObjective, deleteObjective, isSubmitting };
};

/**
 * Hook pour gérer les indicateurs
 */
export const useIndicators = (getToken, refreshData) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createIndicator = async (objectiveId, indicatorData) => {
    if (!indicatorData.name.trim()) return false;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.post(
        `/api/objectives/${objectiveId}/indicators`,
        indicatorData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Mari-pandrefesana voasoratra");
      await refreshData();
      return true;
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Tsy nahomby");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateIndicatorValue = async (indicatorId, newValue) => {
    try {
      const token = await getToken();
      await api.put(
        `/api/objectives/indicators/${indicatorId}`,
        { current: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshData();
    } catch (error) {
      console.error("Erreur update:", error);
      toast.error("Tsy nahomby");
    }
  };

  const deleteIndicator = async (indicatorId) => {
    if (!confirm("Hofafana ve ity mari-pandrefesana ity?")) return;

    try {
      const token = await getToken();
      await api.delete(`/api/objectives/indicators/${indicatorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Mari-pandrefesana voafafa");
      await refreshData();
    } catch (error) {
      console.error("Erreur delete:", error);
      toast.error("Tsy nahomby");
    }
  };

  return {
    createIndicator,
    updateIndicatorValue,
    deleteIndicator,
    isSubmitting,
  };
};

/**
 * Hook pour les contributions
 */
export const useContributions = (projectId, getToken, refreshData) => {
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);
  const [isSubmittingFinancial, setIsSubmittingFinancial] = useState(false);
  const [isSubmittingHuman, setIsSubmittingHuman] = useState(false);

  const submitMaterialContribution = async (resourceId, quantity, message) => {
    setIsSubmittingMaterial(true);
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/contributions/material",
        {
          resourceId,
          projectId,
          quantity,
          message: message || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.autoApproved) {
        toast.success("Voatahiry ny fanampiana natolotrao!");
        await refreshData();
      } else {
        toast.success(
          "Lasa ilay fangatahana hanampy. Miandry ny fankatoavan'ny mpandrindra ny tetikasa."
        );
      }
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Nisy olana nitranga");
      return false;
    } finally {
      setIsSubmittingMaterial(false);
    }
  };

  const submitFinancialContribution = async (amount, reference, setContributions) => {
    if (!amount || amount <= 0) {
      toast.error("Ampidiro ny montant nalefa.");
      return false;
    }
    if (!reference?.trim()) {
      toast.error("Ampidiro ny reference transfert.");
      return false;
    }

    setIsSubmittingFinancial(true);
    try {
      const token = await getToken();
      await api.post(
        "/api/contributions/financial",
        {
          projectId,
          amount,
          reference: reference.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { data } = await api.get(
        `/api/contributions/financial/project/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContributions(data || []);
      await refreshData();
      toast.success("Fanampiana nalefa - miandry fanamarinana avy amin'ny lead");
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Nisy olana nitranga");
      return false;
    } finally {
      setIsSubmittingFinancial(false);
    }
  };

  const submitHumanParticipation = async (resourceId, message) => {
    setIsSubmittingHuman(true);
    try {
      const token = await getToken();
      await api.post(
        "/api/contributions/human",
        {
          resourceId,
          projectId,
          message: message || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Voatahiry ny firotsahanao! Hahazo email fanamarinana ianao.");
      await refreshData();
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Nisy olana nitranga");
      return false;
    } finally {
      setIsSubmittingHuman(false);
    }
  };

  return {
    submitMaterialContribution,
    submitFinancialContribution,
    submitHumanParticipation,
    isSubmittingMaterial,
    isSubmittingFinancial,
    isSubmittingHuman,
  };
};
