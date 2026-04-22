# PairTâche
Application de matching des taches et de stagaires avec backend 🐍 Flask-SQLite et frontent en pure 🤘🏻JS.

## Fonctionnalités

### Administration
- Authentification par identifiant et mot de passe
- Gestion des employés (département, compétences, email)
- Définition des disponibilités découpées à la journnée
- Vue globale du planning
- Gestion des responsables

### Responsable des tâches
- Connexion par nom uniquement
- Consultation et filtrage des employés disponibles
- Proposition des tâches.
- Suivi de l'état des tâches

### Filtres
- Recherche par nom
- Filtre par compétence
- Filtre par département
- Filtre par disponibilité

## Démarrage rapide

### Prérequis
- Python 3.7 ou supérieur
- pip

### Installation

1. Installer les dépendances :
```bash
pip install -r requirements.txt
```
## TO DO
- [x] Finish the translation of the entire application. I did it in english.
- [ ] Unit tests.
- [ ] Add a filter by availability (init_day -> last_day) and remove the filter by availability status.
- [x] Add a phone number feature in the database and to the GET query in the back-end.
- [x] Change the matching algorithm (so rustic at date).
- [x] Decide if the complexity is enough at the current state... (More robust DB, a framework for the front ?)
- [x] Change the schedule overview (eliminating days and correspondance score). Add the phone number.
- [x] Modify the loginAdmin() function so that the login is not exposed in the *js* (DB or secrets.yaml)
- [ ] Setting up event handlers instead of use event.
- [ ] Do some deployment test with real users (Flask should be solid enough for multiple users but I'm not completly sure).
- [x] Add a feature to view the interns' profiles after creation; modify them should be an option ?
- [x] (optional) In the matching screen: Add a perfect match indicator when all the task skills are in the stagiaire profile.
- [ ] Link the admin authentication to the config file.
- [x] Added control over attendance or assignment periods. It is now possible to create a period that goes back in time.
