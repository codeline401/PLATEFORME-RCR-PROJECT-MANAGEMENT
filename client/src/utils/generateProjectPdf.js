import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateProjectPdf = (project, contributions = {}) => {
  const doc = new jsPDF();

  // Extraire les contributions passées en paramètre
  const { financialContributions = [], materialContributions = [] } =
    contributions;

  // Helper pour formater les dates
  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("fr-FR");
  };

  // Trouver le responsable (team lead)
  const getLeadName = () => {
    // Chercher dans les membres celui qui est le lead
    const leadMember = project.members?.find(
      (m) => m.userId === project.team_lead || m.user?.id === project.team_lead,
    );
    return leadMember?.user?.name || project.owner?.name || "N/A";
  };

  // Titre
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text(`Tatitry ny Tetikasa: ${project.name}`, 20, 20);

  // Date d'export
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(
    `Navoaka androany faha: ${new Date().toLocaleDateString("fr-FR")}`,
    20,
    30,
  );

  // Ligne de séparation
  doc.setDrawColor(59, 130, 246);
  doc.line(20, 32, 190, 32);

  // === RÉSUMÉ ===
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Famintinana ny tetikasa", 20, 42);

  doc.setFontSize(11);
  doc.text(`Fahavitany : ${project.progress || 0}%`, 25, 52);
  doc.text(`Mpiandraikitra : ${getLeadName()}`, 25, 59);
  doc.text(
    `Daty nianombohany : ${formatDate(project.startDate || project.start_date)}`,
    25,
    66,
  );
  doc.text(
    `Daty niafarany : ${formatDate(project.endDate || project.end_date)}`,
    25,
    73,
  );

  // === DESCRIPTION ===
  doc.setFontSize(14);
  doc.text("Famaritana", 20, 88);
  doc.setFontSize(10);
  const description = project.description || "Tsy misy famaritana ny tetikasa";
  const splitDescription = doc.splitTextToSize(description, 170);
  doc.text(splitDescription, 25, 96);

  // === OBJECTIFS ===
  let yPos = 96 + splitDescription.length * 5 + 15;

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Tanjona", 20, yPos);

  if (project.objectives && project.objectives.length > 0) {
    yPos += 8;

    project.objectives.forEach((obj, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Titre de l'objectif
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text(`${index + 1}. ${obj.name}`, 25, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setTextColor(0);

      // Description
      if (obj.description) {
        doc.text(`Famaritana: ${obj.description}`, 30, yPos);
        yPos += 5;
      }

      // Vokatra (Résultat)
      if (obj.result) {
        doc.setTextColor(34, 197, 94); // Vert
        doc.text(`Vokatra: ${obj.result}`, 30, yPos);
        yPos += 5;
      }

      // Loza (Risques)
      if (obj.risk) {
        doc.setTextColor(239, 68, 68); // Rouge
        doc.text(`Loza: ${obj.risk}`, 30, yPos);
        yPos += 5;
      }

      // Statut
      doc.setTextColor(0);
      doc.text(
        `Refy: ${obj.isCompleted ? "Vita" : "Tsy mbola vita"}`,
        30,
        yPos,
      );
      yPos += 5;

      // Mari-drefy (Indicateurs)
      if (obj.indicators && obj.indicators.length > 0) {
        doc.setTextColor(59, 130, 246); // Bleu
        doc.text("Mari-drefy:", 30, yPos);
        yPos += 5;

        obj.indicators.forEach((ind) => {
          const progress =
            ind.target > 0 ? Math.round((ind.current / ind.target) * 100) : 0;
          doc.setTextColor(0);
          doc.text(
            `   • ${ind.name}: ${ind.current}/${ind.target} ${ind.unit} (${progress}%)`,
            35,
            yPos,
          );
          yPos += 5;
        });
      }

      yPos += 5; // Espace entre les objectifs
    });

    yPos += 10;
  } else {
    yPos += 10;
    doc.setFontSize(10);
    doc.text("Tsy misy tanjona voafaritra", 25, yPos);
    yPos += 15;
  }

  // === TÂCHES ===
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Lisitry ny Asa", 20, yPos);

  const taskData =
    project.tasks?.map((task) => [
      task.title,
      task.assignee?.name || "Tsy voatendry",
      task.status === "DONE"
        ? "Vita"
        : task.status === "IN_PROGRESS"
          ? "Eo am-panatanterahana"
          : "Tsy mbola natomboka",
      `${task.progress || 0}%`,
    ]) || [];

  if (taskData.length > 0) {
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Asa", "Mpiandraikitra", "Refy", "Fahavitany"]],
      body: taskData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    });
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    yPos += 10;
    doc.setFontSize(10);
    doc.text("Tsy misy asa", 25, yPos);
    yPos += 15;
  }

  // === RESSOURCES FINANCIÈRES ===
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Loharanon-karena ara-bola", 20, yPos);

  // financialResources est un tableau, on prend le premier élément
  const financialResourcesArray =
    project.financialResources || project.financialRessources || [];
  const financial = financialResourcesArray[0] || {};
  doc.setFontSize(11);
  doc.text(
    `Vola nilaina : ${(financial.amount || 0).toLocaleString()} Ar`,
    25,
    yPos + 8,
  );
  doc.text(
    `Vola voaangona : ${(financial.owned || 0).toLocaleString()} Ar`,
    25,
    yPos + 15,
  );
  yPos += 30;

  // Liste des donateurs financiers (APPROVED et REJECTED)
  const allFinancialContributions =
    financialContributions.length > 0
      ? financialContributions
      : project.financialContributions || [];

  const financialContributorsData = allFinancialContributions
    .filter((c) => c.status === "APPROVED" || c.status === "REJECTED")
    .map((c) => [
      c.contributor?.name || "Tsy fantatra",
      `${(c.amount || 0).toLocaleString()} Ar`,
      c.reference || "N/A",
      new Date(c.createdAt).toLocaleDateString("fr-FR"),
      c.status === "APPROVED" ? "Voaray" : "Nolavina",
    ]);

  if (financialContributorsData.length > 0) {
    doc.setFontSize(12);
    doc.text("Lisitry ny mpanohana ara-bola", 25, yPos);
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Anarana", "Vola", "Référence", "Daty", "Fanamarihana"]],
      body: financialContributorsData,
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        4: {
          cellWidth: 25,
          fontStyle: "bold",
        },
      },
      didParseCell: function (data) {
        if (data.column.index === 4 && data.section === "body") {
          if (data.cell.raw.includes("Nolavina")) {
            data.cell.styles.textColor = [239, 68, 68]; // Rouge
          } else {
            data.cell.styles.textColor = [34, 197, 94]; // Vert
          }
        }
      },
    });
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.text("Tsy nisy mpanohana ara-bola", 25, yPos);
    yPos += 15;
  }

  // === RESSOURCES MATÉRIELLES ===
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text("Loharanon-karena ara-pitaovana", 20, yPos);

  const materialData =
    project.materialResources?.map((res) => [
      res.name,
      res.needed || 0,
      res.owned || 0,
      res.owned >= res.needed ? "Feno" : "Tsy ampy",
    ]) || [];

  if (materialData.length > 0) {
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Fitaovana", "Ny nilaina", "Ny Azo", "Ka"]],
      body: materialData,
      theme: "striped",
      headStyles: { fillColor: [34, 197, 94] },
    });
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    yPos += 10;
    doc.setFontSize(10);
    doc.text(
      "Tsy nisy fitaovana nilaina nanatanterahana ny tetikasa",
      25,
      yPos,
    );
    yPos += 15;
  }

  // Liste des donateurs matériels (APPROVED et REJECTED)
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  const allMaterialContributions =
    materialContributions.length > 0
      ? materialContributions
      : project.materialContributions || [];

  const materialContributorsData = allMaterialContributions
    .filter((c) => c.status === "APPROVED" || c.status === "REJECTED")
    .map((c) => [
      c.contributor?.name || "Tsy fantatra",
      c.resource?.name || "N/A",
      c.quantity || 0,
      new Date(c.createdAt).toLocaleDateString("fr-FR"),
      c.status === "APPROVED" ? "Voaray" : "Nolavina",
    ]);

  if (materialContributorsData.length > 0) {
    doc.setFontSize(12);
    doc.text("Lisitry ny mpanohana ara-pitaovana", 25, yPos);
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Anarana", "Fitaovana", "Isa", "Daty", "Fanamarihana"]],
      body: materialContributorsData,
      theme: "striped",
      headStyles: { fillColor: [234, 179, 8] },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        4: {
          cellWidth: 25,
          fontStyle: "bold",
        },
      },
      didParseCell: function (data) {
        if (data.column.index === 4 && data.section === "body") {
          if (data.cell.raw.includes("Nolavina")) {
            data.cell.styles.textColor = [239, 68, 68]; // Rouge
          } else {
            data.cell.styles.textColor = [34, 197, 94]; // Vert
          }
        }
      },
    });
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.text("Tsy nisy mpanohana ara-pitaovana", 25, yPos);
    yPos += 15;
  }

  // === RESSOURCES HUMAINES ===
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text("Loharanon-karena ara-olona", 20, yPos);

  const humanData =
    project.humanResources?.map((res) => [
      res.name,
      res.needed || 0,
      res.participants?.length || 0,
    ]) || [];

  if (humanData.length > 0) {
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Andraikitra", "Ny nilaina", "Ny nandray anjara"]],
      body: humanData,
      theme: "striped",
      headStyles: { fillColor: [168, 85, 247] },
    });
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    yPos += 10;
    doc.setFontSize(10);
    doc.text(
      "Tsy nisy olona nilaina tamin'ny nanatanterahana ny tetikasa",
      25,
      yPos,
    );
    yPos += 15;
  }

  // Liste des participants humains
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  const humanParticipants = [];
  project.humanResources?.forEach((res) => {
    res.participants?.forEach((p) => {
      humanParticipants.push([
        p.participant?.name || p.name || "Tsy fantatra",
        res.name,
        p.participant?.email || p.email || "N/A",
      ]);
    });
  });

  if (humanParticipants.length > 0) {
    doc.setFontSize(12);
    doc.text("Lisitry ny nandray anjara ara-olona", 25, yPos);
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Anarana", "Andraikitra", "Mailaka"]],
      body: humanParticipants,
      theme: "striped",
      headStyles: { fillColor: [139, 92, 246] },
    });
    yPos = doc.lastAutoTable.finalY + 15;
  }

  // === LISTE DES PARTICIPANTS / MEMBRES ===
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text("Mpandray anjara rehetra tamin'ny tetikasa", 20, yPos);

  const membersData =
    project.members?.map((member) => [
      member.user?.name || "N/A",
      member.user?.email || "N/A",
      member.userId === project.team_lead ? "Mpiandraikitra" : "Mpikambana",
    ]) || [];

  if (membersData.length > 0) {
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Anarana", "Mailaka", "Andraikitra"]],
      body: membersData,
      theme: "striped",
      headStyles: { fillColor: [249, 115, 22] },
    });
  } else {
    yPos += 10;
    doc.setFontSize(10);
    doc.text("Tsy nisy mpikambana", 25, yPos);
  }

  // === FOOTER ===
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("RCR / T.OLO.N.A - Tatitra tetikasa", 20, 285);
    doc.text(`Pejy ${i}/${pageCount}`, 180, 285);
  }

  // Télécharger
  doc.save(`Tatitra_${project.name.replace(/\s+/g, "_")}.pdf`);
};
