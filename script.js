let galleryData = [];
let categoryList = ["All"];

const state = {
  query: "",
  category: "All"
};

const galleryEl = document.getElementById("gallery");
const filterEl = document.getElementById("category-filters");
const searchInput = document.getElementById("search-input");
const emptyState = document.getElementById("empty-state");
const totalCount = document.getElementById("total-count");
const visibleCount = document.getElementById("visible-count");
const clearFiltersBtn = document.getElementById("clear-filters");
const userName = document.getElementById("user-name");
const logoutBtn = document.getElementById("logout-btn");

const debounce = (fn, delay = 180) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const matchesQuery = (item, query) => {
  if (!query) return true;
  const haystack = [
    item.title,
    item.category,
    item.location,
    item.tags.join(" ")
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
};

const getFiltered = () =>
  galleryData.filter((item) => {
    const categoryMatch =
      state.category === "All" || item.category === state.category;
    const queryMatch = matchesQuery(item, state.query);
    return categoryMatch && queryMatch;
  });

const updateCategories = () => {
  categoryList = ["All", ...new Set(galleryData.map((item) => item.category))];
};

const renderFilters = () => {
  filterEl.innerHTML = "";
  categoryList.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    if (category === state.category) button.classList.add("active");
    button.textContent = category;
    button.addEventListener("click", () => {
      state.category = category;
      renderFilters();
      renderGallery();
    });
    filterEl.appendChild(button);
  });
};

const renderGallery = () => {
  const filtered = getFiltered();
  galleryEl.innerHTML = filtered
    .map(
      (item) => `
      <article class="gallery-card">
        <img class="gallery-image" src="${item.image}" alt="${item.title}" loading="lazy" />
        <div class="gallery-body">
          <div class="flex items-center justify-between">
            <h3 class="gallery-title">${item.title}</h3>
            <span class="tag">${item.category}</span>
          </div>
          <div class="gallery-meta">
            <span>${item.location}</span>
            <span>${item.year}</span>
          </div>
          <div class="gallery-tags">
            ${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
        </div>
      </article>
    `
    )
    .join("");

  emptyState.classList.toggle("hidden", filtered.length > 0);
  totalCount.textContent = galleryData.length.toString();
  visibleCount.textContent = filtered.length.toString();
};

const loadUser = async () => {
  try {
    const response = await fetch("/api/me");
    if (!response.ok) {
      window.location.href = "/login.html";
      return;
    }
    const data = await response.json();
    userName.textContent = data.displayName || "Gallery User";
  } catch (error) {
    window.location.href = "/login.html";
  }
};

const loadGallery = async () => {
  try {
    const response = await fetch("/api/gallery");
    if (!response.ok) {
      throw new Error("Failed to load gallery");
    }
    galleryData = await response.json();
    updateCategories();
    renderFilters();
    renderGallery();
  } catch (error) {
    galleryEl.innerHTML = "";
    emptyState.classList.remove("hidden");
    totalCount.textContent = "0";
    visibleCount.textContent = "0";
  }
};

searchInput.addEventListener(
  "input",
  debounce((event) => {
    state.query = event.target.value.trim();
    renderGallery();
  })
);

clearFiltersBtn.addEventListener("click", () => {
  state.query = "";
  state.category = "All";
  searchInput.value = "";
  renderFilters();
  renderGallery();
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/login.html";
});

loadUser();
loadGallery();
