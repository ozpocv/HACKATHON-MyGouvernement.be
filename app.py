from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

secteurs = ["Protection sociale", "Santé", "Éducation", "Environnement", "Infrastructure"]
valeurs_possibles = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
choix_secteurs_utilises = []
questions = [
    {"texte": "La santé et l'éducation nécessitent plus de financement. Où veux-tu investir ?", "secteurs": ["Santé", "Éducation"]},
    {"texte": "Protéger l'environnement est crucial cette année. Où veux-tu investir ?", "secteurs": ["Environnement", "Infrastructure"]},
    {"texte": "La sécurité sociale doit être renforcée. Que choisis-tu ?", "secteurs": ["Protection sociale", "Santé"]},
    {"texte": "Améliorer les écoles ou les hôpitaux ?", "secteurs": ["Éducation", "Santé"]},
]
current_question_index = 0


# Fonction pour générer options valides pour un secteur
def options_valides(total, max_total=100):
    reste = max_total - total
    possibles = [v for v in valeurs_possibles if v <= reste]
    if len(choix_secteurs_utilises) >= 4 or reste in possibles:
        return [reste]
    nb_options = min(3, len(possibles))
    return random.sample(possibles, nb_options)

# Fonction pour déterminer le GIF et message selon le secteur et le pourcentage
def etat_personnage(total, secteur=None, pourcentage=None):
    if secteur == "Santé" and pourcentage is not None:
        if pourcentage < 15:
            return "sick.gif", "Ton personnage tombe malade !"
        elif pourcentage < 25:
            return "neutral.gif", "Ton personnage se sent un peu faible."
        else:
            return "happy.gif", "Ton personnage est en pleine forme !"

    if secteur == "Éducation" and pourcentage is not None:
        if pourcentage < 15:
            return "sad.gif", "Ton personnage a du mal à apprendre."
        elif pourcentage < 25:
            return "neutral.gif", "Ton personnage progresse doucement."
        else:
            return "happy.gif", "Ton personnage est très instruit !"

    # Total général
    if total < 40:
        return "sad.gif", "Ton personnage est inquiet !"
    elif total < 80:
        return "neutral.gif", "Ton personnage attend de voir..."
    else:
        return "happy.gif", "Ton personnage est content !"

@app.route('/')
def index():
    global choix_secteurs_utilises
    choix_secteurs_utilises = []  # reset serveur à chaque refresh
    return render_template("index.html")

current_question_index = 0  # variable globale pour suivre la question

@app.route('/api/next', methods=['POST'])
def api_next():
    global current_question_index
    data = request.json
    total = data.get("total", 0)

    # Fin du jeu si total = 100 ou toutes les questions utilisées
    if total >= 100 or current_question_index >= len(questions):
        gif, message = etat_personnage(total)
        return jsonify({"fin": True, "total": total, "gif": gif, "message": message})

    # Proposer la question et ses secteurs associés
    question = questions[current_question_index]
    current_question_index += 1  # passer à la question suivante
    return jsonify({
        "fin": False,
        "texte": question["texte"],
        "secteurs": question["secteurs"]
    })


@app.route('/api/options_pourcentage', methods=['POST'])
def api_options_pourcentage():
    data = request.json
    secteur = data.get("secteur")
    total = data.get("total", 0)
    options = options_valides(total)
    return jsonify({"secteur": secteur, "options": options})

@app.route('/api/choix', methods=['POST'])
def api_choix():
    data = request.json
    total = data.get("total", 0)
    secteur = data.get("secteur")
    pourcentage = data.get("pourcentage", 0)

    total += pourcentage
    choix_secteurs_utilises.append(secteur)
    gif, message = etat_personnage(total, secteur, pourcentage)
    return jsonify({"total": total, "gif": gif, "message": message})

if __name__ == "__main__":
    app.run(debug=True)
