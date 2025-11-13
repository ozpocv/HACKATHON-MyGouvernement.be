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

// === MAPPING DES IMAGES (EXACTEMENT COMME TES FICHIERS) ===
const GIF_MAP = {
    "Protection sociale": {
        low: "low_social.png",
        normal: "normal.png",
        progress: "content.png",
        high: "content.png"  // tu n'as pas happy.png
    },
    "Santé": {
        low: "low_sante.png",   // CORRIGÉ
        normal: "normal.png",
        progress: "content.png",
        high: "medecin.png"
    },
    "Éducation": {
        low: "low_education.png",
        normal: "normal.png",
        progress: "content.png",
        high: "content.png"
    },
    "Défense": {
        low: "low_defense.png",
        normal: "normal.png",
        progress: "content.png",
        high: "content.png"
    },
    "Infrastructure": {
        low: "low_infra.png",
        normal: "normal.png",
        progress: "content.png",
        high: "infraHappy.png"  // CORRIGÉ (sans tiret)
    }
};

// === FONCTIONS UTILITAIRES ===
function updateProgress() {
    total = Object.values(repartition).reduce((a, b) => a + b, 0);
    el.total.textContent = total;
    el.progress.style.width = Math.min(total, 100) + '%';
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
    el.infoBox.textContent = text || '';
}

// === Détermine l'image du personnage principal ===
function determinerGifPersonnage() {
    if (total >= 100) return 'normal.png';

    // Secteur sous-financé (<15%)
    const secteurBas = Object.entries(repartition).find(([s, v]) => v > 0 && v < 15);
    if (secteurBas) {
        return GIF_MAP[secteurBas[0]].low;
    }

    // Secteur le plus financé
    const secteurMax = Object.entries(repartition).reduce((a, b) => b[1] > a[1] ? b : a, ["", 0]);
    const pct = secteurMax[1];

    if (pct >= 30) return GIF_MAP[secteurMax[0]].high;
    if (pct >= 25) return GIF_MAP[secteurMax[0]].progress;
    return 'normal.png';
}

// === Ajouter une réaction dans la galerie ===
function ajouterReaction(secteur, pct) {
    if ([...el.reactionGallery.children].some(i => i.dataset.secteur === secteur)) return;

    const item = document.createElement('div');
    item.className = 'reaction-item';
    item.dataset.secteur = secteur;

    let gif = 'normal.png';
    let label = `${secteur}: ${pct}%`;

    if (pct < 15 && pct > 0) {
        gif = `reaction_${GIF_MAP[secteur].low.replace('.png', '')}.png`;
        label += ' (en crise !)';
    } else if (pct >= 30) {
        gif = `reaction_${GIF_MAP[secteur].high.replace('.png', '')}.png`;
        label += ' (excellent !)';
    } else if (pct >= 25) {
        gif = `reaction_${GIF_MAP[secteur].progress.replace('.png', '')}.png`;
        label += ' (en progrès !)';
    } else {
        gif = 'reaction_normal.png';
    }

    item.innerHTML = `
        <img src="/static/${gif}?v=${Date.now()}" 
             onerror="this.src='/static/normal.png'" 
             alt="${secteur}">
        <p>${label}</p>
    `;
    el.reactionGallery.appendChild(item);

    // Limite à 5 réactions
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

        if (data.evenement_popup) {
            alert(data.texte);
            el.bulle.innerHTML = `<p class="event-warning"><strong>${data.texte}</strong></p><p>Clique sur Suivant.</p>`;
            el.nextBtn.style.display = 'block';
            el.perso.src = '/static/normal.png?v=' + Date.now();
            return;
        }

        if (data.evenement_applique) {
            repartition = data.repartition;
            total = data.total;
            updateProgress();
            majRecap();
            el.perso.src = '/static/' + determinerGifPersonnage() + '?v=' + Date.now();
            el.bulle.innerHTML = `<p class="event-applied"><strong>${data.texte}</strong></p><p>Appuie sur Suivant.</p>`;
            el.nextBtn.style.display = 'block';
            return;
        }

        if (data.fin) {
            total = data.total;
            repartition = data.repartition;
            updateProgress();
            majRecap();
            el.perso.src = '/static/' + (data.gif || determinerGifPersonnage()) + '?v=' + Date.now();
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
        el.perso.src = '/static/' + determinerGifPersonnage() + '?v=' + Date.now();
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

        // Mise à jour du personnage
        const imgPath = '/static/' + determinerGifPersonnage() + '?v=' + Date.now();
        el.perso.src = imgPath;

        // Ajouter réaction
        ajouterReaction(secteur, pct);

        let msg = data.message;
        if (pct < 15 && pct > 0) {
            msg += `<br><span style="color:#c00;">Attention : ${secteur} en crise !</span>`;
        } else if (pct >= 30) {
            msg += `<br><span style="color:green;">${secteur} bien financé !</span>`;
        }

        el.bulle.innerHTML = `<p>${msg}</p>`;
        showInfo(data.info);
        el.options.innerHTML = '';

        setTimeout(chargerQuestion, 1800);
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
        el.perso.src = '/static/' + (data.gif || 'content.png') + '?v=' + Date.now();
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
    el.perso.src = '/static/normal.png?v=' + Date.now();
    console.log("Jeu chargé. Clique sur Suivant !");

    // TEST CONSOLE (à supprimer plus tard)
    console.log("%cIMAGES CHARGÉES :", "font-weight:bold; color:green");
    ['normal.png', 'low_sante.png', 'infraHappy.png', 'medecin.png'].forEach(img => {
        const test = new Image();
        test.src = '/static/' + img + '?v=' + Date.now();
        test.onload = () => console.log('OK → ' + img);
        test.onerror = () => console.log('404 → ' + img);
    });
});