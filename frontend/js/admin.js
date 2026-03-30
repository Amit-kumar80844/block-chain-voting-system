const adminAlert = document.getElementById("adminAlert");
const voterForm = document.getElementById("voterForm");
const candidateForm = document.getElementById("candidateForm");
const voterTableBody = document.getElementById("voterTableBody");
const candidateTableBody = document.getElementById("candidateTableBody");
const resultsTableBody = document.getElementById("resultsTableBody");
const electionStatusBadge = document.getElementById("electionStatusBadge");
const totalVotesCount = document.getElementById("totalVotesCount");
const chainStatusBadge = document.getElementById("chainStatusBadge");
const startElectionButton = document.getElementById("startElectionButton");
const endElectionButton = document.getElementById("endElectionButton");
const refreshDashboardButton = document.getElementById("refreshDashboardButton");

const state = {
  voters: [],
  candidates: [],
  electionActive: false
};

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Request failed.");
  }

  return result;
};

const showAlert = (message, type = "info") => {
  adminAlert.hidden = false;
  adminAlert.className = `alert ${type}`;
  adminAlert.textContent = message;
};

const setBadge = (element, text, variant) => {
  element.textContent = text;
  element.className = `status-badge ${variant}`;
};

const createPill = (value, trueText = "Yes", falseText = "No") =>
  value
    ? `<span class="pill success">${trueText}</span>`
    : `<span class="pill error">${falseText}</span>`;

const updateControlButtons = () => {
  startElectionButton.disabled =
    state.electionActive || state.candidates.length === 0;
  endElectionButton.disabled = !state.electionActive;
};

const renderVoters = () => {
  if (state.voters.length === 0) {
    voterTableBody.innerHTML =
      '<tr><td colspan="4">No voters registered yet.</td></tr>';
    return;
  }

  voterTableBody.innerHTML = state.voters
    .map(
      (voter) => `
        <tr>
          <td>${voter.voterId}</td>
          <td>${voter.name}</td>
          <td>${createPill(voter.isEligible, "Eligible", "Ineligible")}</td>
          <td>${createPill(voter.hasVoted, "Voted", "Pending")}</td>
        </tr>
      `
    )
    .join("");
};

const renderCandidates = () => {
  if (state.candidates.length === 0) {
    candidateTableBody.innerHTML =
      '<tr><td colspan="3">No candidates added yet.</td></tr>';
    return;
  }

  candidateTableBody.innerHTML = state.candidates
    .map(
      (candidate) => `
        <tr>
          <td>${candidate.candidateId}</td>
          <td>${candidate.name}</td>
          <td>${candidate.party || "Independent"}</td>
        </tr>
      `
    )
    .join("");
};

const renderResults = (resultsPayload) => {
  totalVotesCount.textContent = resultsPayload.totalVotes ?? 0;
  state.electionActive = Boolean(resultsPayload.election?.isElectionActive);

  setBadge(
    electionStatusBadge,
    state.electionActive ? "Active" : "Inactive",
    state.electionActive ? "success" : "error"
  );

  setBadge(
    chainStatusBadge,
    resultsPayload.chainValid ? "Valid" : "Invalid",
    resultsPayload.chainValid ? "success" : "error"
  );

  if (!resultsPayload.results || resultsPayload.results.length === 0) {
    resultsTableBody.innerHTML =
      '<tr><td colspan="4">No candidates available to show results.</td></tr>';
    updateControlButtons();
    return;
  }

  resultsTableBody.innerHTML = resultsPayload.results
    .map(
      (candidate) => `
        <tr>
          <td>${candidate.candidateId}</td>
          <td>${candidate.name}</td>
          <td>${candidate.party}</td>
          <td>${candidate.votes}</td>
        </tr>
      `
    )
    .join("");

  updateControlButtons();
};

const loadVoters = async () => {
  const result = await apiRequest("/api/admin/voters");
  state.voters = result.data || [];
  renderVoters();
};

const loadCandidates = async () => {
  const result = await apiRequest("/api/admin/candidates");
  state.candidates = result.data || [];
  renderCandidates();
  updateControlButtons();
};

const loadResults = async () => {
  const result = await apiRequest("/api/admin/results");
  renderResults(result.data || {});
};

const loadDashboard = async () => {
  try {
    showAlert("Loading dashboard data...", "info");
    await Promise.all([loadVoters(), loadCandidates(), loadResults()]);
    showAlert("Dashboard updated successfully.", "success");
  } catch (error) {
    showAlert(error.message, "error");
  }
};

voterForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(voterForm);
  const payload = {
    voterId: formData.get("voterId"),
    name: formData.get("name"),
    isEligible: formData.get("isEligible") === "on"
  };

  try {
    await apiRequest("/api/admin/voters", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    voterForm.reset();
    voterForm.elements.isEligible.checked = true;
    showAlert("Voter added successfully.", "success");
    await loadVoters();
  } catch (error) {
    showAlert(error.message, "error");
  }
});

candidateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(candidateForm);
  const payload = {
    candidateId: formData.get("candidateId"),
    name: formData.get("name"),
    party: formData.get("party")
  };

  try {
    await apiRequest("/api/admin/candidates", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    candidateForm.reset();
    showAlert("Candidate added successfully.", "success");
    await Promise.all([loadCandidates(), loadResults()]);
  } catch (error) {
    showAlert(error.message, "error");
  }
});

startElectionButton.addEventListener("click", async () => {
  try {
    await apiRequest("/api/admin/election/start", {
      method: "POST"
    });
    showAlert("Election started successfully.", "success");
    await loadResults();
  } catch (error) {
    showAlert(error.message, "error");
  }
});

endElectionButton.addEventListener("click", async () => {
  try {
    await apiRequest("/api/admin/election/end", {
      method: "POST"
    });
    showAlert("Election ended successfully.", "success");
    await loadResults();
  } catch (error) {
    showAlert(error.message, "error");
  }
});

refreshDashboardButton.addEventListener("click", loadDashboard);

loadDashboard();
