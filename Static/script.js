let total = 0;
let etape = 0;
let secteurChoisi = "";
const budgetTotal = 317000000000;
let repartition = {
    "Protection sociale": 0,
    "Santé": 0,
    "Éducation": 0,
    "Environnement": 0,
    "Infrastructure": 0
};

const bulle = document.getElementById('bulle');
const optionsDiv = document.getElementById('options');
const totalSpan = document.getElementById('total');
const personnage = document.getElementById('personnage');
const nextBtn = document.getElementById('nextBtn');
const progress = document.getElementById('progress');
const recapList = document.getElementById('recapList');

// Questions avec secteurs associés
const questions = [
    { texte: "La santé et l'éducation nécessitent plus de financement. Où veux-tu investir ?", secteurs: ["Santé", "Éducation"] },
    { texte: "Protéger l'environnement ou développer les infrastructures ?", secteurs: ["Environnement", "Infrastructure"] },
    { texte: "Renforcer la protection sociale ou améliorer la santé ?", secteurs: ["Protection sociale", "Santé"] },
    { texte: "Éducation ou santé : que privilégies-tu ?", secteurs: ["Éducation", "Santé"] },
    { texte: "Investir dans l'environnement ou les infrastructures ?", secteurs: ["Environnement", "Infrastructure"] }
];

let currentQuestion = 0;

// Met à jour le récapitulatif du budget
function majRecap() {
    recapList.innerHTML = "";
    for (let sec in repartition) {
        let pourc = repartition[sec];
        let montant = Math.round((pourc / 100) * budgetTotal).toLocaleString('fr-FR');
        let li = document.createElement("li");
        li.innerHTML = `<strong>${sec} :</strong> ${pourc}% → ${montant} €`;
        recapList.appendChild(li);
    }
}

// Reset complet du jeu
function resetJeu() {
    total = 0;
    etape = 0;
    secteurChoisi = "";
    repartition = {
        "Protection sociale": 0,
        "Santé": 0,
        "Éducation": 0,
        "Environnement": 0,
        "Infrastructure": 0
    };
    totalSpan.innerText = total;
    progress.style.width = total + "%";
    personnage.src = `/static/neutral.gif`;
    bulle.innerHTML = `<p>Clique sur "Next" pour commencer.</p>`;
    optionsDiv.innerHTML = "";
    majRecap();
    nextBtn.style.display = "inline-block";
    currentQuestion = 0;
}

window.onload = () => {
    resetJeu();
};

// Gestion du clic sur Next
nextBtn.addEventListener('click', () => {
    if (etape !== 0) return;

    // Fin du jeu si toutes les questions ont été posées
    if (currentQuestion >= questions.length) {
        if (total < 100) {
            // Popup pour le budget restant
            showPopupBudget("Attention ! Il reste du budget non utilisé. Où souhaitez-vous le mettre ?", ["Poche du citoyen", "Poche du ministre"]);
        } else {
            bulle.innerHTML = `<p>Fin du jeu !</p><p>Merci d'avoir réparti le budget.</p>`;
            optionsDiv.innerHTML = "";
            nextBtn.style.display = "none";
        }
        return;
    }

    const question = questions[currentQuestion];
    currentQuestion++;

    optionsDiv.innerHTML = "";
    bulle.innerHTML = `<p>${question.texte}</p><p>Choisis un secteur :</p>`;

    question.secteurs.forEach(sec => {
        let btn = document.createElement("button");
        btn.innerText = sec;

        btn.addEventListener('click', () => {
            secteurChoisi = sec;
            etape = 1;

            fetch("/api/options_pourcentage", {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({secteur: sec, total})
            })
            .then(r => r.json())
            .then(res => {
                optionsDiv.innerHTML = "";
                bulle.innerHTML = `<p>Choisis le pourcentage pour ${res.secteur} :</p>`;
                res.options.forEach(pourc => {
                    let btnP = document.createElement("button");
                    btnP.innerText = `${pourc}%`;

                    btnP.addEventListener('click', () => {
                        fetch("/api/choix", {
                            method: "POST",
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({total, secteur: secteurChoisi, pourcentage: pourc})
                        })
                        .then(r => r.json())
                        .then(res2 => {
                            total = res2.total;
                            totalSpan.innerText = total;
                            progress.style.width = total + "%";
                            personnage.src = `/static/${res2.gif}`;
                            bulle.innerHTML = `<p>${secteurChoisi} : ${pourc}%</p><p>${res2.message}</p>`;
                            optionsDiv.innerHTML = "";
                            etape = 0;

                            repartition[secteurChoisi] = pourc;
                            majRecap();
                        });
                    });

                    optionsDiv.appendChild(btnP);
                });
            });
        });

        optionsDiv.appendChild(btn);
    });
});

// Fonction pour afficher popup budget non utilisé
function showPopupBudget(message, options) {
    let popup = document.createElement("div");
    popup.className = "popup";
    popup.innerHTML = `<p>${message}</p>`;
    options.forEach(opt => {
        let btn = document.createElement("button");
        btn.innerText = opt;
        btn.addEventListener('click', () => {
            repartition[opt] = 100 - total; 
            total = 100;
            totalSpan.innerText = total;
            progress.style.width = total + "%";
            majRecap();
            popup.remove();
            bulle.innerHTML = `<p>Budget final réparti.</p>`;
        });
        popup.appendChild(btn);
    });
    document.body.appendChild(popup);
}
