import './style.css';
import {
    Achance, Bchance, ENTRY_NAMES, MAIN_ENTRY_CONFIG, MAIN_ATTR_TO_SUB, CHARACTER_DATA
} from './data.js';
import { parseNumber, calculateCore } from './calculator.js';

let simpleSelectedChar = null;
let gameSelectedChar = null;

// ─── Tab Switching ──────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    b.classList.add('active');
    document.getElementById(`${b.dataset.mode}-panel`).classList.add('active');
    document.getElementById('result-area').style.display = 'none';
}));
document.querySelectorAll('.sub-mode-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.sub-mode-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('adv-game-panel').style.display = b.dataset.submode === 'game' ? 'block' : 'none';
    document.getElementById('adv-custom-panel').style.display = b.dataset.submode === 'custom' ? 'block' : 'none';
    document.getElementById('result-area').style.display = 'none';
}));

// ─── Faction / Character rendering ──────────────────────────────
function renderFactionTabs(cId, t) {
    const ct = document.getElementById(cId); ct.innerHTML = '';
    CHARACTER_DATA.forEach((f, i) => {
        const tb = document.createElement('div'); tb.className = `faction-tab ${i===0?'active':''}`; tb.textContent = f.faction;
        tb.onclick = () => { ct.querySelectorAll('.faction-tab').forEach(x => x.classList.remove('active')); tb.classList.add('active'); renderCharacterGrid(t, i); };
        ct.appendChild(tb);
    });
}

function renderCharacterGrid(t, fi = 0) {
    const gId = t === 'simple' ? 'simple-character-grid' : 'game-character-grid';
    const g = document.getElementById(gId); g.innerHTML = '';
    CHARACTER_DATA[fi].roles.forEach(ch => {
        const cd = document.createElement('div'); cd.className = 'character-card';
        cd.innerHTML = `<img src="./${ch.image}" alt="${ch.name}" class="character-avatar" onerror="this.style.display='none'"><div class="character-name">${ch.name}</div>`;
        cd.onclick = () => {
            g.querySelectorAll('.character-card').forEach(c => c.classList.remove('active')); cd.classList.add('active');
            if (t === 'simple') {
                simpleSelectedChar = ch;
                document.getElementById('simple-alice-c6-option').style.display = ch.special === 'alice' ? 'flex' : 'none';
                document.getElementById('simple-vivian-c4-option').style.display = ch.special === 'vivian' ? 'flex' : 'none';
                updateSimpleWeights(); buildSimpleEnhance();
            } else {
                gameSelectedChar = ch;
                document.getElementById('game-alice-c6-option').style.display = ch.special === 'alice' ? 'flex' : 'none';
                document.getElementById('game-vivian-c4-option').style.display = ch.special === 'vivian' ? 'flex' : 'none';
                updateGameWeights(); onPositionChange();
            }
        };
        g.appendChild(cd);
    });
}

// ─── Simple Mode ─────────────────────────────────────────────────
function getSimpleWeights() {
    const w = simpleSelectedChar ? [...simpleSelectedChar.weights] : new Array(10).fill(0);
    if (simpleSelectedChar?.special === 'alice' && document.getElementById('simple-alice-c6').checked) w[7] += 0.3;
    if (simpleSelectedChar?.special === 'vivian' && document.getElementById('simple-vivian-c4').checked) w[7] = 0.6;
    return w;
}

window.updateSimpleWeights = function updateSimpleWeights() {
    if (!simpleSelectedChar) return;
    const w = getSimpleWeights();
    document.querySelectorAll('.simple-weight').forEach((inp, i) => {
        if (inp) { inp.value = w[i] === 0 ? '' : w[i]; }
    });
    buildSimpleEnhance();
};

function buildSimpleEnhance() {
    const area = document.getElementById('simple-enhance-area');
    const weightInputs = document.querySelectorAll('.simple-weight');
    area.innerHTML = '';
    for (let i = 0; i < weightInputs.length; i++) {
        const w = parseNumber(weightInputs[i].value);
        if (isNaN(w) || w <= 0) continue;
        const div = document.createElement('div'); div.className = 'enhance-row';
        div.innerHTML = `<label><input type="checkbox" class="simple-enhance-check" data-idx="${i}" onchange="calcSimpleAutoScore()"> ${ENTRY_NAMES[i]}</label> 权重:<span>${w}</span> 强化次数:<input type="number" class="simple-enhance-times" data-idx="${i}" min="0" max="5" value="0" style="width:60px;" onchange="calcSimpleAutoScore()">`;
        area.appendChild(div);
    }
    calcSimpleAutoScore();
}

window.calcSimpleAutoScore = function calcSimpleAutoScore() {
    const checks = document.querySelectorAll('.simple-enhance-check:checked');
    const weightInputs = document.querySelectorAll('.simple-weight');
    let score = 0;
    checks.forEach(cb => {
        const idx = parseInt(cb.dataset.idx);
        const w = parseNumber(weightInputs[idx]?.value);
        if (isNaN(w)) return;
        const times = parseInt(document.querySelector(`.simple-enhance-times[data-idx="${idx}"]`)?.value || 0);
        score += (times + 1) * w;
    });
    document.getElementById('simple-auto-score').textContent = score.toFixed(4);
    document.getElementById('simple-goal').value = score.toFixed(4);
};

function initSimpleEntries() {
    const ct = document.getElementById('simple-entries'); ct.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const d = document.createElement('div'); d.className = 'form-group';
        d.innerHTML = `<label>${ENTRY_NAMES[i]}权重</label><input type="text" class="simple-weight" placeholder="留空则为无效词条（权重0）">`;
        ct.appendChild(d);
    }
    document.querySelectorAll('.simple-weight').forEach(inp => inp.addEventListener('input', () => buildSimpleEnhance()));
    renderFactionTabs('simple-faction-tabs', 'simple'); renderCharacterGrid('simple', 0); buildSimpleEnhance();
}

window.calculateSimple = function calculateSimple() {
    const wg = document.querySelectorAll('.simple-weight'); const el = [];
    for (let i = 0; i < wg.length; i++) {
        const sc = parseNumber(wg[i].value); if (isNaN(sc)) { alert(`词条${i+1}的权重格式不正确`); return; }
        el.push({ rest: 1, score: sc });
    }
    const g = parseNumber(document.getElementById('simple-goal').value);
    if (isNaN(g)) { alert('当前驱动盘分数格式不正确'); return; }
    showResult(calculateCore(el, g, 1/6), 'simple');
};

// ─── Advanced / Game Mode ────────────────────────────────────────
function getCurrentPositions() {
    return Array.from(document.querySelectorAll('#game-position-checkboxes input:checked')).map(cb => parseInt(cb.value));
}

function getSelectedMainForPos(pos) {
    const container = document.getElementById(`main-${pos}`);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input:checked')).map(c => c.value);
}

function getBlockedSubIdxForPos(pos) {
    if (pos <= 3) return -1;
    const selected = getSelectedMainForPos(pos);
    if (selected.length === 1 && MAIN_ATTR_TO_SUB[selected[0]] !== undefined) return MAIN_ATTR_TO_SUB[selected[0]];
    return -1;
}

function updatePosScale(pos) {
    const input = document.getElementById(`scale-${pos}`); if (!input) return;
    let sc;
    if (pos <= 3) sc = 1/6;
    else {
        const selectedCount = getSelectedMainForPos(pos).length;
        const cnt = selectedCount > 0 ? selectedCount : MAIN_ENTRY_CONFIG[pos].length;
        const tot = MAIN_ENTRY_CONFIG[pos].length;
        sc = cnt / (6 * tot);
    }
    input.value = sc.toFixed(15);
}

window.calcPosScore = function calcPosScore(pos) {
    const checks = document.querySelectorAll(`.enhance-check-${pos}:checked`);
    const weightInputs = document.querySelectorAll('.game-weight');
    let score = 0;
    checks.forEach(cb => {
        const idx = parseInt(cb.dataset.idx);
        const w = parseNumber(weightInputs[idx]?.value);
        if (isNaN(w)) return;
        const times = parseInt(document.querySelector(`.enhance-times-${pos}[data-idx="${idx}"]`)?.value || 0);
        score += (times + 1) * w;
    });
    const span = document.getElementById(`score-${pos}`); if (span) span.textContent = score.toFixed(4);
};

function getPosGoal(pos) { const span = document.getElementById(`score-${pos}`); return span ? parseFloat(span.textContent) : 0; }

function renderMainEntriesForPos(pos) {
    const ct = document.getElementById(`main-${pos}`); if (!ct) return;
    ct.innerHTML = '';
    (MAIN_ENTRY_CONFIG[pos] || []).forEach(n => {
        const it = document.createElement('label'); it.className = 'main-entry-item';
        it.innerHTML = `<input type="checkbox" value="${n}" onchange="onMainEntryChange(${pos})"> ${n}`;
        ct.appendChild(it);
    });
}

window.onMainEntryChange = function onMainEntryChange(pos) { updatePosScale(pos); buildPosEnhance(pos); };

function buildPosEnhance(pos) {
    const area = document.getElementById(`enhance-${pos}`); if (!area) return;
    const weightInputs = document.querySelectorAll('.game-weight');
    const blockedIdx = getBlockedSubIdxForPos(pos);
    area.innerHTML = '';
    for (let i = 0; i < weightInputs.length; i++) {
        if (i === blockedIdx) continue;
        const w = parseNumber(weightInputs[i].value);
        if (isNaN(w) || w <= 0) continue;
        const div = document.createElement('div'); div.className = 'enhance-row';
        div.innerHTML = `<label><input type="checkbox" class="enhance-check-${pos}" data-idx="${i}" onchange="calcPosScore(${pos})"> ${ENTRY_NAMES[i]}</label> 权重:<span>${w}</span> 强化次数:<input type="number" class="enhance-times-${pos}" data-idx="${i}" min="0" max="5" value="0" style="width:60px;" onchange="calcPosScore(${pos})">`;
        area.appendChild(div);
    }
    calcPosScore(pos);
}

function collectEntryListForSingleMain(pos, mainName) {
    const rests = document.querySelectorAll('.game-rest');
    const weights = document.querySelectorAll('.game-weight');
    const list = [];
    const blockedIdx = (pos >= 4 && mainName && MAIN_ATTR_TO_SUB[mainName] !== undefined) ? MAIN_ATTR_TO_SUB[mainName] : -1;
    for (let i = 0; i < 10; i++) {
        let r = parseInt(rests[i].value) || 0;
        const w = parseNumber(weights[i].value) || 0;
        if (i === blockedIdx) r = 0;
        for (let j = 0; j < r; j++) list.push({ rest: 1, score: w });
    }
    return list;
}

window.updateGameWeights = function updateGameWeights() {
    const wi = document.querySelectorAll('.game-weight');
    const ri = document.querySelectorAll('.game-rest');
    let baseWeights = gameSelectedChar ? [...gameSelectedChar.weights] : new Array(10).fill(0);
    if (gameSelectedChar?.special === 'alice' && document.getElementById('game-alice-c6').checked) baseWeights[7] += 0.3;
    if (gameSelectedChar?.special === 'vivian' && document.getElementById('game-vivian-c4').checked) baseWeights[7] = 0.6;
    for (let i = 0; i < 10; i++) {
        if (wi[i]) { wi[i].value = baseWeights[i] === 0 ? '' : baseWeights[i]; wi[i].disabled = false; }
        if (ri[i]) { if (ri[i].disabled) { ri[i].disabled = false; ri[i].value = 1; } }
    }
    getCurrentPositions().forEach(pos => updatePosScale(pos));
};

window.onPositionChange = function onPositionChange() {
    const positions = getCurrentPositions();
    const configsDiv = document.getElementById('position-configs'); configsDiv.innerHTML = '';
    positions.forEach(pos => {
        const div = document.createElement('div'); div.className = 'pos-config';
        div.innerHTML = `<h4>${pos}号位配置</h4>`;
        if (pos >= 4) div.innerHTML += `<label>主词条选择：</label><div class="main-entry-grid" id="main-${pos}"></div>`;
        div.innerHTML += `<label>当前驱动盘强化次数：</label><div id="enhance-${pos}"></div>`;
        div.innerHTML += `<div>当前驱动盘分数：<span id="score-${pos}">0</span></div>`;
        div.innerHTML += `<label>缩放系数：<input type="text" id="scale-${pos}" readonly></label><small style="color:#888;">示例：随机抽得该位置概率1/6；4/6号位主词条仅1种可用输入1/36</small>`;
        configsDiv.appendChild(div);
    });
    positions.forEach(pos => { if (pos >= 4) renderMainEntriesForPos(pos); updatePosScale(pos); });
    updateGameWeights();
    positions.forEach(pos => buildPosEnhance(pos));
};

window.calculateGame = function calculateGame() {
    const positions = getCurrentPositions();
    if (positions.length === 0) { alert('请至少选择一个号位'); return; }
    let totalRandom = 0, totalDirected = 0;
    const perPosResults = [];
    let sumA = 0, sumB = 0, countResults = 0;

    positions.forEach(pos => {
        const goal = getPosGoal(pos);
        let mainList = [];
        if (pos <= 3) mainList = [null];
        else {
            const selected = getSelectedMainForPos(pos);
            mainList = selected.length > 0 ? selected : [...MAIN_ENTRY_CONFIG[pos]];
        }
        const tot = pos >= 4 ? MAIN_ENTRY_CONFIG[pos].length : 1;
        let posRandom = 0, posDirected = 0;
        mainList.forEach(main => {
            const entryList = collectEntryListForSingleMain(pos, main);
            if (entryList.length < 4) {
                alert(`${pos}号位（主词条：${main || '无'}）词条库存不足4`);
                return;
            }
            const scaleFactor = pos <= 3 ? (1/6) : (1 / (6 * tot));
            const result = calculateCore(entryList, goal, scaleFactor);
            const directedContrib = pos >= 4 ? result.chance / 6 : result.chance;
            posRandom += result.scaledChance;
            posDirected += directedContrib;
            sumA += result.mchanceA;
            sumB += result.mchanceB;
            countResults++;
        });
        perPosResults.push({ pos, random: posRandom, directed: posDirected });
        totalRandom += posRandom;
        totalDirected += posDirected;
    });

    const avgA = countResults > 0 ? sumA / countResults : null;
    const avgB = countResults > 0 ? sumB / countResults : null;

    document.getElementById('per-position-results').innerHTML = perPosResults.map(r =>
        `<div>${r.pos}号位：随机 ${(r.random*100).toFixed(4)}% 定向 ${(r.directed*100).toFixed(4)}%</div>`
    ).join('');
    document.getElementById('res-a').textContent = `A盘(5次强化)平均提升率：${avgA !== null ? (avgA*100).toFixed(15) : '--'}%`;
    document.getElementById('res-b').textContent = `B盘(4次强化)平均提升率：${avgB !== null ? (avgB*100).toFixed(15) : '--'}%`;
    document.getElementById('res-directed').textContent = positions.length > 1 ? '定向抽取综合提升率：--' : `定向抽取综合提升率：${(totalDirected*100).toFixed(15)}%`;
    document.getElementById('res-random').textContent = `随机抽取综合提升率：${(totalRandom*100).toFixed(15)}%`;
    document.getElementById('result-area').style.display = 'block';
};

// ─── Advanced Custom Mode ────────────────────────────────────────
window.generateAdvancedEntries = function generateAdvancedEntries() {
    const cnt = parseInt(document.getElementById('entry-count').value) || 10;
    const ct = document.getElementById('advanced-entries'); ct.innerHTML = '';
    for (let i = 0; i < cnt; i++) {
        const d = document.createElement('div'); d.className = 'entry-grid';
        d.innerHTML = `<div class="entry-item"><label>词条${i+1}名称</label><input type="text" class="adv-name" value="词条${i+1}"></div><div class="entry-item"><label>库存</label><input type="number" class="adv-rest" min="1" value="1"></div><div class="entry-item"><label>权重</label><input type="text" class="adv-score" placeholder="整数/小数/分数"></div>`;
        ct.appendChild(d);
    }
};

window.calculateAdvanced = function calculateAdvanced() {
    const ns = document.querySelectorAll('.adv-name'), rs = document.querySelectorAll('.adv-rest'), ss = document.querySelectorAll('.adv-score');
    if (ns.length === 0) { alert('请先生成词条输入'); return; }
    const el = []; let tr = 0;
    for (let i = 0; i < ns.length; i++) {
        const r = parseInt(rs[i].value), s = parseNumber(ss[i].value);
        if (isNaN(r) || r < 1) { alert(`词条${i+1}库存必须是正整数`); return; }
        if (isNaN(s)) { alert(`词条${i+1}权重格式不正确`); return; }
        el.push({ rest: r, score: s }); tr += r;
    }
    if (tr < 4) { alert('总词条库存不足4'); return; }
    const g = parseNumber(document.getElementById('advanced-goal').value);
    const sc = parseNumber(document.getElementById('advanced-scale').value);
    if (isNaN(g)) { alert('目标分数格式不正确'); return; }
    if (isNaN(sc)) { alert('缩放系数格式不正确'); return; }
    showResult(calculateCore(el, g, sc), 'advanced');
};

// ─── Shared result display ──────────────────────────────────────
function showResult(r, mode) {
    document.getElementById('res-a').textContent = `A盘(5次强化)平均提升率：${(r.mchanceA*100).toFixed(15)}%`;
    document.getElementById('res-b').textContent = `B盘(4次强化)平均提升率：${(r.mchanceB*100).toFixed(15)}%`;
    document.getElementById('res-directed').textContent = mode === 'simple' ? `定向抽取综合提升率：${(r.chance*100).toFixed(15)}%` : `综合提升率：${(r.chance*100).toFixed(15)}%`;
    document.getElementById('res-random').textContent = mode === 'simple' ? `随机抽取综合提升率：${(r.scaledChance*100).toFixed(15)}%` : `乘以缩放系数后提升率：${(r.scaledChance*100).toFixed(15)}%`;
    document.getElementById('result-area').style.display = 'block';
}

// ─── Initialize Game entries ────────────────────────────────────
function initGameEntries() {
    const ct = document.getElementById('game-entries'); ct.innerHTML = '';
    ENTRY_NAMES.forEach(n => {
        const d = document.createElement('div'); d.className = 'entry-grid';
        d.innerHTML = `<div class="entry-item"><label>词条名称</label><input type="text" value="${n}" disabled></div><div class="entry-item"><label>库存</label><input type="number" class="game-rest" min="0" value="1"></div><div class="entry-item"><label>权重</label><input type="text" class="game-weight" placeholder="整数/小数/分数"></div>`;
        ct.appendChild(d);
    });
    document.querySelectorAll('.game-weight').forEach(inp => inp.addEventListener('input', () => { getCurrentPositions().forEach(pos => buildPosEnhance(pos)); }));
}

// ─── Boot ────────────────────────────────────────────────────────
window.onload = () => {
    initSimpleEntries();
    generateAdvancedEntries();
    renderFactionTabs('game-faction-tabs', 'game');
    renderCharacterGrid('game', 0);
    initGameEntries();
    onPositionChange();
};
