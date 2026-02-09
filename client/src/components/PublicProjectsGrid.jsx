import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Calendar, Users, TrendingUp } from "lucide-react";
import api from "../configs/api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const PublicProjectsGrid = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [publicProjects, setPublicProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPublicProjects();
  }, []);

  const fetchPublicProjects = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/projects/public/all", {
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

  const handleProjectClick = (projectId, workspaceId) => {
    navigate(`/project/${projectId}?workspace=${workspaceId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (publicProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-zinc-400">
          Tsy misy tetikasa ivelany hita
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Tetikasa Ivelany (Ny Rehetra)
      </h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {publicProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => handleProjectClick(project.id, project.workspaceId)}
            className="bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg p-4 hover:shadow-md dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                  {project.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  {project.workspace?.name}
                </p>
              </div>
              {project.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {project.status}
                </span>
              )}
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2 mb-3">
                {project.description}
              </p>
            )}

            {/* Progress */}
            {project.progress !== undefined && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-zinc-400">
                    Fizotran'ny
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
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

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-zinc-700 text-xs text-gray-600 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{project.members?.length || 0} mpikambana</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp size={14} />
                <span>{project.tasks?.length || 0} asa</span>
              </div>
              {project.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>
                    {new Date(project.start_date).toLocaleDateString("mg-MG", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicProjectsGrid;
