let total = 0;
const BUDGET_TOTAL = 159000000000;
let repartition = { "Protection sociale":0, "Santé":0, "Éducation":0, "Environnement":0, "Infrastructure":0 };

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
    restePct: document.getElementById('reste-pct')
};

function majRecap() {
    elements.recapList.innerHTML = "";
    for (let sec in repartition) {
        const montant = Math.round(repartition[sec] / 100 * BUDGET_TOTAL).toLocaleString('fr-BE');
        const li = document.createElement("li");
        li.innerHTML = `<strong>${sec}:</strong> ${repartition[sec]}% → ${montant} €`;
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
});

elements.nextBtn.addEventListener('click', () => {
    fetch("/api/next", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ total, repartition }) })
    .then(r => r.json())
    .then(data => {
        showInfo(data.info);

        if (data.evenement_popup) {
            alert(data.texte);
            elements.bulle.innerHTML = `<p class="event-warning"><strong>${data.texte}</strong></p><p>Clique sur Suivant pour appliquer.</p>`;
            elements.nextBtn.style.display = "block";
            return;
        }

        if (data.evenement_applique) {
            total = data.total;
            repartition = data.repartition;
            updateProgress();
            majRecap();
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
            } else {
                elements.restartBtn.style.display = "block";  // FORCER SI PAS CHOIX RESTE
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
    });
});

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

function validerChoix(secteur, pourcentage) {
    fetch("/api/choix", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secteur, pourcentage, total, repartition }) })
    .then(r => r.json())
    .then(res => {
        total = res.total;
        repartition = res.repartition;
        updateProgress();
        majRecap();
        elements.personnage.src = "/static/" + res.gif;
        elements.bulle.innerHTML = `<p>${res.message}</p>`;
        showInfo(res.info);
        elements.options.innerHTML = "";
        elements.nextBtn.style.display = total < 100 ? "block" : "none";

        // SI TOTAL >= 100 APRÈS CHOIX, FORCER RECOMMENCER
        if (total >= 100) {
            elements.restartBtn.style.display = "block";
        }
    });
}

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