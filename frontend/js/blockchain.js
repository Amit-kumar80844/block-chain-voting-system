const blockchainAlert = document.getElementById("blockchainAlert");
const chainBlockCount = document.getElementById("chainBlockCount");
const chainVerificationBadge = document.getElementById("chainVerificationBadge");
const blockList = document.getElementById("blockList");
const refreshChainButton = document.getElementById("refreshChainButton");
const verifyChainButton = document.getElementById("verifyChainButton");

const apiRequest = async (url) => {
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Request failed.");
  }

  return result;
};

const showAlert = (message, type = "info") => {
  blockchainAlert.hidden = false;
  blockchainAlert.className = `alert ${type}`;
  blockchainAlert.textContent = message;
};

const setBadge = (text, variant) => {
  chainVerificationBadge.textContent = text;
  chainVerificationBadge.className = `status-badge ${variant}`;
};

const renderBlocks = (chain) => {
  chainBlockCount.textContent = chain.length;

  if (!chain.length) {
    blockList.innerHTML =
      '<div class="empty-state">No blocks available in the blockchain yet.</div>';
    return;
  }

  blockList.innerHTML = chain
    .map(
      (block) => `
        <article class="block-card ${block.index === 0 ? "genesis" : ""}">
          <div class="block-header">
            <div>
              <p class="eyebrow">${block.index === 0 ? "Genesis Block" : "Vote Block"}</p>
              <h2>Block #${block.index}</h2>
            </div>
            <span class="pill neutral">Nonce: ${block.nonce}</span>
          </div>
          <div class="block-meta">
            <div class="block-row">
              <span class="stat-label">Timestamp</span>
              <div class="hash-text">${block.timestamp}</div>
            </div>
            <div class="block-row">
              <span class="stat-label">Voter Hash</span>
              <div class="hash-text">${block.data?.voterHash || "Not applicable for genesis block"}</div>
            </div>
            <div class="block-row">
              <span class="stat-label">Candidate ID</span>
              <div class="hash-text">${block.data?.candidateId || "Not applicable for genesis block"}</div>
            </div>
            <div class="block-row">
              <span class="stat-label">Previous Hash</span>
              <div class="hash-text">${block.previousHash}</div>
            </div>
            <div class="block-row">
              <span class="stat-label">Current Hash</span>
              <div class="hash-text">${block.hash}</div>
            </div>
          </div>
        </article>
      `
    )
    .join("");
};

const loadBlockchain = async () => {
  try {
    showAlert("Loading blockchain data...", "info");
    const result = await apiRequest("/api/public/blockchain");
    renderBlocks(result.data?.chain || []);
    showAlert("Blockchain explorer updated successfully.", "success");
  } catch (error) {
    showAlert(error.message, "error");
  }
};

const verifyBlockchain = async () => {
  try {
    const result = await apiRequest("/api/public/blockchain/verify");
    const isValid = Boolean(result.data?.valid);
    setBadge(isValid ? "Valid" : "Invalid", isValid ? "success" : "error");
    showAlert(result.message, isValid ? "success" : "error");
  } catch (error) {
    showAlert(error.message, "error");
    setBadge("Unavailable", "neutral");
  }
};

refreshChainButton.addEventListener("click", loadBlockchain);
verifyChainButton.addEventListener("click", verifyBlockchain);

const initializePage = async () => {
  await Promise.all([loadBlockchain(), verifyBlockchain()]);
};

initializePage();
