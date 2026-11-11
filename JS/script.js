/* =========================================================
   CLUBE DE REGATAS DO FLAMENGO
   PORTAL OFICIAL - TPS FUTEBOL DE RUA
   Arquivo: JS/script.js
   ========================================================= */

// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://zfulozynhalxgnmlcxfk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_o_jDKz6mHuVubA_fhAcYhQ_ajEmgFGe';

let supabaseClient = null;

try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    }
} catch (e) {
    console.warn("Erro ao iniciar Supabase:", e);
}

// --- ESTADO GLOBAL DA APLICAÇÃO ---
const AppState = {
    currentUser: null, // Se for "Lemos", tem acesso total
    isAdmin: false,
    season: 'S1',
    seasonNumber: 1,
    cash: 0,
    president: 'Koee_annaa',
    players: [],
    transfers: [],
    seasonsHistory: [],
    trophies: []
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupNavigation();
    setupModals();
    setupAdminLogin();
    setupEventListeners();
    
    // Simula carregamento inicial rápido e esconde a tela de loading
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 350);
        }
    }, 400);

    // Carrega dados locais ou do Supabase se disponível
    await loadInitialData();
    updateUI();
}

// --- CONTROLE DE NAVEGAÇÃO ---
function setupNavigation() {
    const navButtons = document.querySelectorAll('.sidebar-navigation .nav-item, [data-page]');
    const sections = document.querySelectorAll('.page-section');
    const pageNameEl = document.getElementById('current-page-name');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetPage = btn.getAttribute('data-page');
            if (!targetPage) return;
            
            // Remove active de todos
            document.querySelectorAll('.sidebar-navigation .nav-item').forEach(el => el.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));
            
            // Ativa o selecionado
            const targetNav = document.querySelector(`.sidebar-navigation .nav-item[data-page="${targetPage}"]`);
            if (targetNav) targetNav.classList.add('active');
            
            const targetSec = document.getElementById(`page-${targetPage}`);
            if (targetSec) {
                targetSec.classList.add('active');
                if (pageNameEl) {
                    pageNameEl.textContent = targetSec.querySelector('.page-header h1, .section-heading h2')?.textContent || targetPage;
                }
            }
            
            // Fecha o menu mobile se estiver aberto
            document.getElementById('sidebar')?.classList.remove('active');
            document.getElementById('sidebar-overlay')?.classList.remove('active');
        });
    });

    // Toggle menu mobile
    const menuToggle = document.getElementById('menu-toggle');
    const closeSidebar = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    menuToggle?.addEventListener('click', () => {
        sidebar?.classList.add('active');
        overlay?.classList.add('active');
    });

    closeSidebar?.addEventListener('click', () => {
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
    });

    overlay?.addEventListener('click', () => {
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
    });
}

// --- MODAIS ---
function setupModals() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close-modal');
            closeModal(modalId);
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

// --- DADOS E SUPABASE / LOCALSTORAGE ---
async function loadInitialData() {
    // Tenta carregar do localStorage primeiro para garantir velocidade e offline
    const saved = localStorage.getItem('flamengo_tps_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            AppState.season = data.season || 'S1';
            AppState.seasonNumber = data.seasonNumber || 1;
            AppState.cash = data.cash || 0;
            AppState.president = data.president || 'Koee_annaa';
            AppState.players = data.players || [];
            AppState.transfers = data.transfers || [];
            AppState.seasonsHistory = data.seasonsHistory || [];
            AppState.trophies = data.trophies || [];
        } catch (e) {
            console.error("Erro ao ler dados locais:", e);
        }
    } else {
        // Dados padrão iniciais do Flamengo
        AppState.cash = 1500000;
        AppState.president = 'Koee_annaa';
        AppState.season = 'S1';
        AppState.seasonNumber = 1;
        saveDataLocally();
    }
}

function saveDataLocally() {
    localStorage.setItem('flamengo_tps_data', JSON.stringify({
        season: AppState.season,
        seasonNumber: AppState.seasonNumber,
        cash: AppState.cash,
        president: AppState.president,
        players: AppState.players,
        transfers: AppState.transfers,
        seasonsHistory: AppState.seasonsHistory,
        trophies: AppState.trophies
    }));
}

// --- ATUALIZAÇÃO DA INTERFACE ---
function updateUI() {
    // Atualiza Temporada
    document.querySelectorAll('#sidebar-season, #topbar-season, #hero-season, #dashboard-season-badge, #history-current-season, #stats-season').forEach(el => {
        if (el) el.textContent = AppState.season;
    });
    
    const seasonNumEl = document.getElementById('dashboard-season-number');
    if (seasonNumEl) seasonNumEl.textContent = String(AppState.seasonNumber).padStart(2, '0');

    // Atualiza Caixa
    const cashEl = document.getElementById('dashboard-cash');
    if (cashEl) {
        cashEl.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR' }).format(AppState.cash);
    }

    // Atualiza Presidenta e Info
    const presEl = document.getElementById('club-president');
    if (presEl) presEl.textContent = AppState.president;

    const clubSeasonEl = document.getElementById('club-season');
    if (clubSeasonEl) clubSeasonEl.textContent = AppState.season;

    // Atualiza Contadores
    updatePlayerCount();
    renderPlayers();
    renderTransfers();
    renderStatistics();
    renderTrophies();
    renderSeasonsHistory();
    checkAdminPermissions();
}

// --- CONTROLE DE ACESSO (LEMOS) ---
function setupAdminLogin() {
    const loginForm = document.getElementById('admin-login-form');
    const logoutBtn = document.getElementById('admin-logout');
    
    // Verifica se já há sessão salva
    const savedUser = localStorage.getItem('flamengo_current_user');
    if (savedUser) {
        AppState.currentUser = savedUser;
        AppState.isAdmin = (savedUser.trim().toLowerCase() === 'lemos');
    }

    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('admin-name').value.trim();
        const passInput = document.getElementById('admin-password').value.trim();
        const feedback = document.getElementById('admin-login-feedback');

        if (!nameInput) {
            if (feedback) feedback.textContent = 'Por favor, insira seu nome.';
            return;
        }

        AppState.currentUser = nameInput;
        // Regra solicitada: "o nome que consegue mexer tem que ser Lemos, qm nn entrar com o nome Lemos só pode VER"
        if (nameInput.toLowerCase() === 'lemos') {
            AppState.isAdmin = true;
            if (feedback) feedback.textContent = '';
            showToast('Bem-vindo, Lemos! Acesso total liberado.', 'success');
        } else {
            AppState.isAdmin = false;
            if (feedback) feedback.textContent = 'Nome reconhecido! Modo visualização ativado (Apenas Lemos pode alterar).';
            showToast('Entrada realizada com sucesso em modo visualização.', 'success');
        }

        localStorage.setItem('flamengo_current_user', nameInput);
        loginForm.reset();
        updateUI();
    });

    logoutBtn?.addEventListener('click', () => {
        AppState.currentUser = null;
        AppState.isAdmin = false;
        localStorage.removeItem('flamengo_current_user');
        showToast('Sessão encerrada.', 'info');
        updateUI();
    });
}

function checkAdminPermissions() {
    const adminLoginCard = document.getElementById('admin-login-card');
    const adminPanel = document.getElementById('admin-panel');
    const adminStatus = document.getElementById('admin-status');
    const adminOnlyElements = document.querySelectorAll('.admin-only');

    if (AppState.isAdmin) {
        adminLoginCard?.classList.add('hidden');
        adminPanel?.classList.remove('hidden');
        if (adminStatus) {
            adminStatus.innerHTML = '<span style="background: var(--green);"></span> MODO ADMINISTRADOR (LEMOS)';
        }
        adminOnlyElements.forEach(el => el.classList.remove('hidden'));
    } else {
        if (AppState.currentUser) {
            adminLoginCard?.classList.remove('hidden');
            if (document.getElementById('admin-login-feedback')) {
                document.getElementById('admin-login-feedback').textContent = `Logado como: ${AppState.currentUser} (Somente leitura). Insira "Lemos" para gerenciar.`;
            }
        } else {
            adminLoginCard?.classList.remove('hidden');
            if (document.getElementById('admin-login-feedback')) {
                document.getElementById('admin-login-feedback').textContent = '';
            }
        }
        adminPanel?.classList.add('hidden');
        if (adminStatus) {
            adminStatus.innerHTML = '<span></span> MODO VISUALIZAÇÃO';
        }
        adminOnlyElements.forEach(el => el.classList.add('hidden'));
    }
}

// --- EVENTOS GERAIS E AÇÕES ---
function setupEventListeners() {
    // Botão Adicionar Jogador
    document.getElementById('add-player-button')?.addEventListener('click', () => openPlayerModal());
    document.getElementById('admin-add-player')?.addEventListener('click', () => openPlayerModal());
    
    // Formulário de Jogador
    document.getElementById('player-form')?.addEventListener('submit', handleSavePlayer);

    // Atalho direto no Card de Caixa (Painel Geral) para o Lemos editar
    const cashCard = document.getElementById('card-edit-cash');
    if (cashCard) {
        cashCard.addEventListener('click', () => {
            if (!AppState.isAdmin) {
                showToast('Apenas Lemos pode alterar o caixa do clube.', 'warning');
                return;
            }
            openCashModal();
        });
    }

    // Botão Editar Caixa padrão (Painel Admin)
    document.getElementById('edit-cash-button')?.addEventListener('click', () => {
        if (!AppState.isAdmin) return;
        openCashModal();
    });

    function openCashModal() {
        const cashValInput = document.getElementById('cash-value');
        if (cashValInput) cashValInput.value = AppState.cash;
        openModal('cash-modal');
    }

    document.getElementById('cash-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!AppState.isAdmin) return;
        const val = parseFloat(document.getElementById('cash-value').value);
        if (!isNaN(val)) {
            AppState.cash = val;
            saveDataLocally();
            updateUI();
            closeModal('cash-modal');
            showToast('Caixa atualizado com sucesso!', 'success');
        }
    });

    // Botão Avançar Temporada
    document.getElementById('advance-season-button')?.addEventListener('click', () => {
        openSeasonAdvanceModal();
    });

    // Filtros de Elenco
    document.getElementById('player-search')?.addEventListener('input', renderPlayers);
    document.getElementById('player-filter')?.addEventListener('change', renderPlayers);
}

// --- GERENCIAMENTO DE JOGADORES ---
function openPlayerModal(player = null) {
    if (!AppState.isAdmin) {
        showToast('Apenas o administrador Lemos pode adicionar ou editar jogadores.', 'error');
        return;
    }

    const form = document.getElementById('player-form');
    form.reset();
    document.getElementById('player-id').value = '';
    document.getElementById('player-modal-title').textContent = 'Adicionar Jogador';

    if (player) {
        document.getElementById('player-id').value = player.id;
        document.getElementById('player-name').value = player.name;
        document.getElementById('player-position').value = player.position;
        document.getElementById('player-number').value = player.number;
        document.getElementById('player-games').value = player.games || 0;
        document.getElementById('player-goals').value = player.goals || 0;
        document.getElementById('player-assists').value = player.assists || 0;
        document.getElementById('player-modal-title').textContent = 'Editar Jogador';
    }

    openModal('player-modal');
}

function handleSavePlayer(e) {
    e.preventDefault();
    if (!AppState.isAdmin) return;

    const id = document.getElementById('player-id').value;
    const name = document.getElementById('player-name').value.trim();
    const position = document.getElementById('player-position').value;
    const number = parseInt(document.getElementById('player-number').value) || 0;
    const games = parseInt(document.getElementById('player-games').value) || 0;
    const goals = parseInt(document.getElementById('player-goals').value) || 0;
    const assists = parseInt(document.getElementById('player-assists').value) || 0;

    if (!name || !position) return;

    if (id) {
        // Edição
        const index = AppState.players.findIndex(p => p.id == id);
        if (index !== -1) {
            AppState.players[index] = { ...AppState.players[index], name, position, number, games, goals, assists };
        }
        showToast('Jogador atualizado com sucesso!', 'success');
    } else {
        // Novo
        const newPlayer = {
            id: Date.now().toString(),
            name,
            position,
            number,
            games,
            goals,
            assists
        };
        AppState.players.push(newPlayer);
        showToast('Jogador adicionado ao Flamengo!', 'success');
    }

    saveDataLocally();
    updateUI();
    closeModal('player-modal');
}

function deletePlayer(id) {
    if (!AppState.isAdmin) {
        showToast('Apenas o administrador Lemos pode excluir jogadores.', 'error');
        return;
    }

    AppState.players = AppState.players.filter(p => p.id != id);
    saveDataLocally();
    updateUI();
    showToast('Jogador removido do elenco.', 'info');
}

function updatePlayerCount() {
    const total = AppState.players.length;
    document.getElementById('dashboard-player-count').textContent = total;
    document.getElementById('squad-total').textContent = total;

    let totalGames = 0;
    AppState.players.forEach(p => totalGames += (p.games || 0));
    document.getElementById('dashboard-games').textContent = totalGames;
    document.getElementById('squad-games').textContent = totalGames;
}

function renderPlayers() {
    const searchTerm = document.getElementById('player-search')?.value.toLowerCase() || '';
    const filterPos = document.getElementById('player-filter')?.value || 'todos';

    const positions = ['Goleiro', 'Zagueiro', 'Meia', 'Atacante', 'Ala'];

    positions.forEach(pos => {
        const container = document.getElementById(`players-${pos.toLowerCase()}`);
        const countBadge = document.getElementById(`count-${pos.toLowerCase()}`);
        if (!container) return;

        let filtered = AppState.players.filter(p => p.position === pos);

        // Aplica busca e filtro geral
        if (filterPos !== 'todos' && filterPos !== pos) {
            filtered = [];
        }

        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || String(p.number).includes(searchTerm));
        }

        if (countBadge) countBadge.textContent = filtered.length;

        if (filtered.length === 0) {
            container.innerHTML = `<div class="empty-position">Nenhum ${pos.toLowerCase()} encontrado.</div>`;
            return;
        }

        container.innerHTML = filtered.map(p => `
            <article class="player-card">
                <div class="player-card-top">
                    <div class="player-number">${p.number}</div>
                    <div class="player-name">
                        <strong>${escapeHTML(p.name)}</strong>
                        <span>${escapeHTML(p.position)}</span>
                    </div>
                </div>

                <div class="player-statistics">
                    <div>
                        <strong>${p.games || 0}</strong>
                        <span>Jogos</span>
                    </div>
                    <div>
                        <strong>${p.goals || 0}</strong>
                        <span>Gols</span>
                    </div>
                    <div>
                        <strong>${p.assists || 0}</strong>
                        <span>Assist.</span>
                    </div>
                </div>

                ${AppState.isAdmin ? `
                <div class="player-actions">
                    <button type="button" onclick="editPlayer('${p.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
                    <button type="button" class="delete-player" onclick="deletePlayer('${p.id}')"><i class="fa-solid fa-trash"></i> Excluir</button>
                </div>
                ` : ''}
            </article>
        `).join('');
    });
}

window.editPlayer = function(id) {
    const player = AppState.players.find(p => p.id == id);
    if (player) openPlayerModal(player);
}

// --- ESTATÍSTICAS E RANKINGS ---
function renderStatistics() {
    let totalGames = 0;
    let totalGoals = 0;
    let totalAssists = 0;

    AppState.players.forEach(p => {
        totalGames = Math.max(totalGames, p.games || 0);
        totalGoals += (p.goals || 0);
        totalAssists += (p.assists || 0);
    });

    document.getElementById('stats-games').textContent = totalGames;
    document.getElementById('stats-goals').textContent = totalGoals;
    document.getElementById('stats-assists').textContent = totalAssists;

    // Artilheiro
    const topScorerContainer = document.getElementById('top-scorer');
    const sortedByGoals = [...AppState.players].sort((a, b) => (b.goals || 0) - (a.goals || 0));
    
    if (sortedByGoals.length > 0 && sortedByGoals[0].goals > 0) {
        const top = sortedByGoals[0];
        topScorerContainer.innerHTML = `
            <div class="ranking-player">
                <div class="ranking-position"><i class="fa-solid fa-medal"></i></div>
                <div class="ranking-player-info">
                    <strong>${escapeHTML(top.name)}</strong>
                    <span>${escapeHTML(top.position)} • Camisa ${top.number}</span>
                </div>
                <div class="ranking-player-value">${top.goals} Gols</div>
            </div>
        `;
    } else {
        topScorerContainer.innerHTML = `<div class="empty-state"><strong>Nenhum gol registrado.</strong></div>`;
    }

    // Assistente
    const topAssisterContainer = document.getElementById('top-assister');
    const sortedByAssists = [...AppState.players].sort((a, b) => (b.assists || 0) - (b.assists || 0)); // Corrigido para b.assists

    if (sortedByAssists.length > 0 && sortedByAssists[0].assists > 0) {
        const top = sortedByAssists[0];
        topAssisterContainer.innerHTML = `
            <div class="ranking-player">
                <div class="ranking-position"><i class="fa-solid fa-award"></i></div>
                <div class="ranking-player-info">
                    <strong>${escapeHTML(top.name)}</strong>
                    <span>${escapeHTML(top.position)} • Camisa ${top.number}</span>
                </div>
                <div class="ranking-player-value">${top.assists} Assist.</div>
            </div>
        `;
    } else {
        topAssisterContainer.innerHTML = `<div class="empty-state"><strong>Nenhuma assistência registrada.</strong></div>`;
    }

    // Tabela individual
    const tbody = document.getElementById('statistics-table-body');
    if (!tbody) return;

    if (AppState.players.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Nenhum jogador cadastrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = AppState.players.map(p => `
        <tr>
            <td>${escapeHTML(p.name)}</td>
            <td>${escapeHTML(p.position)}</td>
            <td>${p.games || 0}</td>
            <td>${p.goals || 0}</td>
            <td>${p.assists || 0}</td>
        </tr>
    `).join('');
}

// --- CONTRATAÇÕES ---
function renderTransfers() {
    const container = document.getElementById('recent-transfers');
    if (!container) return;

    if (AppState.transfers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-shirt"></i></div>
                <strong>Nenhuma contratação ainda</strong>
                <span>As novas contratações aparecerão aqui.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = AppState.transfers.slice(-5).reverse().map(t => `
        <div class="transfer-item">
            <div class="transfer-avatar"><i class="fa-solid fa-user-plus"></i></div>
            <div class="transfer-info">
                <strong>${escapeHTML(t.player)}</strong>
                <span>${escapeHTML(t.position)} • ${t.date || 'Recente'}</span>
            </div>
            <div class="transfer-value">${t.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR' }).format(t.value) : 'Livre'}</div>
        </div>
    `).join('');
}

// --- AVANÇAR TEMPORADA ---
function openSeasonAdvanceModal() {
    if (!AppState.isAdmin) {
        showToast('Apenas o administrador Lemos pode avançar a temporada.', 'error');
        return;
    }
    openModal('season-modal');
}

document.getElementById('season-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!AppState.isAdmin) return;

    const seasonData = {
        season: AppState.season,
        florida: document.getElementById('season-florida').value,
        guanabara: document.getElementById('season-guanabara').value,
        carioca: document.getElementById('season-carioca').value,
        brasileirao: document.getElementById('season-brasileirao').value,
        copaBrasil: document.getElementById('season-copa-brasil').value,
        libertadores: document.getElementById('season-libertadores').value,
        supercopa: document.getElementById('season-supercopa').value,
        recopa: document.getElementById('season-recopa').value,
        intercontinental: document.getElementById('season-intercontinental').value,
        derby: document.getElementById('season-derby').value,
        challenge: document.getElementById('season-challenge').value,
        supermundial: document.getElementById('season-supermundial').value,
        scorer: document.getElementById('season-scorer').value,
        scorerGoals: document.getElementById('season-scorer-goals').value,
        assister: document.getElementById('season-assister').value,
        assisterCount: document.getElementById('season-assister-count').value,
        biggestWin: document.getElementById('season-biggest-win').value,
        biggestLoss: document.getElementById('season-biggest-loss').value,
        totalGoals: document.getElementById('season-total-goals').value,
        concededGoals: document.getElementById('season-conceded-goals').value,
        notes: document.getElementById('season-notes').value
    };

    AppState.seasonsHistory.push(seasonData);

    AppState.seasonNumber += 1;
    AppState.season = `S${AppState.seasonNumber}`;

    AppState.players.forEach(p => {
        p.games = 0;
        p.goals = 0;
        p.assists = 0;
    });

    saveDataLocally();
    updateUI();
    closeModal('season-modal');
    showToast(`Temporada avançada para ${AppState.season} com sucesso!`, 'success');
});

function renderSeasonsHistory() {
    const list = document.getElementById('seasons-list');
    if (!list) return;

    if (AppState.seasonsHistory.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
                <strong>Nenhuma temporada encerrada.</strong>
                <span>Quando uma temporada for encerrada, seu histórico aparecerá aqui.</span>
            </div>
        `;
        return;
    }

    list.innerHTML = AppState.seasonsHistory.map((s, idx) => `
        <div class="season-history-card">
            <div class="season-history-header">
                <h3>Temporada ${escapeHTML(s.season)}</h3>
                <span>Encerrada</span>
            </div>
            <p style="margin-top: 10px; color: var(--gray-300); font-size: 11px;">${escapeHTML(s.notes || 'Sem observações registradas.')}</p>
            <div class="season-history-content">
                <div class="season-history-stat">
                    <span>Artilheiro</span>
                    <strong>${escapeHTML(s.scorer || '-')} (${s.scorerGoals || 0})</strong>
                </div>
                <div class="season-history-stat">
                    <span>Assistente</span>
                    <strong>${escapeHTML(s.assister || '-')} (${s.assisterCount || 0})</strong>
                </div>
                <div class="season-history-stat">
                    <span>Gols Feitos</span>
                    <strong>${s.totalGoals || 0}</strong>
                </div>
                <div class="season-history-stat">
                    <span>Gols Sofridos</span>
                    <strong>${s.concededGoals || 0}</strong>
                </div>
            </div>
        </div>
    `).reverse().join('');
}

// --- SALA DE TROFÉUS ---
document.getElementById('add-trophy-button')?.addEventListener('click', () => openTrophyModal());
document.getElementById('admin-add-trophy')?.addEventListener('click', () => openTrophyModal());

function openTrophyModal(trophy = null) {
    if (!AppState.isAdmin) {
        showToast('Apenas o administrador Lemos pode gerenciar troféus.', 'error');
        return;
    }

    const form = document.getElementById('trophy-form');
    form.reset();
    document.getElementById('trophy-id').value = '';
    document.getElementById('trophy-modal-title').textContent = 'Adicionar Competição';
    document.getElementById('trophy-logo-preview').innerHTML = '<i class="fa-solid fa-image"></i><span>Pré-visualização da imagem</span>';

    if (trophy) {
        document.getElementById('trophy-id').value = trophy.id;
        document.getElementById('trophy-name').value = trophy.name;
        document.getElementById('trophy-quantity').value = trophy.quantity;
        document.getElementById('trophy-seasons').value = trophy.seasons;
        document.getElementById('trophy-modal-title').textContent = 'Editar Competição';
        if (trophy.logo) {
            document.getElementById('trophy-logo-preview').innerHTML = `<img src="${trophy.logo}" alt="Logo">`;
        }
    }

    openModal('trophy-modal');
}

document.getElementById('trophy-logo')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            document.getElementById('trophy-logo-preview').innerHTML = `<img src="${evt.target.result}" alt="Logo">`;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('trophy-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!AppState.isAdmin) return;

    const id = document.getElementById('trophy-id').value;
    const name = document.getElementById('trophy-name').value.trim();
    const quantity = parseInt(document.getElementById('trophy-quantity').value) || 0;
    const seasons = document.getElementById('trophy-seasons').value.trim();
    const logoImg = document.querySelector('#trophy-logo-preview img');
    const logo = logoImg ? logoImg.src : '';

    if (!name) return;

    if (id) {
        const idx = AppState.trophies.findIndex(t => t.id == id);
        if (idx !== -1) {
            AppState.trophies[idx] = { ...AppState.trophies[idx], name, quantity, seasons, logo };
        }
        showToast('Troféu atualizado!', 'success');
    } else {
        const newTrophy = {
            id: Date.now().toString(),
            name,
            quantity,
            seasons,
            logo
        };
        AppState.trophies.push(newTrophy);
        showToast('Competição adicionada à Sala de Troféus!', 'success');
    }

    saveDataLocally();
    updateUI();
    closeModal('trophy-modal');
});

function renderTrophies() {
    const grid = document.getElementById('trophies-grid');
    const totalEl = document.getElementById('total-trophies');
    if (!grid) return;

    let totalTrophiesCount = 0;
    AppState.trophies.forEach(t => totalTrophiesCount += (t.quantity || 0));
    if (totalEl) totalEl.textContent = totalTrophiesCount;
    document.getElementById('dashboard-trophies').textContent = totalTrophiesCount;

    if (AppState.trophies.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-trophy"></i></div>
                <strong>Nenhum título cadastrado.</strong>
                <span>As conquistas do Flamengo aparecerão aqui.</span>
            </div>
        `;
        return;
    }

    grid.innerHTML = AppState.trophies.map(t => `
        <div class="trophy-card">
            <div class="trophy-card-top">
                <div class="trophy-card-logo">
                    ${t.logo ? `<img src="${t.logo}" alt="${escapeHTML(t.name)}">` : `<i class="fa-solid fa-trophy"></i>`}
                </div>
                <div class="trophy-card-name">
                    <h3>${escapeHTML(t.name)}</h3>
                    <span>Competição Oficial</span>
                </div>
            </div>

            <div class="trophy-count">
                <strong>${t.quantity || 0}</strong>
                <span>TÍTULOS CONQUISTADOS</span>
            </div>

            <div class="trophy-seasons">
                <span>Temporadas:</span>
                <p>${escapeHTML(t.seasons || 'Nenhuma temporada informada')}</p>
            </div>

            ${AppState.isAdmin ? `
            <div class="trophy-actions">
                <button type="button" onclick="editTrophy('${t.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

window.editTrophy = function(id) {
    const trophy = AppState.trophies.find(t => t.id == id);
    if (trophy) openTrophyModal(trophy);
}

// --- UTILITÁRIOS ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'info') icon = 'fa-circle-info';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(('>'), '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}