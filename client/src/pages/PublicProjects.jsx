import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Calendar, Users, TrendingUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../configs/api.js";
import toast from "react-hot-toast";

const PublicProjects = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [publicProjects, setPublicProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, completed

  useEffect(() => {
    fetchPublicProjects();
  }, []);

  const fetchPublicProjects = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/public/projects/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPublicProjects(data);
    } catch (error) {
      console.error("❌ Error fetching public projects:", error);
      toast.error("Erreur lors du chargement des projets publics");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredProjects = () => {
    if (filter === "active") {
      return publicProjects.filter((p) => p.status === "ACTIVE");
    }
    if (filter === "completed") {
      return publicProjects.filter((p) => p.status === "COMPLETED");
    }
    return publicProjects;
  };

  const filteredProjects = getFilteredProjects();

  const handleProjectClick = (projectId, workspaceId) => {
    navigate(`/project/${projectId}?workspace=${workspaceId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tetikasa Ivelany
          </h1>
          <p className="text-gray-600 dark:text-zinc-400">
            Hitan'ny rehetra ny tetikasa ivelany {filteredProjects.length}{" "}
            tetikasa
          </p>
        </div>

        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-2 px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition"
        >
          <Plus size={16} /> Tetikasa Anaty
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-zinc-700">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-medium transition ${
            filter === "all"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Ny Rehetra ({publicProjects.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 font-medium transition ${
            filter === "active"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Efa Mandeha (
          {publicProjects.filter((p) => p.status === "ACTIVE").length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 font-medium transition ${
            filter === "completed"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Efa Vita (
          {publicProjects.filter((p) => p.status === "COMPLETED").length})
        </button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-zinc-400 text-lg mb-4">
            Tsy misy tetikasa ivelany hita
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            Jereo ny tetikasa anaty
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() =>
                handleProjectClick(project.id, project.workspaceId)
              }
              className="bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg p-6 hover:shadow-lg dark:hover:bg-zinc-800 transition cursor-pointer flex flex-col h-full"
            >
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {project.name}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  {project.workspace?.name}
                </p>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2 mb-4">
                  {project.description}
                </p>
              )}

              {/* Progress */}
              {project.progress !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-zinc-400">
                      Fizotran'ny
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Dates */}
              {project.start_date && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
                  Nanombohany:{" "}
                  {new Date(project.start_date).toLocaleDateString("mg-MG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}

              {/* Footer Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-700 text-sm text-gray-600 dark:text-zinc-400 mt-auto">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{project.members?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp size={16} />
                  <span>{project.tasks?.length || 0}</span>
                </div>
                {project.owner && (
                  <div className="flex items-center gap-1 text-xs">
                    <span>{project.owner.name || project.owner.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicProjects;
