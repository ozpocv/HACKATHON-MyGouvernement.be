let total = 0;
const BUDGET_TOTAL = 159000000000;
let repartition = { "Protection sociale":0, "Santé":0, "Éducation":0, "Défense":0, "Infrastructure":0 };

const elements = {
    accueil: document.getElementById('ecran-accueil'),
    jeu: document.getElementById('jeu'),
    bulle: document.getElementById('bulle'),
    options: document.getElementById('options'),
    total: document.getElementById('total'),
    progress: document.getElementById('progress'),
    personnage: document.getElementById('personnage'),
    nextBtn: document.getElementById('nextBtn'),
    restartBtn: document.getElementById('btn-recommencer'),
    commencerBtn: document.getElementById('btn-commencer'),
    recapList: document.getElementById('recapList'),
    infoBox: document.getElementById('info-culture'),
    warningReste: document.getElementById('warning-reste'),
    restePct: document.getElementById('reste-pct'),
    reactionGallery: document.getElementById('reaction-gallery'),
};

function majRecap() {
    elements.recapList.innerHTML = "";
    for (let sec in repartition) {
        const montant = Math.round(repartition[sec] / 100 * BUDGET_TOTAL).toLocaleString('fr-BE');
        const li = document.createElement("li");
        li.innerHTML = `<strong>${sec}:</strong> ${repartition[sec]}% -> ${montant} €`;
        elements.recapList.appendChild(li);
    }
}

function showInfo(text) {
    elements.infoBox.textContent = text;
    elements.infoBox.style.animation = 'fadeIn 1s';
}

function updateProgress() {
    elements.total.innerText = total;
    elements.progress.style.width = total + "%";
}

function determinerGifParMoyenne() {
    const seuils = {
        "Protection sociale": 30,
        "Santé": 30,
        "Éducation": 30,
        "Défense": 30,
        "Infrastructure": 30
    };

    const gifsNegatifs = {
        "Protection sociale": "low_social.gif",
        "Santé": "low_sante.gif",
        "Éducation": "low_education.gif",
        "Défense": "low_defense.gif",
        "Infrastructure": "low_infra.gif"
    };

    for (let sec in seuils) {
        if (repartition[sec] > 0 && repartition[sec] < seuils[sec]) {
            return gifsNegatifs[sec];
        }
    }

    return total >= 100 ? "happy.gif" : "neutral.gif";
}

function setMode(mode) {
    fetch("/api/mode", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) })
    .then(r => r.json())
    .then(data => {
        showInfo(data.info);
        document.querySelectorAll('.mode-btn').forEach(b => b.style.opacity = 0.6);
        document.querySelector(`[onclick="setMode('${mode}')"]`).style.opacity = 1;
        elements.commencerBtn.style.display = "block";
    });
}

elements.commencerBtn.addEventListener('click', () => {
    elements.accueil.style.display = "none";
    elements.jeu.style.display = "block";
    elements.nextBtn.style.display = "block";
    elements.bulle.innerHTML = "Appuie sur <strong>Suivant</strong> pour commencer !";
    majRecap();
    updateProgress();
    elements.personnage.src = "/static/neutral.gif";
});

// === FONCTION CLÉ : CHARGER LA PROCHAINE QUESTION ===
function chargerProchaineQuestion() {
    fetch("/api/next", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ total, repartition }) })
    .then(r => r.json())
    .then(data => {
        showInfo(data.info);

        // ÉVÉNEMENT POPUP
        if (data.evenement_popup) {
            alert(data.texte);
            elements.bulle.innerHTML = `<p class="event-warning"><strong>${data.texte}</strong></p><p>Clique sur Suivant pour appliquer.</p>`;
            elements.nextBtn.style.display = "block";
            return;
        }

        // ÉVÉNEMENT APPLIQUÉ
        if (data.evenement_applique) {
            total = data.total;
            repartition = data.repartition;
            updateProgress();
            majRecap();
            elements.personnage.src = "/static/" + determinerGifParMoyenne();
            elements.bulle.innerHTML = `<p class="event-applied"><strong>${data.texte}</strong></p><p>Appuie sur Suivant.</p>`;
            elements.nextBtn.style.display = "block";
            return;
        }

        // FIN DU JEU
        if (data.fin) {
            total = data.total;
            repartition = data.repartition;
            updateProgress();
            majRecap();
            elements.personnage.src = "/static/" + data.gif;
            elements.bulle.innerHTML = `<p><strong>Fin du jeu !</strong></p><p>${data.message}</p>`;
            elements.nextBtn.style.display = "none";
            elements.restartBtn.style.display = "block";
            if (data.choix_reste) {
                elements.restePct.innerText = data.reste;
                elements.warningReste.style.display = "block";
            }
            return;
        }

        // QUESTION NORMALE
        elements.options.innerHTML = "";
        elements.bulle.innerHTML = `<p><strong>Question :</strong> ${data.texte}</p><p>Choisis un secteur :</p>`;

        data.secteurs.forEach(sec => {
            const btn = document.createElement("button");
            btn.innerText = sec;
            btn.onclick = () => choisirSecteur(sec);
            elements.options.appendChild(btn);
        });

        elements.personnage.src = "/static/" + determinerGifParMoyenne();
        elements.nextBtn.style.display = "none"; // On cache "Suivant" après une question normale
    });
}

// Bouton "Suivant" manuel (uniquement pour événements ou démarrage)
elements.nextBtn.addEventListener('click', () => {
    chargerProchaineQuestion();
});

// === CHOISIR UN SECTEUR ===
function choisirSecteur(secteur) {
    fetch("/api/options", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secteur }) })
    .then(r => r.json())
    .then(res => {
        elements.options.innerHTML = "";
        elements.bulle.innerHTML = `<p>Tu as choisi : <strong>${secteur}</strong></p><p>Combien veux-tu allouer ? (reste: ${res.reste}%)</p>`;
        res.options.forEach(p => {
            const btn = document.createElement("button");
            btn.innerText = p + "%";
            btn.onclick = () => validerChoix(secteur, p);
            elements.options.appendChild(btn);
        });
    });
}

// === VALIDER LE CHOIX DE POURCENTAGE → PASSAGE AUTO ===
function validerChoix(secteur, pourcentage) {
    fetch("/api/choix", { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ secteur, pourcentage, total, repartition }) 
    })
    .then(r => r.json())
    .then(res => {
        total = res.total;
        repartition = res.repartition;
        updateProgress();
        majRecap();

        elements.personnage.src = "/static/" + determinerGifParMoyenne();
        ajouterReaction(secteur, pourcentage);

        let alerte = "";
        const seuils = { "Protection sociale":30, "Santé":30, "Éducation":30, "Défense":30, "Infrastructure":30 };
        for (let sec in seuils) {
            if (repartition[sec] > 0 && repartition[sec] < 30) {
                alerte = `<br><span style="color:#c00;font-weight:bold;">Attention ! ${sec} est sous-financé !</span>`;
                break;
            }
        }

        elements.bulle.innerHTML = `<p>${res.message}${alerte}</p>`;
        showInfo(res.info);
        elements.options.innerHTML = "";

        // Passage automatique à la question suivante
        setTimeout(() => {
            chargerProchaineQuestion();
        }, 1200); // Petit délai pour lire le message
    });
}

// === AJOUTER RÉACTION DANS LA GALLERY ===
function ajouterReaction(secteur, pourcentage) {
    const gallery = elements.reactionGallery;

    if ([...gallery.children].some(item => item.dataset.secteur === secteur)) {
        return;
    }

    const item = document.createElement("div");
    item.className = "reaction-item";
    item.dataset.secteur = secteur;

    let gifName = "reaction_neutral.gif";
    let label = `${secteur}: ${pourcentage}%`;

    if (pourcentage < 30 && pourcentage > 0) {
        const map = {
            "Protection sociale": "low_social",
            "Santé": "low_sante",
            "Éducation": "low_education",
            "Défense": "low_defense",
            "Infrastructure": "low_infra"
        };
        gifName = `reaction_${map[secteur]}.gif`;
        label = `${secteur}: ${pourcentage}% (en crise !)`;
    } else if (pourcentage >= 50) {
        gifName = "reaction_happy.gif";
        label = `${secteur}: ${pourcentage}% (excellent !)`;
    }

    item.innerHTML = `
        <img src="/static/${gifName}" alt="${secteur}">
        <p>${label}</p>
    `;

    gallery.appendChild(item);

    if (gallery.children.length > 5) {
        gallery.removeChild(gallery.children[0]);
    }
}

// === CHOIX FINAL : RESTE DU BUDGET ===
function choisirReste(peuple) {
    fetch("/api/choix_reste", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ peuple }) })
    .then(r => r.json())
    .then(res => {
        total = 100;
        repartition = res.repartition;
        updateProgress();
        majRecap();
        elements.personnage.src = "/static/" + res.gif;
        elements.bulle.innerHTML = `<p><strong>${res.message}</strong></p>`;
        elements.warningReste.style.display = "none";
        elements.restartBtn.style.display = "block";
    });
}

elements.restartBtn.addEventListener('click', () => {
    location.reload();
});