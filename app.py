# app.py
from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

# === CONFIG BELGIQUE ===
BUDGET_TOTAL = 159_000_000_000
SECTEURS = ["Protection sociale", "Santé", "Éducation", "Environnement", "Infrastructure"]
VALEURS_POSSIBLES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]

MODES = {
    "Écolo": {"bonus": "Environnement", "malus": "Infrastructure"},
    "Social": {"bonus": "Protection sociale", "malus": "Éducation"},
    "Équilibré": {}
}

# 20 QUESTIONS UNIQUES
QUESTIONS = [
    {"texte": "Le Premier ministre veut attribuer un montant dans la santé, mais il hésite aussi à les implémentés dans les prestations social.", "secteurs": ["Santé", "Protection sociale"]},
    {"texte": "Génial, le gouvernement veut investir dans l'éducation ! Qu'est-ce qu'il ne ferait pas pour nos chers écoliers. Mais aussi madame la femme du Premier ministre s'inquiète pour sa maison de vacances sur la cote belge. Doit-on mettre le budget dans la défense ?", "secteurs": ["Éducation", "Infrastructure"]},
    {"texte": "Oh non, Monsieur le Premier ministre a retweeté un poste que le chef d'Etat d'un pays voisin n'a pas apprécié (apparemment, il existe des gens qui n'aiment pas les chats pilotant des chars.). Doit-on anticiper un conflit futur ou renforcé nos infrastructures et nos transports publics ?", "secteurs": ["Santé", "Infrastructure"]},
    {"texte": "Les temps sont durs au gouvernement et la dette s'agrandit de jour en jour, rien que ce matin Monsieur le Premier ministre n'a pris qu'UNE seule flûte de champagne pour son petit-déjeuner. Mais où vas le monde ?! Il a donc décider d'investir dans nos futurs mathématiciens pour régler le problème, mais au même moment son jardinier, c'est mis à éternuer. Oh non une nouvelle épidémie ?", "secteurs": ["Éducation", "Santé"]},
    {"texte": "L'usine de boîte de céréale du pays a décidé de changer d'air et de s'installer en Chine laissant derrière elle de nombreuses personnes mécontentes qui se sont réunies dans les rues. Doit-on mettre plus de budget dans la protection sociale en attendant que ce beau monde ce calme ou entretenir les trottoirs dont les morceaux servent de projectile au mécontentement social ?", "secteurs": ["Protection sociale", "Infrastructure"]},
    {"texte": "C'est Noel ! Les fêtes le sapin ! Que de réjouissances ho hoo hoo. Quand Monsieur le Premier ministre ouvris son courrier ce matin, il fut scandalisé des fautes d'orthographe sur ses cartes de fin d'année, 'non mais tout le monde sais qu'éléphant s'écrit avec un f' il décide de mettre plus d'argent dans l'éducation. Mais d'un autre côté, le froid hivernal a fait geler les sols provoquant une nuée de patients glissant vers les hôpitaux.", "secteurs": ["Éducation", "Santé"]},
    
    {"texte": "Sortez vos vélos ! C'est bientôt la journée sans voiture, mais les pistes cyclables ne sont pas encore prêtes, doivent, on implémenter plus de fond dans les infrastructures afin d'entre sûr qu'elles soit prête pour cette journée ou renforcé la défense en prévision du conflit annuel des fans de rolleur contre leurs ennemies jurées les fans de patins à roulettes.", "secteurs": ["Infrastructure", "Sécurité"]},
    {"texte": "Éducation ou environnement : que choisir ?", "secteurs": ["Éducation", "Environnement"]},
    {"texte": "Infrastructure ou protection sociale : quelle option ?", "secteurs": ["Infrastructure", "Protection sociale"]},
    {"texte": "Santé ou infrastructure : priorité à quoi ?", "secteurs": ["Santé", "Infrastructure"]},
    {"texte": "Environnement ou santé : investissement clé ?", "secteurs": ["Environnement", "Santé"]},
    {"texte": "Protection sociale ou infrastructure : que privilégier ?", "secteurs": ["Protection sociale", "Infrastructure"]},
    {"texte": "Éducation ou protection sociale : où investir ?", "secteurs": ["Éducation", "Protection sociale"]},
    {"texte": "Infrastructure ou éducation : quel choix ?", "secteurs": ["Infrastructure", "Éducation"]},
    {"texte": "Santé ou protection sociale : priorité ?", "secteurs": ["Santé", "Protection sociale"]},
    {"texte": "Environnement ou éducation : que choisir ?", "secteurs": ["Environnement", "Éducation"]},
    {"texte": "Infrastructure ou santé : investissement ?", "secteurs": ["Infrastructure", "Santé"]},
    {"texte": "Protection sociale ou environnement : option ?", "secteurs": ["Protection sociale", "Environnement"]},
    {"texte": "Éducation ou santé : nouveau choix ?", "secteurs": ["Éducation", "Santé"]},
    {"texte": "Infrastructure ou environnement : décision ?", "secteurs": ["Infrastructure", "Environnement"]}
]

EVENEMENTS = [
    {"texte": "Crise COVID ! +10 % santé obligatoire.", "secteur": "Santé", "impact": 10},
    {"texte": "Inondations en Wallonie ! +10 % infrastructure.", "secteur": "Infrastructure", "impact": 10},
    {"texte": "Grève sociale ! +10 % protection sociale.", "secteur": "Protection sociale", "impact": 10},
    {"texte": "Réforme scolaire réussie ! –5 % éducation.", "secteur": "Éducation", "impact": -5},
    {"texte": "Accord climat UE ! –5 % environnement.", "secteur": "Environnement", "impact": -5},
]

INFOS_BELGIQUE = [
    "Le budget fédéral belge 2024 est d'environ 159 milliards €.",
    "La sécurité sociale représente ~30 % du budget belge.",
    "La Belgique dépense 6,1 % de son PIB en éducation.",
    "Le Plan National Climat vise la neutralité carbone en 2050.",
    "Les infrastructures routières belges sont parmi les plus denses d'Europe.",
    "Le système de santé belge est financé à 77 % par la sécurité sociale.",
]

MESSAGES_FIN = {
    "Écolo": "Félicitations ! Ton gouvernement vert a sauvé la planète !",
    "Social": "Bravo ! Tu as protégé les plus vulnérables. Solidarité !",
    "Équilibré": "Équilibre parfait. Tu es un maître du compromis !"
}

# === ÉTAT GLOBAL ===
repartition = {s: 0 for s in SECTEURS}
question_index = 0
mode_jeu = "Équilibré"
evenement_declenche = False
evenement_en_attente = None


def reset_jeu():
    global repartition, question_index, mode_jeu, evenement_declenche, evenement_en_attente
    repartition = {s: 0 for s in SECTEURS}
    question_index = 0
    mode_jeu = "Équilibré"
    evenement_declenche = False
    evenement_en_attente = None


def total_alloue():
    return sum(repartition.values())


def reste_budget():
    return 100 - total_alloue()


def options_valides(reste):
    if reste <= 0: return []
    possibles = [v for v in VALEURS_POSSIBLES if v <= reste]
    if reste in possibles:
        return [reste]
    return random.sample(possibles, min(3, len(possibles))) if possibles else []


@app.route('/')
def index():
    reset_jeu()
    return render_template("index.html", budget=BUDGET_TOTAL)


@app.route('/api/mode', methods=['POST'])
def api_mode():
    global mode_jeu
    data = request.json
    mode_jeu = data.get("mode", "Équilibré")
    return jsonify({"mode": mode_jeu, "info": random.choice(INFOS_BELGIQUE)})


@app.route('/api/next', methods=['POST'])
def api_next():
    global question_index, evenement_declenche, evenement_en_attente

    data = request.json
    client_repartition = data.get("repartition", {})
    repartition.update(client_repartition)

    info = random.choice(INFOS_BELGIQUE)

    # 1. ÉVÉNEMENT EN ATTENTE
    if evenement_en_attente:
        evt = evenement_en_attente
        secteur = evt["secteur"]
        impact = evt["impact"]
        actuel = repartition[secteur]
        nouveau = max(0, actuel + impact)
        total_avant = total_alloue()
        if total_avant - actuel + nouveau > 100:
            nouveau = 100 - (total_avant - actuel)
        repartition[secteur] = nouveau
        evenement_en_attente = None
        return jsonify({
            "evenement_applique": True,
            "texte": f"{evt['texte']} → {secteur} : {nouveau}%",
            "total": total_alloue(),
            "repartition": repartition,
            "info": info
        })

    # 2. DÉCLENCHER UN SEUL ÉVÉNEMENT
    if not evenement_declenche and random.random() < 0.3:
        evt = random.choice(EVENEMENTS)
        evenement_en_attente = evt
        evenement_declenche = True
        return jsonify({
            "evenement_popup": True,
            "texte": evt["texte"],
            "info": info
        })

    # 3. FIN
    if total_alloue() >= 100 or question_index >= len(QUESTIONS):
        reste = reste_budget()
        if reste > 0:
            return jsonify({
                "fin": True,
                "total": total_alloue(),
                "reste": reste,
                "gif": "neutral.gif",
                "message": f"Budget presque complet ! Il reste {reste}% à répartir.",
                "repartition": repartition,
                "info": info,
                "choix_reste": True
            })
        message = MESSAGES_FIN.get(mode_jeu, "Bien joué !")
        return jsonify({
            "fin": True,
            "total": 100,
            "reste": 0,
            "gif": "happy.gif",
            "message": message,
            "repartition": repartition,
            "info": info,
            "choix_reste": False
        })

    # 4. QUESTION NORMALE
    q = QUESTIONS[question_index]
    question_index += 1
    return jsonify({
        "fin": False,
        "texte": q["texte"],
        "secteurs": q["secteurs"],
        "info": info,
        "total": total_alloue()
    })


@app.route('/api/options', methods=['POST'])
def api_options():
    data = request.json
    secteur = data["secteur"]
    reste = reste_budget()
    options = options_valides(reste)
    return jsonify({"secteur": secteur, "options": options, "reste": reste})


@app.route('/api/choix', methods=['POST'])
def api_choix():
    data = request.json
    secteur = data["secteur"]
    pct = data["pourcentage"]
    repartition.update(data.get("repartition", {}))

    total_avant = total_alloue()
    if total_avant >= 100:
        return jsonify({
            "total": 100,
            "gif": "neutral.gif",
            "message": "Budget complet !",
            "secteur": secteur,
            "pourcentage": 0,
            "repartition": repartition,
            "info": "Plus de budget disponible."
        })

    if total_avant + pct > 100:
        pct = 100 - total_avant

    if pct <= 0:
        return jsonify({
            "total": total_avant,
            "gif": "neutral.gif",
            "message": "Pas assez de budget !",
            "secteur": secteur,
            "pourcentage": 0,
            "repartition": repartition,
            "info": "Budget épuisé."
        })

    repartition[secteur] += pct
    total = total_alloue()

    return jsonify({
        "total": total,
        "gif": "happy.gif" if total >= 100 else "neutral.gif",
        "message": f"{secteur} : +{pct}%",
        "secteur": secteur,
        "pourcentage": pct,
        "repartition": repartition,
        "info": random.choice(INFOS_BELGIQUE)
    })


@app.route('/api/choix_reste', methods=['POST'])
def api_choix_reste():
    data = request.json
    choix = data.get("peuple", False)
    reste = reste_budget()
    if choix:
        secteurs_restants = [s for s, v in repartition.items() if v == 0]
        if not secteurs_restants:
            secteurs_restants = SECTEURS
        part = reste // len(secteurs_restants)
        for s in secteurs_restants:
            repartition[s] += part
        reste_restant = reste - (part * len(secteurs_restants))
        if reste_restant > 0 and secteurs_restants:
            repartition[secteurs_restants[0]] += reste_restant
        message = f"Les {reste}% ont été redistribués au peuple !"
    else:
        message = f"Les {reste}% sont allés dans la poche des ministres..."
    return jsonify({
        "total": 100,
        "gif": "happy.gif",
        "message": message,
        "repartition": repartition,
        "peuple": choix
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)