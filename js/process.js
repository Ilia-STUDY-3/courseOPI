let currentChampionElement = null;
let guides = {}; // загруженные гайды
let champ = []; // список чемпионов, из guides
let activeRole = 'all';

// === guidesE.json ===
async function loadGuides() {
  try {
    const response = await fetch('guidesE.json');
    const data = await response.json();
    guides = {};

    // массив в объект по id
    data.forEach(ch => {
      guides[ch.id] = ch;
    });

    // массив champ для карточек чемпионов
    champ = data.map(ch => ({
      name: ch.title.split("—")[0].trim(),
      imgLink: ch.img,
      url: "#",
      id: ch.id,
      data_role: ch.role ? ch.role.toLowerCase() : "unknown"
    }));

    renderChampions();
  } catch (err) {
    console.error("Ошибка загрузки guidesE.json:", err);
  }
}

// === фильтрация по имени и роли ===
function filterChampions() {
  const searchTerm = document.getElementById('championSearch').value.toLowerCase();
  const championCards = document.querySelectorAll('.wf-home__champions__champion');
  championCards.forEach(card => {
    const name = card.dataset.name.toLowerCase();
    const role = card.dataset.role.toLowerCase();
    const matchesSearch = name.includes(searchTerm);
    const matchesRole = activeRole === 'all' || role.includes(activeRole);
    card.style.display = matchesSearch && matchesRole ? 'flex' : 'none';
  });
}

// === обработчики фильтрации ===
const searchInput = document.getElementById('championSearch');
const roleButtons = document.querySelectorAll('.role-btn');

searchInput.addEventListener('input', filterChampions);
roleButtons.forEach(button => {
  button.addEventListener('click', () => {
    roleButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    activeRole = button.dataset.role.toLowerCase();
    filterChampions();
  });
});

// === Основной рендеринг карточек ===
function renderChampions() {
  const container = document.querySelector('.champion-list');
  container.innerHTML = '';

  champ.forEach(ch => {
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'wf-home__champions__champion';
    link.dataset.name = ch.name;
    link.dataset.role = ch.data_role.trim();
    link.id = ch.id;

    link.innerHTML = `
      <img src="${ch.imgLink}" alt="${ch.name}">
      <span>${ch.name}</span>
    `;

    link.addEventListener('click', function (e) {
      e.preventDefault();
      const id = ch.id;
      currentChampionElement = link;
      if (guides[id]) {
        renderGuide(guides[id], id);
      } else {
        console.log(`Гайд для ${ch.name} ещё не готов.`);
      }
    });

    container.appendChild(link);
  });

  filterChampions(); // сразу применить фильтрацию
}

// === Рендер гайда ===
function renderGuide(guide, championKey) {
  document.getElementById('guide-title').textContent = guide.title;
  document.getElementById('guide-image').src = guide.img || '';
  document.getElementById('guide-image').style.display = guide.img ? 'block' : 'none';
  document.getElementById('guide-content').innerHTML = `<p>${guide.description}</p>`;

  const existingFormButtons = document.getElementById('kayn-form-buttons');
  if (existingFormButtons) existingFormButtons.remove();

  renderSkills(guide.skills);

  const extra = (typeof addGuides !== "undefined" && addGuides[championKey]) || {};
  renderTips(extra.tips);
  renderSkillPriority(extra.skillPriority);

  const guideSection = document.getElementById('guide-section');
  guideSection.style.display = 'block';

  scrollToGuide(() => {
    const tipsContainer = document.getElementById('tips-container');
    const skillPriorityContainer = document.getElementById('skill-priority-container');

    [guideSection, tipsContainer, skillPriorityContainer].forEach(el => {
      if (el) el.classList.remove('fade-in-scale', 'show');
    });

    setTimeout(() => {
      const wrapper = document.getElementById('guide-wrapper');
      const section = document.getElementById('guide-section');

      if (guideSection) animateFadeIn(guideSection);
      if (tipsContainer) animateFadeIn(tipsContainer);
      if (skillPriorityContainer) animateFadeIn(skillPriorityContainer);

      section.classList.add('show');
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 10);
  });
}

function renderSkills(skillsArray) {
  const skillsGrid = document.getElementById('skills-grid');
  if (skillsGrid) {
    skillsGrid.innerHTML = (
      (Array.isArray(skillsArray) ? skillsArray : []).map(skill => `
        <div class="skill-card">
          <img src="${skill.img}" alt="${skill.name}" class="skill-icon">
          <p><strong>${skill.name}</strong><br><em>${skill.title}</em><br>${skill.description}</p>
        </div>
      `).join('')
    );
  }
}

function renderTips(tipsArray) {
  const tipsList = document.getElementById("guide-tips-list");
  tipsList.innerHTML = "";

  if (Array.isArray(tipsArray)) {
    tipsArray.forEach(tip => {
      const li = document.createElement("li");
      li.textContent = tip;
      tipsList.appendChild(li);
    });
  } else {
    tipsList.innerHTML = "<li>Нет советов по игре.</li>";
  }
}

function renderSkillPriority(priorityData) {
  const skillOrderText = document.getElementById("guide-skill-order-text");

  if (Array.isArray(priorityData) && priorityData.length > 0) {
    skillOrderText.textContent = " " + priorityData.join(" → ");
  } else if (typeof priorityData === "string" && priorityData.trim() !== "") {
    skillOrderText.textContent = " " + priorityData.trim();
  } else {
    skillOrderText.textContent = "Информация о приоритете прокачки отсутствует.";
  }
}

function scrollToGuide(callback, duration = 500) {
  const target = document.getElementById('guide-section');
  const startPosition = window.scrollY;
  const targetPosition = target.getBoundingClientRect().top + startPosition;
  const distance = targetPosition - startPosition;
  let startTime = null;

  function animation(currentTime) {
    if (!startTime) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    } else if (typeof callback === 'function') {
      callback();
    }
  }

  function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  requestAnimationFrame(animation);
}

function closeGuide() {
  const guideSection = document.getElementById('guide-section');
  if (!guideSection) return;

  guideSection.classList.remove('show');

  if (currentChampionElement) {
    currentChampionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    currentChampionElement.classList.add('highlight');

    const elementToUnhighlight = currentChampionElement;
    setTimeout(() => {
      elementToUnhighlight.classList.remove('highlight');
    }, 2300);
  }

  setTimeout(() => {
    guideSection.style.display = 'none';
    currentChampionElement = null;
  }, 300);
}

function animateFadeIn(element) {
  element.classList.add('fade-in-scale');
  setTimeout(() => element.classList.add('show'), 100);
}

document.addEventListener('DOMContentLoaded', () => {
  const closeButton = document.getElementById('close-guide-btn');
  if (closeButton) {
    closeButton.addEventListener('click', closeGuide);
  }

  loadGuides();
});
