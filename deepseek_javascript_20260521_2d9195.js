// ======================= ALKALINITY CALCULATOR =======================
function parseNormality(inputStr) {
    let s = inputStr.toString().trim().toLowerCase();
    if (s.startsWith('n/')) {
        let denom = parseFloat(s.split('/')[1]);
        return 1.0 / denom;
    }
    if (s.endsWith('n')) s = s.slice(0, -1);
    return parseFloat(s);
}

function computeAlkalinity() {
    try {
        let volSample = parseFloat(document.getElementById('alk_vol').value);
        let normRaw = document.getElementById('alk_norm').value;
        let v1 = parseFloat(document.getElementById('alk_v1').value);
        let mode = document.querySelector('input[name="mo_mode"]:checked').value;
        let v2_total = null, v2_add = null;
        
        if (mode === 'total') {
            v2_total = parseFloat(document.getElementById('alk_v2_total').value);
        } else {
            v2_add = parseFloat(document.getElementById('alk_v2_add').value);
        }
        
        if (isNaN(volSample) || volSample <= 0) throw "Sample volume must be >0";
        let normality = parseNormality(normRaw);
        if (isNaN(normality) || normality <= 0) throw "Invalid normality";
        if (isNaN(v1) || v1 < 0) throw "V1 invalid";
        
        let v2;
        if (mode === 'total') {
            if (isNaN(v2_total)) throw "Total V2 required";
            if (v2_total < v1) throw "Total V2 must be ≥ V1";
            v2 = v2_total;
        } else {
            if (isNaN(v2_add) || v2_add < 0) throw "Additional volume invalid";
            v2 = v1 + v2_add;
        }

        const factor = (normality * 50 * 1000) / volSample;
        let P = v1 * factor;
        let M = v2 * factor;
        P = Math.round(P * 100) / 100;
        M = Math.round(M * 100) / 100;

        let alkType = "", OH = 0, CO3 = 0, HCO3 = 0;
        
        if (P === 0) {
            alkType = "Bicarbonate (HCO₃) only";
            HCO3 = M;
        } else if (Math.abs(P - M) < 0.01) {
            alkType = "Hydroxide (OH) only";
            OH = P;
        } else if (P < M / 2) {
            alkType = "Carbonate + Bicarbonate (P < ½ M)";
            CO3 = 2 * P;
            HCO3 = M - 2 * P;
        } else if (Math.abs(P - M / 2) < 0.01) {
            alkType = "Carbonate only (CO₃)";
            CO3 = 2 * P;
        } else {
            alkType = "Hydroxide + Carbonate (P > ½ M)";
            OH = 2 * P - M;
            CO3 = 2 * (M - P);
        }
        
        OH = Math.round(OH * 100) / 100;
        CO3 = Math.round(CO3 * 100) / 100;
        HCO3 = Math.round(HCO3 * 100) / 100;

        let html = `<div class="result-line">📌 P = (${v1} × ${normality} × 50 × 1000) / ${volSample} = <strong>${P} mg/L as CaCO₃</strong></div>`;
        html += `<div class="result-line">📌 M = (${v2.toFixed(2)} × ${normality} × 50 × 1000) / ${volSample} = <strong>${M} mg/L as CaCO₃</strong></div>`;
        html += `<hr>`;
        
        if (Math.abs(P - M/2) < 0.01) html += `<div>✅ Since P = ½ M → Carbonate only</div>`;
        else if (P === 0) html += `<div>✅ P = 0 → Bicarbonate only</div>`;
        else if (Math.abs(P - M) < 0.01) html += `<div>✅ P = M → Hydroxide only</div>`;
        else html += `<div>📊 Type: ${alkType}</div>`;
        
        html += `<div class="species"><span class="badge">OH⁻: ${OH} mg/L</span>`;
        html += `<span class="badge">CO₃²⁻: ${CO3} mg/L</span>`;
        html += `<span class="badge">HCO₃⁻: ${HCO3} mg/L</span></div>`;
        
        document.getElementById('alkOutput').innerHTML = html;
    } catch (err) {
        document.getElementById('alkOutput').innerHTML = `<span style="color:#c2410c;">⚠️ Error: ${err}</span>`;
    }
}

function resetAlkalinity() {
    document.getElementById('alk_vol').value = '100';
    document.getElementById('alk_norm').value = '0.02';
    document.getElementById('alk_v1').value = '20';
    document.querySelector('input[value="total"]').checked = true;
    document.getElementById('alk_v2_total').value = '40';
    document.getElementById('alk_v2_add').value = '20';
    document.getElementById('alk_total_group').style.display = 'flex';
    document.getElementById('alk_add_group').style.display = 'none';
    computeAlkalinity();
}

function toggleAlkMode() {
    let mode = document.querySelector('input[name="mo_mode"]:checked').value;
    if (mode === 'total') {
        document.getElementById('alk_total_group').style.display = 'flex';
        document.getElementById('alk_add_group').style.display = 'none';
    } else {
        document.getElementById('alk_total_group').style.display = 'none';
        document.getElementById('alk_add_group').style.display = 'flex';
    }
}

// ======================= EDTA HARDNESS CALCULATOR =======================
function hardnessClass(ppm) {
    if (ppm < 50) return "Soft water";
    if (ppm < 100) return "Moderately soft";
    if (ppm < 150) return "Slightly hard";
    if (ppm < 200) return "Moderately hard";
    if (ppm <= 300) return "Hard water";
    return "Very hard water";
}

function computeEdta() {
    try {
        let sampleVol = parseFloat(document.getElementById('edta_vol_sample').value);
        let edtaM = parseFloat(document.getElementById('edta_m').value);
        let vBefore = parseFloat(document.getElementById('edta_before').value);
        let vAfter = parseFloat(document.getElementById('edta_after').value);
        
        if (sampleVol <= 0) throw "Sample volume >0";
        if (edtaM <= 0) throw "Molarity >0";
        if (vBefore < 0 || vAfter < 0) throw "Volumes can't be negative";
        
        const factor = 100000; // 10^5
        let total = (vBefore * edtaM * factor) / sampleVol;
        let permanent = (vAfter * edtaM * factor) / sampleVol;
        let temporary = total - permanent;
        
        total = Math.round(total * 100) / 100;
        permanent = Math.round(permanent * 100) / 100;
        temporary = Math.round(temporary * 100) / 100;

        let html = `<div class="result-line">🔹 Total Hardness = (${vBefore} × ${edtaM} × 10⁵) / ${sampleVol} = <strong>${total} ppm CaCO₃</strong> → ${hardnessClass(total)}</div>`;
        html += `<div class="result-line">🔸 Permanent Hardness = (${vAfter} × ${edtaM} × 10⁵) / ${sampleVol} = <strong>${permanent} ppm CaCO₃</strong> → ${hardnessClass(permanent)}</div>`;
        html += `<div class="result-line">🧽 Temporary Hardness = Total - Permanent = <strong>${temporary} ppm CaCO₃</strong> → ${hardnessClass(temporary)}</div>`;
        
        document.getElementById('edtaOutput').innerHTML = html;
    } catch (err) {
        document.getElementById('edtaOutput').innerHTML = `<span style="color:#c2410c;">⚠️ ${err}</span>`;
    }
}

function resetEdta() {
    document.getElementById('edta_vol_sample').value = '50';
    document.getElementById('edta_m').value = '0.02';
    document.getElementById('edta_before').value = '12.2';
    document.getElementById('edta_after').value = '8.2';
    computeEdta();
}

// ======================= ZEOLITE HARDNESS CALCULATOR =======================
function computeZeolite() {
    try {
        let brineL = parseFloat(document.getElementById('zeo_brine_l').value);
        let naclConc = parseFloat(document.getElementById('zeo_nacl_conc').value);
        let waterL = parseFloat(document.getElementById('zeo_water_l').value);
        
        if (brineL <= 0 || naclConc <= 0 || waterL <= 0) throw "All values must be positive";
        
        let nacl_g = brineL * naclConc;
        let nacl_mg = nacl_g * 1000;
        let eqWeightNaCl = 58.5;
        let caco3_eq_mg = (nacl_mg * 50) / eqWeightNaCl;
        let hardnessPpm = caco3_eq_mg / waterL;
        hardnessPpm = Math.round(hardnessPpm * 100) / 100;

        let html = `<div class="result-line"><strong>Step I:</strong> NaCl mass = ${brineL} L × ${naclConc} g/L = ${nacl_g} g = ${nacl_mg.toFixed(0)} mg</div>`;
        html += `<div class="result-line"><strong>Step II:</strong> CaCO₃ equivalent = (${nacl_mg.toFixed(0)} × 50) / 58.5 = ${caco3_eq_mg.toFixed(2)} mg</div>`;
        html += `<div class="result-line"><strong>Step III:</strong> Hardness = ${caco3_eq_mg.toFixed(2)} mg / ${waterL} L = <strong>${hardnessPpm} ppm as CaCO₃</strong></div>`;
        
        document.getElementById('zeoOutput').innerHTML = html;
    } catch (err) {
        document.getElementById('zeoOutput').innerHTML = `<span style="color:#c2410c;">⚠️ ${err}</span>`;
    }
}

function resetZeolite() {
    document.getElementById('zeo_brine_l').value = '4.8';
    document.getElementById('zeo_nacl_conc').value = '100';
    document.getElementById('zeo_water_l').value = '1200';
    computeZeolite();
}

// ======================= TAB SWITCHING & INITIALIZATION =======================
function switchTab(tabId) {
    document.querySelectorAll('.calculator-panel').forEach(panel => panel.classList.remove('active-panel'));
    document.getElementById(tabId).classList.add('active-panel');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
}

// Initialize event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let tab = btn.getAttribute('data-tab');
            switchTab(tab);
            if (tab === 'tab1') computeAlkalinity();
            else if (tab === 'tab2') computeEdta();
            else if (tab === 'tab3') computeZeolite();
        });
    });
    
    // Alkalinity mode toggle
    let radios = document.querySelectorAll('input[name="mo_mode"]');
    radios.forEach(radio => radio.addEventListener('change', toggleAlkMode));
    toggleAlkMode();
    
    // Button listeners
    document.getElementById('calcAlk').addEventListener('click', computeAlkalinity);
    document.getElementById('resetAlk').addEventListener('click', resetAlkalinity);
    document.getElementById('calcEdta').addEventListener('click', computeEdta);
    document.getElementById('resetEdta').addEventListener('click', resetEdta);
    document.getElementById('calcZeolite').addEventListener('click', computeZeolite);
    document.getElementById('resetZeolite').addEventListener('click', resetZeolite);
    
    // Initial calculations
    computeAlkalinity();
    computeEdta();
    computeZeolite();
});