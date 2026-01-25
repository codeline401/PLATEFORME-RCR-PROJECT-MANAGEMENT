import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import api from "../configs/api";

/**
 * FETCH WORKSPACES FOR THE AUTHENTICATED USER
 */
export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  async (token, { rejectWithValue }) => {
    try {
      console.log(
        "🔍 Fetching workspaces avec token:",
        token ? "présent" : "absent",
      );

      //
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${API_URL}/api/workspaces`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      // Vérifier si c'est du JSON
      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        // Erreur HTTP (401, 404, 500, etc.)
        console.error("❌ HTTP Error:", response.status);

        // Essayer de lire le message d'erreur
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorText = await response.text();
          console.error("❌ Error response:", errorText.substring(0, 200));
          if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
            errorMessage = "Le serveur retourne une page HTML d'erreur";
          } else {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorMessage;
            } catch {
              errorMessage = errorText.substring(0, 100) || errorMessage;
            }
          }
        } catch {
          // Ignorer si on ne peut pas lire la réponse
        }

        throw new Error(errorMessage);
      }

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Pas du JSON ! Contenu:", text.substring(0, 200));
        throw new Error(
          "Le serveur ne retourne pas du JSON (Content-Type: " +
            contentType +
            ")",
        );
      }

      const data = await response.json();
      console.log("✅ Workspaces reçus:", data.workspaces?.length || 0);

      return data.workspaces || [];
    } catch (error) {
      console.error("❌ Erreur fetchWorkspaces:", error.message);

      // 🆕 RETOURNER UN TABLEAU VIDE au lieu de throw pour éviter le crash
      return rejectWithValue({
        workspaces: [],
        error: error.message,
      });
    }
  },
);

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
  error: null,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    // ... vos reducers existants (gardez-les)
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload;
    },
    setCurrentWorkspace: (state, action) => {
      localStorage.setItem("currentWorkspaceId", action.payload);
      state.currentWorkspace = state.workspaces.find(
        (w) => w.id === action.payload,
      );
    },
    // ... autres reducers
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.workspaces = action.payload;
        state.loading = false;
        state.error = null;

        // Sélectionner le workspace courant
        if (action.payload.length > 0) {
          const localStorageCurrentWorkspaceId =
            localStorage.getItem("currentWorkspaceId");
          if (localStorageCurrentWorkspaceId) {
            const findWorkspace = action.payload.find(
              (w) => w.id === localStorageCurrentWorkspaceId,
            );
            if (findWorkspace) {
              state.currentWorkspace = findWorkspace;
            } else {
              state.currentWorkspace = action.payload[0];
            }
          } else {
            state.currentWorkspace = action.payload[0];
          }
        } else {
          state.currentWorkspace = null;
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Erreur inconnue";

        // 🆕 IMPORTANT: Mettre un tableau vide pour éviter le blocage
        state.workspaces = [];
        state.currentWorkspace = null;

        console.log("⚠️ Workspaces fetch échoué, tableau vide utilisé");
      });
  },
});

export const {
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addProject,
  addTask,
  updateTask,
  deleteTask,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
