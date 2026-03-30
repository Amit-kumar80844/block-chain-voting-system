const voteAlert = document.getElementById("voteAlert");
const loginForm = document.getElementById("loginForm");
const voterIdInput = document.getElementById("voterIdInput");
const loggedInVoter = document.getElementById("loggedInVoter");
const candidateGrid = document.getElementById("candidateGrid");
const voterElectionStatus = document.getElementById("voterElectionStatus");
const voteConfirmation = document.getElementById("voteConfirmation");
const confirmationBlockIndex = document.getElementById("confirmationBlockIndex");
const confirmationBlockHash = document.getElementById("confirmationBlockHash");

const SESSION_KEY = "bvs_voter_session";

let currentVoter = null;
let isElectionActive = false;
let isSubmittingVote = false;

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
  voteAlert.hidden = false;
  voteAlert.className = `alert ${type}`;
  voteAlert.textContent = message;
};

const hideAlert = () => {
  voteAlert.hidden = true;
};

const setBadge = (text, variant) => {
  voterElectionStatus.textContent = text;
  voterElectionStatus.className = `status-badge ${variant}`;
};

const persistSession = () => {
  if (!currentVoter) {
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }

  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      voter: currentVoter
    })
  );
};

const restoreSession = () => {
  const rawValue = sessionStorage.getItem(SESSION_KEY);

  if (!rawValue) {
    return;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    currentVoter = parsedValue.voter || null;
  } catch (error) {
    sessionStorage.removeItem(SESSION_KEY);
  }
};

const renderVoterCard = () => {
  if (!currentVoter) {
    loggedInVoter.hidden = true;
    loggedInVoter.innerHTML = "";
    return;
  }

  loggedInVoter.hidden = false;
  loggedInVoter.innerHTML = `
    <span class="stat-label">Logged in voter</span>
    <strong>${currentVoter.name}</strong>
    <p>${currentVoter.voterId}</p>
  `;
};

const renderCandidates = (candidates) => {
  if (!currentVoter) {
    candidateGrid.innerHTML =
      '<div class="empty-state">Login first to view and cast your vote.</div>';
    return;
  }

  if (!isElectionActive) {
    candidateGrid.innerHTML =
      '<div class="empty-state">The election is currently inactive. Please wait for the admin to start it.</div>';
    return;
  }

  if (!candidates || candidates.length === 0) {
    candidateGrid.innerHTML =
      '<div class="empty-state">No candidates are available yet.</div>';
    return;
  }

  candidateGrid.innerHTML = candidates
    .map(
      (candidate) => `
        <article class="candidate-card">
          <div>
            <h3>${candidate.name}</h3>
            <div class="candidate-meta">
              <span><strong>ID:</strong> ${candidate.candidateId}</span>
              <span><strong>Party:</strong> ${candidate.party || "Independent"}</span>
            </div>
          </div>
          <button class="button button-primary vote-button" data-candidate-id="${candidate.candidateId}">
            Vote for ${candidate.name}
          </button>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".vote-button").forEach((button) => {
    button.addEventListener("click", () => castVote(button.dataset.candidateId));
  });
};

const loadCandidates = async () => {
  const result = await apiRequest("/api/public/candidates");
  isElectionActive = Boolean(result.data?.isElectionActive);

  setBadge(
    isElectionActive ? "Active" : "Inactive",
    isElectionActive ? "success" : "error"
  );

  renderCandidates(result.data?.candidates || []);
};

const castVote = async (candidateId) => {
  if (!currentVoter || isSubmittingVote) {
    return;
  }

  isSubmittingVote = true;
  hideAlert();

  try {
    const result = await apiRequest("/api/voter/vote", {
      method: "POST",
      body: JSON.stringify({
        voterId: currentVoter.voterId,
        candidateId
      })
    });

    confirmationBlockIndex.textContent = result.data?.blockIndex ?? "-";
    confirmationBlockHash.textContent = result.data?.blockHash ?? "-";
    voteConfirmation.hidden = false;

    showAlert(
      "Vote cast successfully. Your vote is now recorded in the blockchain.",
      "success"
    );

    currentVoter = null;
    persistSession();
    renderVoterCard();
    candidateGrid.innerHTML =
      '<div class="empty-state">Vote submitted successfully. You cannot vote again.</div>';
    loginForm.reset();
  } catch (error) {
    showAlert(error.message, "error");
  } finally {
    isSubmittingVote = false;
  }
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideAlert();
  voteConfirmation.hidden = true;

  try {
    const result = await apiRequest("/api/voter/login", {
      method: "POST",
      body: JSON.stringify({
        voterId: voterIdInput.value
      })
    });

    currentVoter = result.data?.voter || null;
    isElectionActive = Boolean(result.data?.isElectionActive);
    persistSession();
    renderVoterCard();

    showAlert(result.message, isElectionActive ? "success" : "info");
    await loadCandidates();
  } catch (error) {
    currentVoter = null;
    persistSession();
    renderVoterCard();
    candidateGrid.innerHTML =
      '<div class="empty-state">Login with a valid voter ID to continue.</div>';
    showAlert(error.message, "error");
  }
});

const initializePage = async () => {
  restoreSession();
  renderVoterCard();
  candidateGrid.innerHTML =
    '<div class="empty-state">Login first to view and cast your vote.</div>';

  try {
    await loadCandidates();

    if (currentVoter) {
      showAlert("Session restored. You can continue to cast your vote.", "info");
    }
  } catch (error) {
    showAlert(error.message, "error");
    setBadge("Unavailable", "neutral");
  }
};

initializePage();
