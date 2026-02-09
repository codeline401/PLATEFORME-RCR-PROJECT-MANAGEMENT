import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Search, FolderOpen } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import api from "../configs/api.js";
import toast from "react-hot-toast";

export default function PublicProjectsList() {
  const { getToken } = useAuth();
  const [allProjects, setAllProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "ALL",
    priority: "ALL",
  });

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

      setAllProjects(data);
    } catch (error) {
      console.error("❌ Error fetching public projects:", error);
      toast.error("Erreur lors du chargement des projets publics");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter projects
  const filterProjects = () => {
    let filtered = allProjects;

    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filters.status !== "ALL") {
      filtered = filtered.filter(
        (project) => project.status === filters.status,
      );
    }

    if (filters.priority !== "ALL") {
      filtered = filtered.filter(
        (project) => project.priority === filters.priority,
      );
    }

    setFilteredProjects(filtered);
  };

  useEffect(() => {
    filterProjects();
  }, [allProjects, searchTerm, filters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Tetikasa Ivelany
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            Haraho maso ny tetikasa ivelany avy amin'ny lahat
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 w-4 h-4" />
          <input
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
            className="w-full pl-10 text-sm pr-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:border-blue-500 outline-none"
            placeholder="Mitady tetikasa..."
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="ALL">Ny Rehetra ny Status</option>
          <option value="ACTIVE">Efa Mandeha</option>
          <option value="PLANNING">Eo ampandrafetana</option>
          <option value="COMPLETED">Efa Vita</option>
          <option value="ON_HOLD">Mbola Miantona</option>
          <option value="CANCELLED">Nofoanana</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="ALL">Ny Lahatelo Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-400 dark:text-zinc-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-zinc-400">
            Tsy misy tetikasa ivelany hita
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} isPublic={true} />
          ))}
        </div>
      )}
    </div>
  );
}
