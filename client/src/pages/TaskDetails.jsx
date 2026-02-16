import { format } from "date-fns";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarIcon,
  MessageCircle,
  PenIcon,
  Target,
  CheckCircle2,
  AlertTriangle,
  Key,
  Edit3,
  Save,
  X,
} from "lucide-react";

import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../configs/api.js";

const TaskDetails = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const taskId = searchParams.get("taskId");

  const { user } = useUser();
  const { getToken } = useAuth();

  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  
  // État pour le mode édition des sections
  const [isEditingSections, setIsEditingSections] = useState(false);
  const [editedSections, setEditedSections] = useState({
    objective: "",
    result: "",
    risk: "",
    keyFactor: "",
  });

  const { currentWorkspace } = useSelector((state) => state.workspace);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      toast.loading("Adding comment...");

      const token = await getToken();

      const { data } = await api.post(
        `api/comments`,
        { taskId: task.id, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
      toast.dismissAll();
      toast.success("Lasa soa amantsara ny hafatra!");
    } catch (error) {
      toast.dismissAll();
      toast.error(error?.response?.data?.message || error.message);
      console.error(error);
    }
  };

  const handleToggleKeyFactorAcquired = async () => {
    try {
      const token = await getToken();
      const newValue = !task.keyFactorAcquired;

      await api.put(
        `api/tasks/${task.id}`,
        { keyFactorAcquired: newValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTask((prev) => ({ ...prev, keyFactorAcquired: newValue }));
      toast.success(
        newValue ? "Singa fototra efa azo!" : "Singa fototra mbola tsy azo",
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const handleStartEditSections = () => {
    setEditedSections({
      objective: task.objective || "",
      result: task.result || "",
      risk: task.risk || "",
      keyFactor: task.keyFactor || "",
    });
    setIsEditingSections(true);
  };

  const handleCancelEditSections = () => {
    setIsEditingSections(false);
    setEditedSections({
      objective: "",
      result: "",
      risk: "",
      keyFactor: "",
    });
  };

  const handleSaveSections = async () => {
    try {
      const token = await getToken();
      
      await api.put(
        `api/tasks/${task.id}`,
        editedSections,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTask((prev) => ({ ...prev, ...editedSections }));
      setIsEditingSections(false);
      toast.success("Voaova soa aman-tsara ny asa!");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    const fetchTaskDetails = async () => {
      setLoading(true);
      if (!projectId || !taskId) return;

      const proj = currentWorkspace.projects.find((p) => p.id === projectId);
      if (!proj) return;

      const tsk = proj.tasks.find((t) => t.id === taskId);
      if (!tsk) return;

      setTask(tsk);
      setProject(proj);
      setLoading(false);
    };

    fetchTaskDetails();
  }, [taskId, projectId, currentWorkspace]);

  useEffect(() => {
    if (taskId && task) {
      const loadComments = async () => {
        try {
          const token = await getToken();
          const { data } = await api.get(`api/comments/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setComments(data.comments || []);
        } catch (error) {
          toast.error(error?.response?.data?.message || error.message);
        }
      };

      loadComments();
      const interval = setInterval(() => {
        loadComments();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [taskId, task, getToken]);

  if (loading)
    return (
      <div className="text-gray-500 dark:text-zinc-400 px-4 py-6">
        Mitady ireo antsipirian'asa...
      </div>
    );
  if (!task)
    return <div className="text-red-500 px-4 py-6">Tsy Misy Asa Hita.</div>;

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 text-gray-900 dark:text-zinc-100 max-w-6xl mx-auto">
      {/* Left: Comments / Chatbox */}
      <div className="w-full lg:w-2/3">
        <div className="p-5 rounded-md  border border-gray-300 dark:border-zinc-800  flex flex-col lg:h-[80vh]">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
            <MessageCircle className="size-5" /> Resadresaka Momban'ny asa (
            {comments.length})
          </h2>

          <div className="flex-1 md:overflow-y-scroll no-scrollbar">
            {comments.length > 0 ? (
              <div className="flex flex-col gap-4 mb-6 mr-2">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`sm:max-w-4/5 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 border border-gray-300 dark:border-zinc-700 p-3 rounded-md ${
                      comment.user.id === user?.id ? "ml-auto" : "mr-auto"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-zinc-400">
                      <img
                        src={comment.user.image}
                        alt="avatar"
                        className="size-5 rounded-full"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-zinc-600">
                        •{" "}
                        {format(
                          new Date(comment.createdAt),
                          "dd MMM yyyy, HH:mm",
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-zinc-200">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-zinc-500 mb-4 text-sm">
                Mbola Tsy Nisy Resaka Nandeha. Tarito Ny Resaka !
              </p>
            )}
          </div>

          {/* Add Comment */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Sorato eto ny hafatra..."
              className="w-full dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md p-2 text-sm text-gray-900 dark:text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
              rows={3}
            />
            <button
              onClick={handleAddComment}
              className="bg-gradient-to-l from-blue-500 to-blue-600 transition-colors text-white text-sm px-5 py-2 rounded "
            >
              Alefa
            </button>
          </div>
        </div>
      </div>

      {/* Right: Task + Project Info */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        {/* Task Info */}
        <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 ">
          <div className="mb-3">
            <h1 className="text-lg font-medium text-gray-900 dark:text-zinc-100">
              {task.title}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-300 text-xs">
                {task.status}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-300 text-xs">
                {task.type}
              </span>
              <span className="px-2 py-0.5 rounded bg-green-200 dark:bg-emerald-900 text-green-900 dark:text-emerald-300 text-xs">
                {task.priority}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-zinc-400">Fandrosoana</span>
                <span className={`text-xs font-medium ${
                  (task.progress ?? 0) === 100 
                    ? 'text-green-600 dark:text-green-400' 
                    : (task.progress ?? 0) >= 50 
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-zinc-400'
                }`}>
                  {task.progress ?? 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    (task.progress ?? 0) === 100 
                      ? 'bg-green-500' 
                      : (task.progress ?? 0) >= 50 
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                  }`}
                  style={{ width: `${task.progress ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">
              {task.description}
            </p>
          )}

          {/* Nouvelles sections : Objectif, Résultat, Risque, Facteur clé */}
          <div className="space-y-3 mb-4">
            {/* Header avec bouton d'édition */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                Antsipiriany momba ny asa
              </h3>
              {!isEditingSections ? (
                <button
                  onClick={handleStartEditSections}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Edit3 className="size-3" />
                  Hanova
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveSections}
                    className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline"
                  >
                    <Save className="size-3" />
                    Tehirizina
                  </button>
                  <button
                    onClick={handleCancelEditSections}
                    className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    <X className="size-3" />
                    Ajanony
                  </button>
                </div>
              )}
            </div>

            {isEditingSections ? (
              /* Mode édition */
              <div className="space-y-3">
                {/* Objectif */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                    <Target className="size-4" />
                    Tanjona (Objectif)
                  </label>
                  <textarea
                    value={editedSections.objective}
                    onChange={(e) => setEditedSections(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="Inona no tanjona kendren'ity asa ity?"
                    className="w-full rounded dark:bg-zinc-800 border border-blue-200 dark:border-blue-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                {/* Résultat */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                    <CheckCircle2 className="size-4" />
                    Vokatra (Résultat attendu)
                  </label>
                  <textarea
                    value={editedSections.result}
                    onChange={(e) => setEditedSections(prev => ({ ...prev, result: e.target.value }))}
                    placeholder="Inona no vokatra andrasana?"
                    className="w-full rounded dark:bg-zinc-800 border border-green-200 dark:border-green-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                  />
                </div>

                {/* Risque */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                    <AlertTriangle className="size-4" />
                    Loza (Risque)
                  </label>
                  <textarea
                    value={editedSections.risk}
                    onChange={(e) => setEditedSections(prev => ({ ...prev, risk: e.target.value }))}
                    placeholder="Inona avy ireo loza mety hiseho?"
                    className="w-full rounded dark:bg-zinc-800 border border-orange-200 dark:border-orange-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={2}
                  />
                </div>

                {/* Facteur clé */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                    <Key className="size-4" />
                    Singa fototra (Facteur clé)
                  </label>
                  <textarea
                    value={editedSections.keyFactor}
                    onChange={(e) => setEditedSections(prev => ({ ...prev, keyFactor: e.target.value }))}
                    placeholder="Inona no singa fototra na antony manosika?"
                    className="w-full rounded dark:bg-zinc-800 border border-purple-200 dark:border-purple-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                  />
                </div>
              </div>
            ) : (
              /* Mode affichage */
              <div className="space-y-3">
                {/* Objectif - Tanjona */}
                <div className={`p-3 rounded-md border ${task.objective ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900' : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className={`size-4 ${task.objective ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-500'}`} />
                    <span className={`text-sm font-medium ${task.objective ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-zinc-400'}`}>
                      Tanjona (Objectif)
                    </span>
                  </div>
                  <p className={`text-sm ${task.objective ? 'text-blue-800 dark:text-blue-200' : 'text-gray-400 dark:text-zinc-500 italic'}`}>
                    {task.objective || "Tsy mbola voafaritra"}
                  </p>
                </div>

                {/* Résultat - Vokatra */}
                <div className={`p-3 rounded-md border ${task.result ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900' : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className={`size-4 ${task.result ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-zinc-500'}`} />
                    <span className={`text-sm font-medium ${task.result ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-zinc-400'}`}>
                      Vokatra (Résultat attendu)
                    </span>
                  </div>
                  <p className={`text-sm ${task.result ? 'text-green-800 dark:text-green-200' : 'text-gray-400 dark:text-zinc-500 italic'}`}>
                    {task.result || "Tsy mbola voafaritra"}
                  </p>
                </div>

                {/* Risque - Loza */}
                <div className={`p-3 rounded-md border ${task.risk ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900' : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={`size-4 ${task.risk ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-zinc-500'}`} />
                    <span className={`text-sm font-medium ${task.risk ? 'text-orange-700 dark:text-orange-300' : 'text-gray-500 dark:text-zinc-400'}`}>
                      Loza (Risque)
                    </span>
                  </div>
                  <p className={`text-sm ${task.risk ? 'text-orange-800 dark:text-orange-200' : 'text-gray-400 dark:text-zinc-500 italic'}`}>
                    {task.risk || "Tsy mbola voafaritra"}
                  </p>
                </div>

                {/* Facteur clé - Singa fototra */}
                <div className={`p-3 rounded-md border ${
                  task.keyFactor 
                    ? (task.keyFactorAcquired 
                        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900' 
                        : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900')
                    : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Key className={`size-4 ${
                        task.keyFactor 
                          ? (task.keyFactorAcquired ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400')
                          : 'text-gray-400 dark:text-zinc-500'
                      }`} />
                      <span className={`text-sm font-medium ${
                        task.keyFactor 
                          ? (task.keyFactorAcquired ? 'text-green-700 dark:text-green-300' : 'text-purple-700 dark:text-purple-300')
                          : 'text-gray-500 dark:text-zinc-400'
                      }`}>
                        Singa fototra (Facteur clé)
                      </span>
                    </div>
                    {task.keyFactor && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={task.keyFactorAcquired || false}
                          onChange={handleToggleKeyFactorAcquired}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className={`text-xs ${task.keyFactorAcquired ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`}>
                          {task.keyFactorAcquired ? "Efa azo" : "Mbola tsy azo"}
                        </span>
                      </label>
                    )}
                  </div>
                  <p className={`text-sm ${
                    task.keyFactor 
                      ? (task.keyFactorAcquired ? 'text-green-800 dark:text-green-200' : 'text-purple-800 dark:text-purple-200')
                      : 'text-gray-400 dark:text-zinc-500 italic'
                  }`}>
                    {task.keyFactor || "Tsy mbola voafaritra"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <hr className="border-zinc-200 dark:border-zinc-700 my-3" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <img
                src={task.assignee?.image}
                className="size-5 rounded-full"
                alt="avatar"
              />
              {task.assignee?.name || "Unassigned"}
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-gray-500 dark:text-zinc-500" />
              Daty tokony hifaranan'ny asa :{" "}
              {format(new Date(task.due_date), "dd MMM yyyy")}
            </div>
          </div>
        </div>

        {/* Project Info */}
        {project && (
          <div className="p-4 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-800 ">
            <p className="text-xl font-medium mb-4">Momban'ny Tetikasa</p>
            <h2 className="text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              {" "}
              <PenIcon className="size-4" /> {project.name}
            </h2>
            <p className="text-xs mt-3">
              Daty Fiantombohann'ny Tetikasa:{" "}
              {format(new Date(project.start_date), "dd MMM yyyy")}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-zinc-400 mt-3">
              <span>Status: {project.status}</span>
              <span>Priority: {project.priority}</span>
              <span>Fahataterahany: {project.progress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// - Add possibility to edit due date

export default TaskDetails;
