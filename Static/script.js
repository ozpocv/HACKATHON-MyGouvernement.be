// === ÉLÉMENTS HTML ===
const el = {
    progress: document.getElementById('progress'),
    total: document.getElementById('total'),
    bulle: document.getElementById('bulle'),
    options: document.getElementById('options'),
    nextBtn: document.getElementById('nextBtn'),
    restartBtn: document.getElementById('btn-recommencer'),
    infoBox: document.getElementById('info-culture'),
    recapList: document.getElementById('recapList'),
    warningReste: document.getElementById('warning-reste'),
    restePct: document.getElementById('reste-pct'),
    reactionCenter: document.getElementById('reaction-center'),
    reactionImg: document.getElementById('reaction-img'),
    reactionLabel: document.getElementById('reaction-label')
};

// === VARIABLES ===
let total = 0;
let repartition = {
    "Protection sociale": 0,
    "Santé": 0,
    "Éducation": 0,
    "Défense": 0,
    "Infrastructure": 0
};

// === MAPPING DES IMAGES ===
const GIF_MAP = {
    "Protection sociale": { low: "low_social.png", normal: "neutral.png", progress: "content.png", high: "content.png" },
    "Santé": { low: "low_sante.png", normal: "neutral.png", progress: "medecin.png", high: "medecin.png" },
    "Éducation": { low: "low_education.png", normal: "neutral.png", progress: "content.png", high: "content.png" },
    "Défense": { low: "low_defense.png", normal: "neutral.png", progress: "content.png", high: "content.png" },
    "Infrastructure": { low: "low_infra.png", normal: "neutral.png", progress: "content.png", high: "infraHappy.png" }
};

// === FONCTIONS UTILITAIRES ===
function updateProgress() {
    total = Object.values(repartition).reduce((a, b) => a + b, 0);
    el.total.textContent = total;
    el.progress.style.width = Math.min(Math.max(total, 0), 100) + '%';

    const reste = 100 - Math.max(total, 0);
    document.querySelector('.total').innerHTML = 
        `Budget alloué : <span id="total">${total}</span>% 
         <span style="color:#666; font-size:0.9em;">(reste : ${reste > 0 ? reste : 0}%)</span>`;
}

function majRecap() {
    el.recapList.innerHTML = '';
    const BUDGET_TOTAL_EUROS = 159000000000;
    const ordre = ["Protection sociale", "Santé", "Éducation", "Défense", "Infrastructure"];

    ordre.forEach(secteur => {
        let pct = repartition[secteur] || 0;
        const montant = Math.round(pct / 100 * BUDGET_TOTAL_EUROS);
        const li = document.createElement('li');

        if (pct > 0) {
            li.innerHTML = `<strong>${secteur}:</strong> <span style="color:green;">+${pct}%</span> → ${montant.toLocaleString('fr-BE')} €`;
        } else if (pct < 0) {
            li.innerHTML = `<strong>${secteur}:</strong> <span style="color:#c00; font-weight:bold;">${pct}%</span> → ${montant.toLocaleString('fr-BE')} € <span style="font-size:0.8em;">(déficit)</span>`;
        } else {
            li.innerHTML = `<strong>${secteur}:</strong> 0% → 0 €`;
            li.style.opacity = '0.6';
        }

        el.recapList.appendChild(li);
    });
}

function showInfo(text) {
    el.infoBox.textContent = text || '';
}

// === METTRE À JOUR LE PERSONNAGE RÉACTIF CENTRAL ===
function updateCentralReaction(secteur, pct) {
    const img = el.reactionImg;
    const label = el.reactionLabel;

    let gif = 'neutral.png';
    let text = `${secteur}: ${pct}%`;

    if (pct < 15 && pct > 0) {
        gif = GIF_MAP[secteur].low;
        text += ' (en crise !)';
    } else if (pct >= 30) {
        gif = GIF_MAP[secteur].high || GIF_MAP[secteur].progress;
        text += ' (excellent !)';
    } else if (pct >= 25) {
        gif = GIF_MAP[secteur].progress;
        text += ' (en progrès !)';
    }

    const newImg = new Image();
    newImg.onload = () => {
        img.src = newImg.src;
        img.classList.remove('loaded');
        void img.offsetWidth;
        img.classList.add('loaded');
    };
    newImg.onerror = () => {
        img.src = '/static/neutral.png';
        img.classList.add('loaded');
    };
    newImg.src = `/static/${gif}?v=${Date.now()}`;

    label.innerHTML = text;
    el.reactionCenter.style.display = 'flex';
}

// === CHARGER QUESTION ===
function chargerQuestion() {
    fetch('/api/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repartition })
    })
    .then(r => r.json())
    .then(data => {
        showInfo(data.info || '');

        if (data.evenement_popup) {
            alert(data.texte);
            el.bulle.innerHTML = `<p class="event-warning"><strong>${data.texte}</strong></p><p>Clique sur Suivant.</p>`;
            el.nextBtn.style.display = 'block';
            return;
        }

        if (data.evenement_applique) {
            repartition = data.repartition;
            total = data.total;
            updateProgress();
            majRecap();
            el.bulle.innerHTML = `<p class="event-applied"><strong>${data.texte}</strong></p><p>Appuie sur Suivant.</p>`;
            el.nextBtn.style.display = 'block';
            return;
        }

        if (data.fin) {
            total = data.total;
            repartition = data.repartition;
            updateProgress();
            majRecap();
            el.bulle.innerHTML = `<p><strong>Fin !</strong> ${data.message}</p>`;
            el.nextBtn.style.display = 'none';
            el.restartBtn.style.display = 'block';

            if (data.choix_reste) {
                el.restePct.textContent = data.reste;
                el.warningReste.style.display = 'block';
            }
            return;
        }

        el.bulle.innerHTML = `<p><strong>Question :</strong> ${data.texte}</p><p>Choisis un secteur :</p>`;
        el.options.innerHTML = '';
        data.secteurs.forEach(s => {
            const btn = document.createElement('button');
            btn.textContent = s;
            btn.className = 'secteur-btn';
            btn.onclick = () => choisirSecteur(s);
            el.options.appendChild(btn);
        });
        el.nextBtn.style.display = 'none';
    })
    .catch(err => {
        console.error("Erreur API:", err);
        el.bulle.innerHTML = `<p style="color:red;">Erreur de connexion. Réessaie.</p>`;
    });
}

// === CHOISIR SECTEUR & VALIDER ===
function choisirSecteur(secteur) {
    fetch('/api/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secteur })
    })
    .then(r => r.json())
    .then(data => {
        el.options.innerHTML = '';
        el.bulle.innerHTML = `<p><strong>${secteur}</strong></p><p>Reste : ${data.reste}% – Choisis un % :</p>`;
        data.options.forEach(p => {
            const btn = document.createElement('button');
            btn.textContent = p + '%';
            btn.className = 'pourcentage-btn';
            btn.onclick = () => validerChoix(secteur, p);
            el.options.appendChild(btn);
        });
    });
}

function validerChoix(secteur, pct) {
    fetch('/api/choix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secteur, pourcentage: pct, repartition })
    })
    .then(r => r.json())
    .then(data => {
        repartition = data.repartition;
        total = data.total;
        updateProgress();
        majRecap();

        updateCentralReaction(secteur, pct);

        let msg = data.message;
        if (pct < 15 && pct > 0) msg += `<br><span style="color:#c00;">Attention : ${secteur} en crise !</span>`;
        else if (pct >= 30) msg += `<br><span style="color:green;">${secteur} bien financé !</span>`;

        el.bulle.innerHTML = `<p>${msg}</p>`;
        showInfo(data.info);
        el.options.innerHTML = '';
        setTimeout(chargerQuestion, 2500);
    });
}

// === CHOIX RESTE ===
function choisirReste(peuple) {
    fetch('/api/choix_reste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peuple })
    })
    .then(r => r.json())
    .then(data => {
        repartition = data.repartition;
        total = 100;
        updateProgress();
        majRecap();
        el.bulle.innerHTML = `<p><strong>${data.message}</strong></p>`;
        el.warningReste.style.display = 'none';
        el.restartBtn.style.display = 'block';
    });
}

// === ÉVÉNEMENTS ===
el.nextBtn.onclick = chargerQuestion;
el.restartBtn.onclick = () => location.reload();

// === DÉMARRAGE ===
window.addEventListener('load', () => {
    updateProgress();
    majRecap();
    el.nextBtn.style.display = 'block';

    el.reactionImg.src = '/static/neutral.png';
    el.reactionImg.classList.add('loaded');
    el.reactionLabel.textContent = 'Prêt à gérer le budget !';
    el.reactionCenter.style.display = 'flex';

    console.log("Jeu chargé. Personnage neutre affiché.");
});