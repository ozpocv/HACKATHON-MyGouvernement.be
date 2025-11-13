// === ÉLÉMENTS HTML ===
const el = {
    progress: document.getElementById('progress'),
    total: document.getElementById('total'),
    perso: document.getElementById('personnage'),
    bulle: document.getElementById('bulle'),
    options: document.getElementById('options'),
    nextBtn: document.getElementById('nextBtn'),
    restartBtn: document.getElementById('btn-recommencer'),
    infoBox: document.getElementById('info-culture'),
    recapList: document.getElementById('recapList'),
    warningReste: document.getElementById('warning-reste'),
    restePct: document.getElementById('reste-pct'),
    reactionGallery: document.getElementById('reaction-gallery')
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

// === FONCTIONS UTILITAIRES ===
function updateProgress() {
    total = Object.values(repartition).reduce((a, b) => a + b, 0);
    el.total.textContent = total;
    el.progress.style.width = total + '%';
}

function majRecap() {
    el.recapList.innerHTML = '';
    for (let [secteur, pct] of Object.entries(repartition)) {
        if (pct > 0) {
            const montant = Math.round(pct / 100 * 159000000000).toLocaleString('fr-BE');
            const li = document.createElement('li');
            li.innerHTML = `<strong>${secteur}:</strong> ${pct}% → ${montant} €`;
            el.recapList.appendChild(li);
        }
    }
}

function showInfo(text) {
    el.infoBox.textContent = text;
}

function determinerGif() {
    if (total >= 100) return 'happy.png';
    const bas = Object.entries(repartition).find(([s, v]) => v > 0 && v < 25);
    if (bas) {
        const map = {
            "Protection sociale": "low_socialgit.png",
            "Santé": "low_sante.png",
            "Éducation": "low_education.png",
            "Défense": "low_defense.png",
            "Infrastructure": "low_infra.png"
        };
        return map[bas[0]] || 'neutral.png';
    }
    return 'neutral.png';
}

function ajouterReaction(secteur, pct) {
    if ([...el.reactionGallery.children].some(i => i.dataset.secteur === secteur)) return;

    const item = document.createElement('div');
    item.className = 'reaction-item';
    item.dataset.secteur = secteur;

    let gif = 'neutral.png';
    let label = `${secteur}: ${pct}%`;

    if (pct < 25 && pct > 0) {
        const map = {
            "Protection sociale": "low_social",
            "Santé": "low_sante",
            "Éducation": "low_education",
            "Défense": "low_defense",
            "Infrastructure": "low_infra"
        };
        gif = `reaction_${map[secteur] || 'neutral'}.png`;
        label += ' (en crise !)';
    } else if (pct >= 50) {
        gif = 'reaction_happy.png';
        label += ' (excellent !)';
    } else if (pct >= 30) {
        const mapUp = {
            "Protection sociale": "up1",
            "Santé": "up2",
            "Éducation": "up3",
            "Défense": "up4",
            "Infrastructure": "up5"
        };
        const suffix = mapUp[secteur] || 'neutral';
        gif = `reaction_${suffix}.png`;
        label += ' (en progrès !)';
    }

    item.innerHTML = `
        <img src="/static/${gif}" onerror="this.src='/static/neutral.png'">
        <p>${label}</p>
    `;
    el.reactionGallery.appendChild(item);
    if (el.reactionGallery.children.length > 5) {
        el.reactionGallery.removeChild(el.reactionGallery.firstChild);
    }
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

        // ÉVÉNEMENT POPUP
        if (data.evenement_popup) {
            alert(data.texte);
            el.bulle.innerHTML = `<p class="event-warning"><strong>${data.texte}</strong></p><p>Clique sur Suivant.</p>`;
            el.nextBtn.style.display = 'block';
            return;
        }

        // ÉVÉNEMENT APPLIQUÉ
        if (data.evenement_applique) {
            repartition = data.repartition;
            total = data.total;
            updateProgress();
            majRecap();
            el.perso.src = '/static/' + determinerGif();
            el.bulle.innerHTML = `<p class="event-applied"><strong>${data.texte}</strong></p><p>Appuie sur Suivant.</p>`;
            el.nextBtn.style.display = 'block';
            return;
        }

        // FIN DU JEU
        if (data.fin) {
            total = data.total;
            repartition = data.repartition;
            updateProgress();
            majRecap();
            el.perso.src = '/static/' + data.gif;
            el.bulle.innerHTML = `<p><strong>Fin !</strong> ${data.message}</p>`;
            el.nextBtn.style.display = 'none';
            el.restartBtn.style.display = 'block';

            if (data.choix_reste) {
                el.restePct.textContent = data.reste;
                el.warningReste.style.display = 'block';
            }
            return;
        }

        // QUESTION NORMALE
        el.bulle.innerHTML = `<p><strong>Question :</strong> ${data.texte}</p><p>Choisis un secteur :</p>`;
        el.options.innerHTML = '';
        data.secteurs.forEach(s => {
            const btn = document.createElement('button');
            btn.textContent = s;
            btn.className = 'secteur-btn';
            btn.onclick = () => choisirSecteur(s);
            el.options.appendChild(btn);
        });
        el.perso.src = '/static/' + determinerGif();
        el.nextBtn.style.display = 'none';
    })
    .catch(err => {
        console.error("Erreur API:", err);
        el.bulle.innerHTML = `<p style="color:red;">Erreur de connexion. Réessaie.</p>`;
    });
}

// === CHOISIR SECTEUR ===
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

// === VALIDER CHOIX ===
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
        el.perso.src = '/static/' + determinerGif();
        ajouterReaction(secteur, pct);

        let msg = data.message;
        if (repartition[secteur] < 25 && repartition[secteur] > 0) {
            msg += `<br><span style="color:#c00;">Attention : ${secteur} sous-financé !</span>`;
        }

        el.bulle.innerHTML = `<p>${msg}</p>`;
        showInfo(data.info);
        el.options.innerHTML = '';

        // PASSAGE AUTO
        setTimeout(chargerQuestion, 1500);
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
        el.perso.src = '/static/' + data.gif;
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
    console.log("Jeu chargé. Clique sur Suivant !");
});