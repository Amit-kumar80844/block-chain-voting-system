const resultsAlert = document.getElementById("resultsAlert");
const resultsElectionStatus = document.getElementById("resultsElectionStatus");
const resultsTotalVotes = document.getElementById("resultsTotalVotes");
const resultsPageTableBody = document.getElementById("resultsPageTableBody");
const refreshResultsButton = document.getElementById("refreshResultsButton");

const apiRequest = async (url) => {
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Request failed.");
  }

  return result;
};

const showAlert = (message, type = "info") => {
  resultsAlert.hidden = false;
  resultsAlert.className = `alert ${type}`;
  resultsAlert.textContent = message;
};

const setBadge = (element, text, variant) => {
  element.textContent = text;
  element.className = `status-badge ${variant}`;
};

const renderResults = (payload) => {
  resultsTotalVotes.textContent = payload.totalVotes ?? 0;

  const isElectionActive = Boolean(payload.election?.isElectionActive);
  setBadge(
    resultsElectionStatus,
    isElectionActive ? "Active" : "Inactive",
    isElectionActive ? "success" : "error"
  );

  if (!payload.results || payload.results.length === 0) {
    resultsPageTableBody.innerHTML =
      '<tr><td colspan="4">No candidates available yet.</td></tr>';
    return;
  }

  resultsPageTableBody.innerHTML = payload.results
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
};

const loadResults = async () => {
  try {
    showAlert("Loading public results...", "info");
    const result = await apiRequest("/api/public/results");
    renderResults(result.data || {});
    showAlert("Results refreshed successfully.", "success");
  } catch (error) {
    showAlert(error.message, "error");
  }
};

refreshResultsButton.addEventListener("click", loadResults);

loadResults();
