(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const svgNS = 'http://www.w3.org/2000/svg';
  const fmt = new Intl.NumberFormat('de-DE');
  const storageGet = (key) => { try { return window.localStorage.getItem(key); } catch { return null; } };
  const storageSet = (key, value) => { try { window.localStorage.setItem(key, value); } catch { /* storage can be unavailable */ } };
  const dateFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const rotationDefinitions = [
    {
      key: 'raum',
      title: 'Stadt & Raum',
      period: 'MONAT 01–06',
      subtitle: 'Stadtentwicklung, Fläche und Beteiligung',
      description: 'Planungsverfahren und Ortsentwicklung als Zusammenspiel von Fachlichkeit, Interessen, Zeit und transparenter Kommunikation steuern.',
      deliverables: ['Stakeholder- & Entscheidungslandkarte', 'Meilenstein- und Beteiligungsplan', 'Gremienfähige Statuslogik'],
      output: 'Ein belastbarer Projektauftrag mit klarer Entscheidungsarchitektur'
    },
    {
      key: 'technik',
      title: 'Technik & Klima',
      period: 'MONAT 07–12',
      subtitle: 'Bau, Infrastruktur, Energie und Umsetzung',
      description: 'Technische Vorhaben mit Termin-, Risiko- und Nutzenfokus begleiten und zwischen Fachplanung, Betrieb und Nutzerperspektive übersetzen.',
      deliverables: ['Risiko- & Abhängigkeitsregister', 'Nutzen-/Wirkungsbaseline', 'Pilot- und Inbetriebnahmeplan'],
      output: 'Ein umsetzbarer Pilot mit messbarer technischer Wirkung'
    },
    {
      key: 'bildung',
      title: 'Bildung & Teilhabe',
      period: 'MONAT 13–18',
      subtitle: 'Services, Zielgruppen und Mitmach-Kultur',
      description: 'Leistungen konsequent aus Sicht der Menschen gestalten und unterschiedliche Perspektiven in ein gemeinsames Zielbild bringen.',
      deliverables: ['Service Journey & Bedarfskarte', 'Fachamtsübergreifende RACI', 'Feedback- und Lernschleife'],
      output: 'Ein abgestimmtes Servicekonzept mit nachvollziehbarer Wirkung'
    },
    {
      key: 'digital',
      title: 'Digital & Prozess',
      period: 'MONAT 19–24',
      subtitle: 'Prozessoptimierung, Daten und Transfer',
      description: 'Erfahrungen aus den Stationen in schlanke Prozesse, Kennzahlen und übertragbare Arbeitsweisen übersetzen.',
      deliverables: ['Ist-/Zielprozess und Business Case', 'KPI-Dashboard & Entscheidungslog', 'Transfer-Playbook für Fachämter'],
      output: 'Ein skalierbares Vorgehensmodell für weitere Verwaltungsprojekte'
    }
  ];

  const rotationByCluster = {
    'Stadtentwicklung': 'raum',
    'Infrastruktur & Fläche': 'raum',
    'Technische Projekte': 'technik',
    'Klima & Energie': 'technik',
    'Bildung & Betreuung': 'bildung',
    'Beteiligung & Soziales': 'bildung',
    'Prozessoptimierung': 'digital'
  };

  const riskWeight = { niedrig: 24, mittel: 62, hoch: 100 };
  const riskColor = { niedrig: '#24a979', mittel: '#efad3d', hoch: '#df5b55' };
  const viewTitles = {
    mission: 'Mission Control',
    portfolio: 'Portfolio 360°',
    studio: 'Projektwerkstatt',
    decision: 'Entscheidungsbrief',
    process: 'Prozess-Lab',
    rotation: '24-Monate-Rotation',
    fit: 'Warum Haydar?'
  };

  const projects = (window.HBG_PROJECTS || []).map((project) => {
    const rotationKey = rotationByCluster[project.cluster] || 'digital';
    const rotation = rotationDefinitions.find((item) => item.key === rotationKey);
    const demo = project.demo || { impact: 50, coordination: 50, urgency: 50, data: 50, risk: 'mittel' };
    const score = Math.min(100, Math.round(
      demo.impact * 0.36 +
      demo.urgency * 0.26 +
      demo.coordination * 0.24 +
      (riskWeight[demo.risk] || 62) * 0.14
    ));
    return {
      ...project,
      rotationKey,
      rotationTitle: rotation.title,
      score,
      districtLabel: project.districts?.length ? project.districts.join(', ') : 'Gesamtstadt',
      updatedLabel: safeDate(project.updatedAt)
    };
  }).sort((a, b) => b.score - a.score);

  const state = {
    view: 'mission',
    selectedId: Number(storageGet('stadtpilot:selected')) || projects[0]?.id,
    studioTab: 'charter',
    filter: { query: '', rotation: 'all', status: 'all' },
    actionStates: loadJson('stadtpilot:actions', {}),
    tourIndex: 0
  };

  function safeDate(value) {
    if (!value) return '–';
    const parsed = new Date(`${value}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? value : dateFmt.format(parsed);
  }

  function loadJson(key, fallback) {
    try {
      const parsed = JSON.parse(storageGet(key));
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage can be disabled */ }
  }

  function selectedProject() {
    return projects.find((project) => project.id === state.selectedId) || projects[0];
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
  }

  function shortTitle(title, max = 30) {
    if (!title || title.length <= max) return title;
    return `${title.slice(0, max - 1).trim()}…`;
  }

  function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => node.classList.remove('show'), 2600);
  }

  function setView(view, { scroll = true } = {}) {
    if (!viewTitles[view]) return;
    state.view = view;
    $$('.view').forEach((node) => node.classList.toggle('active', node.id === `view-${view}`));
    $$('.nav-item').forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    $('#viewTitle').textContent = viewTitles[view];
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobileNav();
    if (view === 'portfolio') renderPortfolio();
    if (view === 'studio') renderStudio();
    if (view === 'decision') renderBriefing();
    if (view === 'process') renderProcess();
    if (view === 'rotation') renderRotation();
    if (view === 'fit') renderFit();
    try { history.replaceState(null, '', `#${view}`); } catch { /* opaque origins may block history writes */ }
  }

  function selectProject(id, { syncSelects = true } = {}) {
    if (!projects.some((project) => project.id === Number(id))) return;
    state.selectedId = Number(id);
    storageSet('stadtpilot:selected', String(state.selectedId));
    if (syncSelects) {
      ['studioProjectSelect', 'briefingProjectSelect', 'pilotProjectSelect'].forEach((selectId) => {
        const select = $(`#${selectId}`);
        if (select) select.value = String(state.selectedId);
      });
    }
    renderSignal();
    renderMissionMatrix();
    renderProjectList();
    renderProjectDetail();
    renderStudio();
    renderBriefing();
    renderRotation();
  }

  function initNavigation() {
    $$('.nav-item').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
    $$('[data-view-link]').forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      setView(link.dataset.viewLink);
    }));
    document.addEventListener('click', (event) => {
      const jump = event.target.closest('[data-jump]');
      if (jump) setView(jump.dataset.jump);
    });

    const hashView = window.location.hash.replace('#', '');
    if (viewTitles[hashView]) setView(hashView, { scroll: false });
  }

  function initTheme() {
    const saved = storageGet('stadtpilot:theme');
    if (saved === 'dark') document.documentElement.dataset.theme = 'dark';
    $('#themeToggle').addEventListener('click', () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      if (dark) delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = 'dark';
      storageSet('stadtpilot:theme', dark ? 'light' : 'dark');
      toast(dark ? 'Helle Darstellung aktiviert' : 'Dunkle Darstellung aktiviert');
    });
  }

  function openMobileNav() {
    $('#sidebar').classList.add('open');
    $('#mobileMenu').setAttribute('aria-expanded', 'true');
    $('#sidebarBackdrop').hidden = false;
  }

  function closeMobileNav() {
    $('#sidebar').classList.remove('open');
    $('#mobileMenu').setAttribute('aria-expanded', 'false');
    $('#sidebarBackdrop').hidden = true;
  }

  function initMobileNav() {
    $('#mobileMenu').addEventListener('click', () => {
      if ($('#sidebar').classList.contains('open')) closeMobileNav(); else openMobileNav();
    });
    $('#sidebarBackdrop').addEventListener('click', closeMobileNav);
  }

  function initMethodology() {
    const dialog = $('#methodDialog');
    const open = () => typeof dialog.showModal === 'function' ? dialog.showModal() : dialog.setAttribute('open', '');
    const close = () => typeof dialog.close === 'function' ? dialog.close() : dialog.removeAttribute('open');
    ['openMethodology', 'openMethodology2'].forEach((id) => $(`#${id}`).addEventListener('click', open));
    ['closeMethodology', 'methodOk'].forEach((id) => $(`#${id}`).addEventListener('click', close));
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
  }

  function fillProjectSelects() {
    const options = projects.map((project) => `<option value="${project.id}">${escapeHtml(shortTitle(project.title, 58))}</option>`).join('');
    ['studioProjectSelect', 'briefingProjectSelect', 'pilotProjectSelect'].forEach((id) => {
      const select = $(`#${id}`);
      select.innerHTML = options;
      select.value = String(state.selectedId);
      select.addEventListener('change', () => selectProject(select.value));
    });
  }

  function renderRotationMini() {
    $('#rotationMini').innerHTML = rotationDefinitions.map((item, index) => `
      <article>
        <span class="station-no">${String(index + 1).padStart(2, '0')}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.subtitle)}</p>
        <small>${item.period.replace('MONAT ', 'Monat ')}</small>
      </article>
    `).join('');
  }

  function createSvg(tag, attributes = {}, text = '') {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (text) node.textContent = text;
    return node;
  }

  function renderMissionMatrix() {
    const svg = $('#missionMatrix');
    if (!svg) return;
    svg.innerHTML = '';
    const plot = { left: 62, right: 590, top: 28, bottom: 280 };
    const width = plot.right - plot.left;
    const height = plot.bottom - plot.top;

    svg.appendChild(createSvg('rect', { x: plot.left + width * 0.52, y: plot.top, width: width * 0.48, height: height * 0.48, class: 'matrix-zone', rx: 12 }));
    svg.appendChild(createSvg('text', { x: plot.right - 8, y: plot.top + 17, class: 'matrix-zone-label', 'text-anchor': 'end' }, 'HOHER STEUERUNGSBEDARF'));

    [0, 25, 50, 75, 100].forEach((tick) => {
      const x = plot.left + (tick / 100) * width;
      const y = plot.bottom - (tick / 100) * height;
      svg.appendChild(createSvg('line', { x1: x, y1: plot.top, x2: x, y2: plot.bottom, class: 'matrix-grid' }));
      svg.appendChild(createSvg('line', { x1: plot.left, y1: y, x2: plot.right, y2: y, class: 'matrix-grid' }));
      if (tick < 100) {
        svg.appendChild(createSvg('text', { x, y: plot.bottom + 18, class: 'matrix-axis', 'text-anchor': 'middle' }, String(tick)));
        svg.appendChild(createSvg('text', { x: plot.left - 11, y: y + 3, class: 'matrix-axis', 'text-anchor': 'end' }, String(tick)));
      }
    });
    svg.appendChild(createSvg('text', { x: (plot.left + plot.right) / 2, y: 322, class: 'matrix-axis', 'text-anchor': 'middle' }, 'Koordinationskomplexität →'));
    const yLabel = createSvg('text', { x: 14, y: (plot.top + plot.bottom) / 2, class: 'matrix-axis', 'text-anchor': 'middle', transform: `rotate(-90 14 ${(plot.top + plot.bottom) / 2})` }, 'öffentliche Wirkung →');
    svg.appendChild(yLabel);

    projects.forEach((project, index) => {
      const x = plot.left + (project.demo.coordination / 100) * width;
      const y = plot.bottom - (project.demo.impact / 100) * height;
      const group = createSvg('g', { 'data-id': project.id, tabindex: '0', role: 'button', 'aria-label': `${project.title}, Wirkung ${project.demo.impact}, Koordination ${project.demo.coordination}` });
      const point = createSvg('circle', {
        cx: x,
        cy: y,
        r: project.id === state.selectedId ? 10 : Math.max(6, project.demo.urgency / 13),
        fill: riskColor[project.demo.risk] || riskColor.mittel,
        class: `matrix-point${project.id === state.selectedId ? ' active' : ''}`
      });
      point.appendChild(createSvg('title', {}, `${project.title} · Steuerungsbedarf ${project.score}/100`));
      group.appendChild(point);
      if (project.id === state.selectedId || index < 2) {
        const anchor = x > 470 ? 'end' : 'start';
        const dx = anchor === 'end' ? -12 : 12;
        group.appendChild(createSvg('text', { x: x + dx, y: y - 10, class: 'matrix-label', 'text-anchor': anchor }, shortTitle(project.title, 25)));
      }
      const choose = () => selectProject(project.id);
      group.addEventListener('click', choose);
      group.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') choose(); });
      svg.appendChild(group);
    });
  }

  function renderSignal() {
    const project = selectedProject();
    if (!project) return;
    $('#signalCluster').textContent = project.rotationTitle;
    $('#signalTitle').textContent = project.title;
    $('#signalSummary').textContent = managementLens(project);
    $('#signalScore').textContent = `${project.score}/100`;
    $('#signalUrgency').textContent = `${project.demo.urgency}/100`;
    $('#signalData').textContent = `${project.demo.data}/100`;
  }

  function managementLens(project) {
    const lenses = {
      raum: 'Hohe Schnittstellen- und Beteiligungsdichte: Früh ein gemeinsames Zielbild, Entscheidungsfenster und Abhängigkeiten sichern.',
      technik: 'Technische Wirkung entsteht erst mit klaren Abnahmen, Betriebsübergabe und messbarer Nutzenbaseline.',
      bildung: 'Hohe öffentliche Wirkung und viele Betroffene: Bedarf, Kapazität, Kommunikation und Umsetzungslogik gemeinsam steuern.',
      digital: 'Der größte Hebel liegt in einem kleinen messbaren Pilot, bevor ein Prozess verwaltungsweit skaliert wird.'
    };
    return lenses[project.rotationKey];
  }

  function renderMission() {
    renderMissionMatrix();
    renderSignal();
    renderRotationMini();
  }

  function setupPortfolioFilters() {
    const rotations = rotationDefinitions.map((item) => `<option value="${item.key}">${escapeHtml(item.title)}</option>`).join('');
    $('#rotationFilter').insertAdjacentHTML('beforeend', rotations);
    const statuses = [...new Set(projects.map((project) => project.status))].sort();
    $('#statusFilter').insertAdjacentHTML('beforeend', statuses.map((status) => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`).join(''));

    $('#projectSearch').addEventListener('input', (event) => { state.filter.query = event.target.value.trim().toLowerCase(); renderProjectList(); });
    $('#rotationFilter').addEventListener('change', (event) => { state.filter.rotation = event.target.value; renderProjectList(); });
    $('#statusFilter').addEventListener('change', (event) => { state.filter.status = event.target.value; renderProjectList(); });
    $('#resetFilters').addEventListener('click', () => {
      state.filter = { query: '', rotation: 'all', status: 'all' };
      $('#projectSearch').value = '';
      $('#rotationFilter').value = 'all';
      $('#statusFilter').value = 'all';
      renderProjectList();
    });
  }

  function filteredProjects() {
    return projects.filter((project) => {
      const haystack = `${project.title} ${project.cluster} ${project.rotationTitle} ${project.status} ${project.districtLabel} ${project.summary}`.toLowerCase();
      return (!state.filter.query || haystack.includes(state.filter.query)) &&
        (state.filter.rotation === 'all' || project.rotationKey === state.filter.rotation) &&
        (state.filter.status === 'all' || project.status === state.filter.status);
    });
  }

  function renderProjectList() {
    const filtered = filteredProjects();
    $('#resultCount').textContent = String(filtered.length);
    $('#projectList').innerHTML = filtered.length ? filtered.map((project) => `
      <button class="project-row${project.id === state.selectedId ? ' active' : ''}" data-project-id="${project.id}">
        <span class="project-main"><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.districtLabel)} · aktualisiert ${project.updatedLabel}</small></span>
        <span class="rotation-chip">${escapeHtml(project.rotationTitle)}</span>
        <span class="status-chip">${escapeHtml(project.status)}</span>
        <span class="score-pill">${project.score}</span>
      </button>
    `).join('') : '<div class="empty-state">Keine Vorhaben für diese Filterkombination.</div>';
    $$('.project-row', $('#projectList')).forEach((row) => row.addEventListener('click', () => selectProject(row.dataset.projectId)));
  }

  function renderProjectDetail() {
    const project = selectedProject();
    if (!project) return;
    const source = project.sourceUrl ? `<a class="text-button" href="${project.sourceUrl}" target="_blank" rel="noreferrer">Quelle öffnen ↗</a>` : '';
    $('#projectDetail').innerHTML = `
      <div class="detail-top"><span class="detail-id">PROJEKT ${project.id} · <span class="legend-dot official"></span> QUELLFELDER</span>${source}</div>
      <h3>${escapeHtml(project.title)}</h3>
      <p class="detail-summary">${escapeHtml(project.summary)}</p>
      <div class="detail-meta">
        <div><span>Rotationsfeld</span><strong>${escapeHtml(project.rotationTitle)}</strong></div>
        <div><span>Status</span><strong>${escapeHtml(project.status)}</strong></div>
        <div><span>Gebiet</span><strong>${escapeHtml(project.districtLabel)}</strong></div>
        <div><span>Risiko · Demo</span><strong>${escapeHtml(project.demo.risk)}</strong></div>
      </div>
      <div class="score-bars">
        ${scoreBar('Wirkung', project.demo.impact)}
        ${scoreBar('Koordination', project.demo.coordination)}
        ${scoreBar('Dringlichkeit', project.demo.urgency)}
        ${scoreBar('Datenreife', project.demo.data)}
      </div>
      <div class="detail-next"><span>NÄCHSTER SINNVOLLER SCHRITT · DEMO</span><p>${escapeHtml(nextBestAction(project))}</p></div>
      <div class="detail-actions"><button class="button soft" id="detailStudio">Werkstatt</button><button class="button lime" id="detailBrief">Briefing</button></div>
    `;
    $('#detailStudio').addEventListener('click', () => setView('studio'));
    $('#detailBrief').addEventListener('click', () => setView('decision'));
  }

  function scoreBar(label, value) {
    return `<div class="score-row"><span>${label}</span><div class="score-track"><i style="width:${value}%"></i></div><b>${value}</b></div>`;
  }

  function nextBestAction(project) {
    const actions = {
      raum: `In einem 60-minütigen Alignment-Termin Zielbild, offene Entscheidungen und Beteiligungsfenster für „${project.title}“ verbindlich machen.`,
      technik: `Eine technische Nutzenbaseline, Abnahmekriterien und die drei kritischsten Betriebsabhängigkeiten für „${project.title}“ festhalten.`,
      bildung: `Bedarf, Kapazität und betroffene Zielgruppen in einem gemeinsamen Servicebild zusammenführen und den Pilot-Scope bestätigen.`,
      digital: `Einen repräsentativen Teilprozess auswählen, Ist-Zeit messen und innerhalb von 30 Tagen einen testbaren Zielprozess pilotieren.`
    };
    return actions[project.rotationKey];
  }

  function renderRotationBars() {
    const counts = rotationDefinitions.map((rotation) => ({
      ...rotation,
      count: projects.filter((project) => project.rotationKey === rotation.key).length
    }));
    const max = Math.max(...counts.map((item) => item.count), 1);
    $('#rotationBars').innerHTML = counts.map((item) => `
      <div class="bar-item"><span>${escapeHtml(item.title)}</span><div class="bar-track"><i style="width:${(item.count / max) * 100}%"></i></div><strong>${item.count}</strong></div>
    `).join('');
  }

  function hashPosition(value, index) {
    let hash = 0;
    for (const char of String(value)) hash = ((hash << 5) - hash) + char.charCodeAt(0);
    return 18 + Math.abs(hash + index * 97) % 64;
  }

  function renderCityMap() {
    const map = $('#cityMap');
    map.innerHTML = '<div class="map-center">KERNSTADT</div>';
    const withCoords = projects.filter((project) => Number.isFinite(project.lat) && Number.isFinite(project.lon));
    const latValues = withCoords.map((project) => project.lat);
    const lonValues = withCoords.map((project) => project.lon);
    const minLat = Math.min(...latValues, 48.56);
    const maxLat = Math.max(...latValues, 48.63);
    const minLon = Math.min(...lonValues, 8.82);
    const maxLon = Math.max(...lonValues, 8.91);

    projects.slice(0, 9).forEach((project, index) => {
      const x = Number.isFinite(project.lon) ? 10 + ((project.lon - minLon) / Math.max(maxLon - minLon, 0.01)) * 78 : hashPosition(project.title, index);
      const y = Number.isFinite(project.lat) ? 83 - ((project.lat - minLat) / Math.max(maxLat - minLat, 0.01)) * 68 : hashPosition(project.title.split('').reverse().join(''), index);
      const marker = document.createElement('button');
      marker.className = 'map-marker';
      marker.style.left = `${Math.min(89, Math.max(6, x))}%`;
      marker.style.top = `${Math.min(87, Math.max(8, y))}%`;
      marker.setAttribute('aria-label', project.title);
      marker.innerHTML = `<span>${escapeHtml(shortTitle(project.districtLabel, 18))}</span>`;
      marker.addEventListener('click', () => selectProject(project.id));
      map.appendChild(marker);
    });
  }

  function renderPortfolio() {
    renderProjectList();
    renderProjectDetail();
    renderRotationBars();
    renderCityMap();
  }

  function charterContent(project) {
    return [
      {
        icon: '01', title: 'Zielbild',
        body: `Für „${project.title}“ liegt nach 90 Tagen ein abgestimmter Projektauftrag mit messbarer Baseline, benannten Verantwortungen und einer belastbaren nächsten Entscheidung vor.`
      },
      {
        icon: '02', title: 'Pilot-Scope',
        body: `Ein klar abgegrenzter, innerhalb von 30 bis 60 Tagen testbarer Teil des Vorhabens – klein genug zum Lernen, relevant genug für eine echte Entscheidung.`
      },
      {
        icon: '03', title: 'Nutzen-KPIs',
        list: [`1 Wirkungskennzahl für ${project.rotationTitle}`, '1 Termin-/Durchlaufzeit-KPI', '1 Akzeptanz- oder Qualitätsindikator']
      },
      {
        icon: '04', title: 'Lieferobjekte',
        list: ['Projektcharter & RACI', 'Risiko- und Entscheidungslog', 'Pilot-Ergebnis & Management-One-Pager']
      },
      {
        icon: '05', title: 'Steuerungstakt',
        list: ['Wöchentlich: 30 Min. operatives Sync', '14-tägig: Sponsor-Check', 'Monatlich: Entscheidung / Lernreview']
      },
      {
        icon: '06', title: 'Nicht-Ziele',
        body: 'Keine vollständige Fachplanung im Prototyp, keine amtliche Priorisierung und keine Digitalisierung ohne vorher definierte Wirkung.'
      }
    ];
  }

  function renderStudio() {
    const project = selectedProject();
    if (!project) return;
    $('#studioProjectSelect').value = String(project.id);
    $('#studioCode').textContent = `PROJEKT ${project.id} · ${project.rotationTitle.toUpperCase()}`;
    $('#studioTitle').textContent = project.title;
    $('#studioSummary').textContent = project.summary;
    const ring = $('#studioScoreRing');
    ring.style.setProperty('--score-angle', `${project.score * 3.6}deg`);
    $('strong', ring).textContent = project.score;

    $('#charterGrid').innerHTML = charterContent(project).map((item) => `
      <article class="charter-card"><span class="charter-icon">${item.icon}</span><h3>${escapeHtml(item.title)}</h3>${item.list ? `<ul>${item.list.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>` : `<p>${escapeHtml(item.body)}</p>`}</article>
    `).join('');
    $('#decisionQuestion').textContent = decisionQuestion(project);
    renderStakeholderMap(project);
    renderRaci(project);
    renderRisks(project);
    renderActionBoard(project);
  }

  function initStudioTabs() {
    $$('.studio-tab').forEach((button) => button.addEventListener('click', () => {
      state.studioTab = button.dataset.studioTab;
      $$('.studio-tab').forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      $$('.studio-pane').forEach((pane) => pane.classList.toggle('active', pane.id === `studio-${state.studioTab}`));
    }));
  }

  function decisionQuestion(project) {
    const questions = {
      raum: `Welcher räumliche und beteiligungsbezogene Pilot für „${project.title}“ wird jetzt mandatiert – und welche Entscheidung muss bis Tag 90 vorbereitet sein?`,
      technik: `Welcher technische Pilot für „${project.title}“ kann innerhalb von 90 Tagen Wirkung, Risiken und Betriebsfähigkeit belastbar belegen?`,
      bildung: `Welcher klar abgegrenzte Service- oder Kapazitätspilot für „${project.title}“ wird mit welchen Zielgruppen und Erfolgskriterien gestartet?`,
      digital: `Welcher Teilprozess wird als 90-Tage-Pilot freigegeben, um Zeit, Übergaben und Qualität nachweisbar zu verbessern?`
    };
    return questions[project.rotationKey];
  }

  function stakeholdersFor(project) {
    const common = [
      { name: 'Verwaltungsspitze / Sponsor', influence: 94, affected: 70, high: true },
      { name: 'Federführendes Fachamt', influence: 88, affected: 91, high: true },
      { name: 'Gemeinderat / Ausschuss', influence: 91, affected: 63, high: true }
    ];
    const specific = {
      raum: [
        { name: `Bürgerschaft / ${project.districtLabel}`, influence: 58, affected: 94 },
        { name: 'Planung, Umwelt & Mobilität', influence: 79, affected: 77 },
        { name: 'Eigentümer / Wirtschaft / Träger', influence: 73, affected: 72 }
      ],
      technik: [
        { name: 'Technisches Fachamt / Betrieb', influence: 84, affected: 88 },
        { name: 'Fachplanung & Auftragnehmer', influence: 70, affected: 67 },
        { name: 'Nutzende / Vereine / Einrichtungen', influence: 49, affected: 92 }
      ],
      bildung: [
        { name: 'Schulen / Träger / Leitungen', influence: 78, affected: 95 },
        { name: 'Familien, Kinder & Jugendliche', influence: 47, affected: 99 },
        { name: 'Personal, Finanzen & Organisation', influence: 76, affected: 73 }
      ],
      digital: [
        { name: 'Prozessverantwortliche', influence: 85, affected: 90 },
        { name: 'IT, Daten & Datenschutz', influence: 80, affected: 72 },
        { name: 'Mitarbeitende / Nutzende', influence: 48, affected: 96 }
      ]
    };
    return [...common, ...specific[project.rotationKey]];
  }

  function renderStakeholderMap(project) {
    $('#stakeholderMap').innerHTML = stakeholdersFor(project).map((stakeholder) => `
      <div class="stakeholder-node${stakeholder.high ? ' high' : ''}" style="left:${8 + stakeholder.influence * .84}%;top:${94 - stakeholder.affected * .84}%">${escapeHtml(stakeholder.name)}</div>
    `).join('');
  }

  function renderRaci(project) {
    const rows = [
      ['Projektauftrag bestätigen', 'R', 'A', 'C', 'I'],
      ['Fachliche Baseline erheben', 'R', 'I', 'A', 'I'],
      ['Pilot planen & koordinieren', 'R', 'A', 'C', 'I'],
      ['Risiken / Entscheidungen eskalieren', 'R', 'A', 'C', 'I'],
      ['Gremienvorlage freigeben', 'C', 'A', 'C', 'I'],
      ['Wirkung messen & Lernen sichern', 'R', 'A', 'C', 'I']
    ];
    const headers = ['Arbeitspaket', 'Projekt-\nleitung', 'Sponsor', 'Fachämter', 'Gremien'];
    $('#raciTable').innerHTML = headers.map((header, index) => `<div class="raci-head" style="white-space:pre-line;${index === 0 ? 'justify-content:flex-start' : ''}">${header}</div>`).join('') + rows.map((row) => row.map((cell, index) => index === 0 ? `<div class="raci-role">${escapeHtml(cell)}</div>` : `<div class="raci-letter ${cell}">${cell}</div>`).join('')).join('');
  }

  function risksFor(project) {
    const riskLevel = project.demo.risk;
    const specific = {
      raum: ['Unklare oder spät veränderte Planungs- und Beteiligungsanforderungen', 'Abhängigkeiten zwischen Flächen, Genehmigungen und externen Akteuren'],
      technik: ['Termin- oder Kostenabweichung durch technische Schnittstellen', 'Unklare Abnahme- und Betriebsübergabekriterien'],
      bildung: ['Bedarfs- und Kapazitätsannahmen verändern sich während der Umsetzung', 'Akzeptanzrisiko bei unterschiedlichen Zielgruppen und Standorten'],
      digital: ['Digitalisierung bildet einen ungeklärten Ist-Prozess nur technisch nach', 'Datenschutz, Schnittstellen oder Datenqualität bremsen den Pilot']
    }[project.rotationKey];
    return [
      { id: 'R-01', text: specific[0], likelihood: riskLevel === 'hoch' ? 'hoch' : 'mittel', impact: 'hoch', mitigation: 'Früher Annahmen- und Schnittstellenworkshop; Owner und Prüftermin je Annahme.' },
      { id: 'R-02', text: specific[1], likelihood: 'mittel', impact: riskLevel === 'niedrig' ? 'mittel' : 'hoch', mitigation: 'Abhängigkeiten im Wochenrhythmus prüfen und Entscheidungen mit Fälligkeit loggen.' },
      { id: 'R-03', text: 'Ressourcenengpass oder konkurrierende Prioritäten in beteiligten Fachämtern', likelihood: 'mittel', impact: 'mittel', mitigation: 'Minimalen Pilot-Scope, klare Zeitfenster und Sponsor-Eskalationsweg vereinbaren.' },
      { id: 'R-04', text: 'Zu wenig belastbare Daten für Wirkungsmessung und Gremienkommunikation', likelihood: project.demo.data < 75 ? 'hoch' : 'mittel', impact: 'mittel', mitigation: 'Eine kleine Baseline vor Pilotstart erheben und Datenlücken sichtbar kennzeichnen.' }
    ];
  }

  function renderRisks(project) {
    const risks = risksFor(project);
    const highCount = risks.filter((risk) => risk.likelihood === 'hoch' || risk.impact === 'hoch').length;
    $('#riskSummary').innerHTML = `
      <article><strong>${risks.length}</strong><span>aktive Demo-Risiken</span></article>
      <article><strong>${highCount}</strong><span>mit hoher Dimension</span></article>
      <article><strong>100 %</strong><span>mit Maßnahme & Owner-Logik</span></article>
    `;
    $('#riskRegister').innerHTML = `
      <div class="risk-table-head"><span>ID</span><span>Risiko</span><span>Eintritt</span><span>Auswirkung</span><span>Gegenmaßnahme</span></div>
      ${risks.map((risk) => `<div class="risk-row"><span class="risk-id">${risk.id}</span><strong>${escapeHtml(risk.text)}</strong><span class="risk-level ${risk.likelihood}">${risk.likelihood}</span><span class="risk-level ${risk.impact}">${risk.impact}</span><span>${escapeHtml(risk.mitigation)}</span></div>`).join('')}
    `;
  }

  function actionTemplates(project) {
    return [
      { id: 'A01', title: 'Projektauftrag schärfen', text: `Ziel, Nicht-Ziele und Entscheidung für „${project.title}“ bestätigen.`, owner: 'Projektleitung', status: 'next' },
      { id: 'A02', title: 'Stakeholder-Interviews', text: 'Sechs Perspektiven in 30-minütigen Gesprächen erfassen.', owner: 'Projektleitung', status: 'next' },
      { id: 'A03', title: 'Baseline definieren', text: 'Ein Wirkungs-, ein Zeit- und ein Qualitätsmaß festlegen.', owner: 'Fachamt + Daten', status: 'next' },
      { id: 'A04', title: 'Risiko-Workshop', text: 'Top-Abhängigkeiten, Annahmen und Eskalationswege klären.', owner: 'Projektteam', status: 'doing' },
      { id: 'A05', title: 'Pilot-Scope abstimmen', text: 'Kleinsten wertvollen Pilot mit 30–60 Tagen Laufzeit auswählen.', owner: 'Sponsor', status: 'doing' },
      { id: 'A06', title: 'Kommunikation vorbereiten', text: 'Kernbotschaft, Zielgruppen und Feedbackkanal definieren.', owner: 'Fachamt', status: 'doing' },
      { id: 'A07', title: 'Pilotmandat', text: 'Ressourcen, Owner und Erfolgskriterien bestätigen.', owner: 'Sponsor', status: 'decision' },
      { id: 'A08', title: 'Gremienfenster sichern', text: 'Termin, Vorlauf und erforderliche Vorlage verbindlich machen.', owner: 'Geschäftsstelle', status: 'decision' },
      { id: 'A09', title: 'Skalierungsregel', text: 'Vorab definieren, wann Pilot fortgeführt, angepasst oder beendet wird.', owner: 'Steuerungsrunde', status: 'decision' }
    ];
  }

  function projectActionState(project) {
    if (!state.actionStates[project.id]) state.actionStates[project.id] = {};
    return state.actionStates[project.id];
  }

  function renderActionBoard(project) {
    const stored = projectActionState(project);
    const tasks = actionTemplates(project).map((task) => ({ ...task, status: stored[task.id] || task.status }));
    const columns = [
      { key: 'next', title: 'Nächster Schritt' },
      { key: 'doing', title: 'In Abstimmung' },
      { key: 'decision', title: 'Entscheidung nötig' }
    ];
    $('#actionBoard').innerHTML = columns.map((column) => {
      const columnTasks = tasks.filter((task) => task.status === column.key);
      return `<section class="board-column"><div class="board-column-head"><strong>${column.title}</strong><span>${columnTasks.length}</span></div>${columnTasks.map((task) => `
        <article class="action-card"><div class="action-meta"><span>${task.id}</span><span>${escapeHtml(task.owner)}</span></div><h4>${escapeHtml(task.title)}</h4><p>${escapeHtml(task.text)}</p><button data-move-task="${task.id}">${column.key === 'decision' ? 'Zurück an Start ↺' : 'Weiter →'}</button></article>
      `).join('')}</section>`;
    }).join('');
    $$('[data-move-task]', $('#actionBoard')).forEach((button) => button.addEventListener('click', () => {
      const taskId = button.dataset.moveTask;
      const current = tasks.find((task) => task.id === taskId)?.status || 'next';
      const next = current === 'next' ? 'doing' : current === 'doing' ? 'decision' : 'next';
      stored[taskId] = next;
      saveJson('stadtpilot:actions', state.actionStates);
      renderActionBoard(project);
      toast(`Aufgabe ${taskId} verschoben`);
    }));
  }

  function riskSentence(project) {
    const risks = risksFor(project).slice(0, 2);
    return risks.map((risk) => risk.text).join('; ');
  }

  function recommendation(project) {
    const base = {
      raum: 'Ein 90-Tage-Mandat für Zielbild, Beteiligungsarchitektur und einen klar abgegrenzten Planungs-/Kommunikationspilot erteilen.',
      technik: 'Einen technischen Pilot mit Nutzenbaseline, Abnahmekriterien und gesichertem Betriebsübergang freigeben.',
      bildung: 'Einen standort- oder servicebezogenen Pilot mit gemeinsam bestätigten Bedarfs-, Kapazitäts- und Qualitätskriterien starten.',
      digital: 'Einen repräsentativen Teilprozess als 90-Tage-Pilot freigeben und Skalierung erst nach gemessener Wirkung entscheiden.'
    };
    return base[project.rotationKey];
  }

  function renderBriefing() {
    const project = selectedProject();
    if (!project) return;
    $('#briefingProjectSelect').value = String(project.id);
    const topRisks = risksFor(project).slice(0, 3);
    $('#briefingSheet').innerHTML = `
      <header class="briefing-header">
        <div class="briefing-brand"><span class="briefing-logo">360°</span><div><strong>StadtPilot 360°</strong><small>Unabhängiger Bewerbungsprototyp · Haydar Kozat</small></div></div>
        <div class="briefing-meta">MANAGEMENT ONE-PAGER · DEMO<br>Stand ${new Date().toLocaleDateString('de-DE')} · Projekt-ID ${project.id}</div>
      </header>
      <section class="briefing-title"><span class="brief-label">ENTSCHEIDUNGSBRIEF · ${escapeHtml(project.rotationTitle).toUpperCase()}</span><h2>${escapeHtml(project.title)}</h2><p>${escapeHtml(project.summary)}</p></section>
      <div class="brief-score-grid">
        <div><strong>${project.score}</strong><span>Steuerungsbedarf*</span></div>
        <div><strong>${project.demo.impact}</strong><span>Wirkung*</span></div>
        <div><strong>${project.demo.coordination}</strong><span>Koordination*</span></div>
        <div><strong>${project.demo.urgency}</strong><span>Dringlichkeit*</span></div>
        <div><strong>${project.demo.data}</strong><span>Datenreife*</span></div>
      </div>
      <div class="briefing-body">
        <section class="brief-block"><h3>01 · Gesicherte Ausgangslage</h3><p><strong>Status:</strong> ${escapeHtml(project.status)} · <strong>Gebiet:</strong> ${escapeHtml(project.districtLabel)} · <strong>Quelle aktualisiert:</strong> ${project.updatedLabel}. Projektbeschreibung und Metadaten sind als offizielle Quellfelder gekennzeichnet.</p></section>
        <section class="brief-block"><h3>02 · Management-Lesart · Demo</h3><p>${escapeHtml(managementLens(project))}</p></section>
        <section class="brief-block accent"><h3>03 · Konkrete Entscheidungsfrage</h3><p class="brief-decision">${escapeHtml(decisionQuestion(project))}</p></section>
        <section class="brief-block"><h3>04 · Kritische Risiken · Demo</h3><ul>${topRisks.map((risk) => `<li>${escapeHtml(risk.text)}</li>`).join('')}</ul></section>
        <section class="brief-block full"><h3>05 · 90-Tage-Vorgehen</h3><ul><li><strong>Tag 1–30:</strong> Auftrag, Stakeholder, Baseline und Abhängigkeiten klären.</li><li><strong>Tag 31–60:</strong> Kleinsten wertvollen Pilot umsetzen und im festen Steuerungstakt synchronisieren.</li><li><strong>Tag 61–90:</strong> Wirkung messen, Lessons Learned sichern und Skalierungsentscheidung vorbereiten.</li></ul></section>
        <section class="brief-block dark full"><h3>06 · Empfehlung zur Entscheidung · Demo</h3><p>${escapeHtml(recommendation(project))}</p></section>
      </div>
      <footer class="briefing-footer"><span>* Scores, Risiken und Empfehlungen sind transparente Demonstrationsannahmen; keine amtliche Bewertung.</span><span>Quelle: ${project.sourceUrl ? escapeHtml(project.sourceUrl) : 'öffentlich zugängliche Projektinformationen der Stadt Herrenberg'}</span></footer>
    `;
  }

  function briefingText(project = selectedProject()) {
    const risks = risksFor(project).slice(0, 3).map((risk) => `- ${risk.text}`).join('\n');
    return `STADTPILOT 360° – MANAGEMENT ONE-PAGER (DEMO)\n\nPROJEKT\n${project.title}\n\nAUSGANGSLAGE\nStatus: ${project.status}\nGebiet: ${project.districtLabel}\nAktualisiert: ${project.updatedLabel}\n${project.summary}\n\nMANAGEMENT-LESART (DEMO)\n${managementLens(project)}\n\nENTSCHEIDUNGSFRAGE (DEMO)\n${decisionQuestion(project)}\n\nTOP-RISIKEN (DEMO)\n${risks}\n\n90-TAGE-VORGEHEN\n- Tag 1–30: Auftrag, Stakeholder, Baseline und Abhängigkeiten klären.\n- Tag 31–60: Kleinsten wertvollen Pilot umsetzen.\n- Tag 61–90: Wirkung messen und Skalierungsentscheidung vorbereiten.\n\nEMPFEHLUNG (DEMO)\n${recommendation(project)}\n\nHinweis: Scores, Risiken und Empfehlungen sind Demonstrationsannahmen, keine amtliche Bewertung.\nQuelle: ${project.sourceUrl || 'Stadt Herrenberg'}`;
  }

  function initBriefingActions() {
    $('#copyBrief').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(briefingText()); toast('Entscheidungsbrief kopiert'); }
      catch { fallbackCopy(briefingText()); }
    });
    $('#downloadBrief').addEventListener('click', () => {
      const project = selectedProject();
      downloadText(`StadtPilot360_Briefing_${project.id}.txt`, briefingText(project));
      toast('Briefing-Datei erstellt');
    });
    $('#printBrief').addEventListener('click', () => window.print());
    $('#openSignalBrief').addEventListener('click', () => setView('decision'));
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    toast('Text kopiert');
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const processDefaults = { cases: 4500, minutesBefore: 18, minutesAfter: 9, handoffsBefore: 5, handoffsAfter: 2, hourlyRate: 46, pilotCost: 28000 };
  const processIds = Object.keys(processDefaults);

  function processValues() {
    return Object.fromEntries(processIds.map((id) => [id, Number($(`#${id}`).value)]));
  }

  function renderProcess() {
    const values = processValues();
    $('#casesOut').textContent = fmt.format(values.cases);
    $('#minutesBeforeOut').textContent = `${values.minutesBefore} Min.`;
    $('#minutesAfterOut').textContent = `${values.minutesAfter} Min.`;
    $('#handoffsBeforeOut').textContent = String(values.handoffsBefore);
    $('#handoffsAfterOut').textContent = String(values.handoffsAfter);
    $('#hourlyRateOut').textContent = `${fmt.format(values.hourlyRate)} €`;
    $('#pilotCostOut').textContent = `${fmt.format(values.pilotCost)} €`;

    const savedMinutes = Math.max(0, values.minutesBefore - values.minutesAfter);
    const hours = values.cases * savedMinutes / 60;
    const annualValue = hours * values.hourlyRate;
    const timeReduction = values.minutesBefore ? savedMinutes / values.minutesBefore * 100 : 0;
    const handoffReduction = values.handoffsBefore ? Math.max(0, values.handoffsBefore - values.handoffsAfter) / values.handoffsBefore * 100 : 0;
    const payback = annualValue > 0 ? values.pilotCost / (annualValue / 12) : 0;

    $('#hoursSaved').textContent = fmt.format(Math.round(hours));
    $('#capacityValue').textContent = `${fmt.format(Math.round(annualValue))} €`;
    $('#timeReduction').textContent = `${Math.round(timeReduction)} %`;
    $('#handoffReduction').textContent = `${Math.round(handoffReduction)} %`;
    $('#paybackMonths').textContent = payback ? payback.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '–';

    const scenarios = [
      { name: 'Vorsichtig', factor: 0.65 },
      { name: 'Realistisch', factor: 1 },
      { name: 'Ambitioniert', factor: 1.25 }
    ];
    const maxValue = Math.max(...scenarios.map((scenario) => annualValue * scenario.factor), 1);
    $('#scenarioChart').innerHTML = scenarios.map((scenario) => {
      const value = annualValue * scenario.factor;
      return `<div class="scenario-row"><span>${scenario.name}</span><div class="scenario-track"><i style="width:${Math.min(100, value / maxValue * 100)}%"></i></div><strong>${fmt.format(Math.round(value))} €</strong></div>`;
    }).join('');

    $('#flowCompare').innerHTML = `
      <div class="flow-lane"><h4>HEUTE · ca. ${values.minutesBefore} Min. / ${values.handoffsBefore} Übergaben</h4><div class="flow-steps"><span class="flow-step">Eingang</span><span class="flow-arrow">→</span><span class="flow-step flow-break">Rückfrage</span><span class="flow-arrow">→</span><span class="flow-step">Excel / Liste</span><span class="flow-arrow">→</span><span class="flow-step flow-break">Medienbruch</span><span class="flow-arrow">→</span><span class="flow-step">Freigabe</span></div></div>
      <div class="flow-center">→</div>
      <div class="flow-lane"><h4>ZIEL · ca. ${values.minutesAfter} Min. / ${values.handoffsAfter} Übergaben</h4><div class="flow-steps"><span class="flow-step flow-good">Digitaler Eingang</span><span class="flow-arrow">→</span><span class="flow-step flow-good">Plausibilität</span><span class="flow-arrow">→</span><span class="flow-step flow-good">Fachprüfung</span><span class="flow-arrow">→</span><span class="flow-step flow-good">Freigabe + KPI</span></div></div>
    `;
  }

  function initProcess() {
    processIds.forEach((id) => $(`#${id}`).addEventListener('input', renderProcess));
    $('#resetProcess').addEventListener('click', () => {
      Object.entries(processDefaults).forEach(([id, value]) => { $(`#${id}`).value = String(value); });
      renderProcess();
      toast('Standardwerte wiederhergestellt');
    });
  }

  function renderRotationRoadmap() {
    $('#tourRotation').innerHTML = rotationDefinitions.map((item, index) => `
      <article class="rotation-station" data-number="${String(index + 1).padStart(2, '0')}">
        <span class="station-period">${item.period}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>
        <ul>${item.deliverables.map((deliverable) => `<li>${escapeHtml(deliverable)}</li>`).join('')}</ul>
        <div class="station-output"><span>ERGEBNIS</span><strong>${escapeHtml(item.output)}</strong></div>
      </article>
    `).join('');
  }

  function renderRotation() {
    const project = selectedProject();
    $('#pilotProjectSelect').value = String(project.id);
    const phases = [
      { number: '01', days: 'TAG 1–30', title: 'Verstehen & fokussieren', items: [`Projektauftrag für „${shortTitle(project.title, 42)}“ schärfen`, 'Stakeholder- und Entscheidungslandkarte erstellen', 'Baseline, Annahmen und Top-Risiken dokumentieren'], output: 'Charter + RACI + Pilot-Scope' },
      { number: '02', days: 'TAG 31–60', title: 'Pilotieren & synchronisieren', items: ['Kleinsten wertvollen Pilot umsetzen', 'Wöchentlichen Steuerungstakt führen', 'Entscheidungen und Blocker transparent loggen'], output: 'Funktionierender Pilot + Messwerte' },
      { number: '03', days: 'TAG 61–90', title: 'Wirkung belegen & skalieren', items: ['KPIs gegen Baseline auswerten', 'Lessons Learned mit Beteiligten sichern', 'Gremien-/Leitungsvorlage vorbereiten'], output: 'Entscheidung + Skalierungs-Roadmap' }
    ];
    $('#phaseTimeline').innerHTML = phases.map((phase) => `
      <article class="phase"><span class="phase-num">${phase.number}</span><span class="phase-days">${phase.days}</span><h4>${phase.title}</h4><ul>${phase.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><div class="phase-output">OUTPUT · ${escapeHtml(phase.output)}</div></article>
    `).join('');
  }

  const evidenceItems = [
    { requirement: 'Themenvielfalt', title: 'Vier Rotationsfelder in einem System', text: 'Der Prototyp verbindet Stadtentwicklung, Technik, Bildung/Teilhabe und Prozessoptimierung – genau die Breite, die das Trainee-Programm ermöglicht.', tag: 'Portfolio 360°' },
    { requirement: 'Eigeninitiative', title: 'Nicht gewartet – gebaut', text: 'Ausschreibung analysiert, offene Daten kuratiert, Projektmodell entworfen und eine funktionierende Ein-Datei-Demo umgesetzt.', tag: 'Working Prototype' },
    { requirement: 'Strukturiert & ergebnisorientiert', title: 'Vom Auftrag bis zur Entscheidung', text: 'Charter, RACI, Risikoregister, Aktionsboard, 90-Tage-Plan und klar definierte Outputs bilden einen durchgängigen Steuerungsweg.', tag: 'Projektwerkstatt' },
    { requirement: 'Fachämterübergreifend', title: 'Rollen und Schnittstellen sichtbar', text: 'Stakeholder-Matrix und RACI zeigen, wie Zusammenarbeit über Fachgrenzen hinweg konkret organisiert werden kann.', tag: 'Stakeholder & RACI' },
    { requirement: 'Kommunikationstalent', title: 'Komplexität adressatengerecht übersetzen', text: 'Das gleiche Vorhaben wird als Portfolio-Signal, Arbeitsauftrag und kompakter Management-One-Pager dargestellt.', tag: 'Entscheidungsbrief' },
    { requirement: 'Neue Wege', title: 'Open Data + Verwaltungsrealität', text: 'Offene Projektfelder werden nicht nur visualisiert, sondern in eine transparente, ethisch gekennzeichnete Entscheidungslogik überführt.', tag: 'Data Integrity' },
    { requirement: 'Master & Lernfähigkeit', title: 'Fachliche Tiefe trifft Praxiserfahrung', text: 'Masterabschluss, 16 Jahre Bildungs- und Digitalisierungspraxis sowie kontinuierlicher Ausbau von IT- und Sprachkompetenzen.', tag: 'Transferprofil' }
  ];

  const pitch = `Guten Tag, ich bin Haydar Kozat. Als ich Ihre Ausschreibung für die Junior-Projektleitung gelesen habe, wollte ich nicht nur schreiben, dass ich eigeninitiativ, strukturiert und fachämterübergreifend arbeite. Ich wollte es zeigen. Deshalb habe ich StadtPilot 360° entwickelt. Der Prototyp nutzt öffentlich zugängliche Herrenberger Projektinformationen und übersetzt sie in ein kommunales Projektcockpit. Sie sehen ein Portfolio über vier mögliche Rotationsfelder, eine transparente Priorisierungslogik, einen Projektauftrag mit Stakeholdern, RACI und Risiken sowie einen automatisch erzeugten One-Pager für Verwaltungsspitze und Gremien. Im Prozess-Lab wird außerdem sichtbar, wie ich Verbesserungen zuerst messbar mache, bevor ich sie skaliere. Mir ist wichtig: Offizielle Daten und eigene Demo-Annahmen sind klar getrennt. Dieses Projekt ist deshalb weniger eine fertige Software als eine Arbeitsprobe für meine Haltung: verstehen, verbinden, pilotieren, Wirkung belegen und daraus gemeinsam bessere Verwaltung machen.`;

  function renderFit() {
    $('#evidenceGrid').innerHTML = evidenceItems.map((item, index) => `
      <article class="evidence-card" data-no="${String(index + 1).padStart(2, '0')}"><span class="requirement">${escapeHtml(item.requirement)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p><span class="evidence-tag">${escapeHtml(item.tag)}</span></article>
    `).join('');
    $('#pitchText').textContent = pitch;
  }

  function initFitActions() {
    $('#copyPitch').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(pitch); toast('90-Sekunden-Pitch kopiert'); }
      catch { fallbackCopy(pitch); }
    });
  }

  const tourSteps = [
    { view: 'mission', selector: '#tourHero', title: '1. Ausschreibung in Lösung übersetzt', text: 'Die Startseite macht die Kernbotschaft sofort sichtbar: Eigeninitiative wird nicht behauptet, sondern mit einem funktionierenden, rollenbezogenen Prototyp belegt.' },
    { view: 'mission', selector: '#tourRequirements', title: '2. Anforderungen werden zu Artefakten', text: 'Themenvielfalt, Fachamtsarbeit, Eigeninitiative und Gremienkommunikation sind mit konkreten Funktionen des Projekts verknüpft.' },
    { view: 'portfolio', selector: '#tourPortfolio', title: '3. Vielfalt strukturiert steuern', text: 'Reale Vorhaben werden in vier Rotationsfelder übersetzt, gefiltert und nach einer offen erklärten Demo-Logik vergleichbar gemacht.' },
    { view: 'studio', selector: '#tourStudio', title: '4. Projektauftrag statt Bauchgefühl', text: 'Für jedes Vorhaben entstehen Zielbild, Scope, KPIs, RACI, Risiken und ein Aktionsboard – die Grundlage für eigenverantwortliche Projektarbeit.' },
    { view: 'decision', selector: '#tourDecision', title: '5. Gremien- und leitungsfähig kommunizieren', text: 'Ein dynamischer One-Pager trennt Quelle, Analyse, Risiko und Entscheidungsempfehlung und lässt sich kopieren, herunterladen oder als PDF drucken.' },
    { view: 'process', selector: '#tourProcess', title: '6. Wirkung vor Digitalisierung', text: 'Das Prozess-Lab macht Zeit, Übergaben, Kapazität und Amortisation sichtbar. So wird aus einer Idee ein prüfbarer Business Case.' },
    { view: 'rotation', selector: '#tourRotation', title: '7. Bis zu 24 Monate mit rotem Faden', text: 'Vier Stationen bauen methodisch aufeinander auf. Jede liefert ein wiederverwendbares Ergebnis für die nächste Station.' },
    { view: 'fit', selector: '#tourFit', title: '8. Der persönliche Fit wird beweisbar', text: 'Zum Abschluss zeigt eine Evidence Map, wie mein Profil und dieses Projekt die zentralen Anforderungen der Stelle konkret abdecken.' }
  ];

  function initTour() {
    $('#startTour').addEventListener('click', () => { state.tourIndex = 0; showTourStep(); });
    $('#tourNext').addEventListener('click', () => {
      if (state.tourIndex >= tourSteps.length - 1) return endTour(true);
      state.tourIndex += 1;
      showTourStep();
    });
    $('#tourBack').addEventListener('click', () => {
      if (state.tourIndex === 0) return;
      state.tourIndex -= 1;
      showTourStep();
    });
    $('#tourSkip').addEventListener('click', () => endTour(false));
    window.addEventListener('resize', positionTourSpotlight);
    window.addEventListener('scroll', positionTourSpotlight, { passive: true });
    document.addEventListener('keydown', (event) => {
      if ($('#tourOverlay').hidden) return;
      if (event.key === 'Escape') endTour(false);
      if (event.key === 'ArrowRight') $('#tourNext').click();
      if (event.key === 'ArrowLeft') $('#tourBack').click();
    });
  }

  function showTourStep() {
    const step = tourSteps[state.tourIndex];
    $('#tourOverlay').hidden = false;
    setView(step.view, { scroll: false });
    $('#tourStep').textContent = `${state.tourIndex + 1} / ${tourSteps.length}`;
    $('#tourTitle').textContent = step.title;
    $('#tourText').textContent = step.text;
    $('#tourProgressBar').style.width = `${((state.tourIndex + 1) / tourSteps.length) * 100}%`;
    $('#tourBack').disabled = state.tourIndex === 0;
    $('#tourNext').textContent = state.tourIndex === tourSteps.length - 1 ? 'Abschließen' : 'Weiter';
    requestAnimationFrame(() => {
      const target = $(step.selector);
      if (target) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      window.setTimeout(positionTourSpotlight, 350);
    });
  }

  function positionTourSpotlight() {
    if ($('#tourOverlay').hidden) return;
    const step = tourSteps[state.tourIndex];
    const target = $(step.selector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const padding = 9;
    const node = $('#tourSpotlight');
    node.style.left = `${Math.max(8, rect.left - padding)}px`;
    node.style.top = `${Math.max(8, rect.top - padding)}px`;
    node.style.width = `${Math.min(window.innerWidth - 16, rect.width + padding * 2)}px`;
    node.style.height = `${Math.min(window.innerHeight - 16, rect.height + padding * 2)}px`;
  }

  function endTour(completed) {
    $('#tourOverlay').hidden = true;
    if (completed) toast('Demo abgeschlossen – willkommen im StadtPilot 360°');
  }

  function init() {
    initNavigation();
    initTheme();
    initMobileNav();
    initMethodology();
    fillProjectSelects();
    setupPortfolioFilters();
    initStudioTabs();
    initBriefingActions();
    initProcess();
    initFitActions();
    initTour();
    renderMission();
    renderPortfolio();
    renderStudio();
    renderBriefing();
    renderProcess();
    renderRotationRoadmap();
    renderRotation();
    renderFit();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
