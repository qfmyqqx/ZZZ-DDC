import { Achance, Bchance, Atimes, Btimes } from './data.js';

export function parseNumber(str) {
    str = str.trim();
    if (str === '') return 0;
    if (str.includes('/')) { const p = str.split('/'); if (p.length !== 2) return NaN; return parseFloat(p[0]) / parseFloat(p[1]); }
    return parseFloat(str);
}

function firstGroup(savePool, shortGroup, basicSc, presentWeight, allGroups) {
    if (shortGroup.length === 4) { allGroups.push({ firstFour: [...shortGroup], basicsc: basicSc, weight: presentWeight }); return; }
    for (let i = 0; i < savePool.length; i++) {
        if (savePool[i].rest <= 0) continue;
        const nP = savePool.map(item => ({ ...item }));
        nP[i].rest--;
        shortGroup.push({ ...savePool[i] });
        firstGroup(nP, shortGroup, basicSc + savePool[i].score, presentWeight * savePool[i].rest, allGroups);
        shortGroup.pop();
    }
}

function dfsUp(leaveTimes, nowAdd, need, nowGroup, counter) {
    if (leaveTimes <= 0) { counter.total++; if (nowAdd > need) counter.pass++; return; }
    for (let i = 0; i < nowGroup.length; i++) dfsUp(leaveTimes - 1, nowAdd + nowGroup[i].score, need, nowGroup, counter);
}

function passChance(times, need, nowGroup) { const c = { total: 0, pass: 0 }; dfsUp(times, 0, need, nowGroup, c); return c.total === 0 ? 0 : c.pass / c.total; }

export function calculateCore(entryList, goal, scaleFactor) {
    const allGroups = [];
    firstGroup(entryList, [], 0, 1, allGroups);
    let gA = 0, gB = 0, tW = 0;
    for (const gr of allGroups) {
        let sA, sB;
        if (gr.basicsc > goal) { sA = 1; sB = 1; }
        else { const nd = goal - gr.basicsc; sA = passChance(Atimes, nd, gr.firstFour); sB = passChance(Btimes, nd, gr.firstFour); }
        gA += sA * gr.weight; gB += sB * gr.weight; tW += gr.weight;
    }
    const mA = gA / tW, mB = gB / tW, ch = Achance * mA + Bchance * mB;
    return { mchanceA: mA, mchanceB: mB, chance: ch, scaledChance: ch * scaleFactor };
}
