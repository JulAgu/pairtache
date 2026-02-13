# WorkForce Scheduler Pro
Application de planification des effectifs avec backend SQLite.

## Fonctionnalités

### Administration
- Authentification par identifiant et mot de passe
- Gestion des employés (département, compétences, email)
- Définition des disponibilités découpées à la journnée
- Vue globale du planning
- Gestion des responsables

### Chefs d’équipe
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
- [ ] Finish the translation of the entire application. I did it in english.
- [ ] Unit test.
- [ ] Add the phone number feature in the database and to the GET queries in the BE.
- [ ] Change the matching algorithm (so rustic at date).
- [ ] Decide if the complecity is enough at the current state... (More robust DB, a framework for the front ?)
- [ ] Change the schedule overview (eliminating days and correpsondance score). Add the phone number
- [ ] Do some deployment test wit real users (Flask shoul be solid fr multiple users, but I don't know if it is enough).
- [ ] There is a bug when the Matching algo is executed : "No matches found. Make sure workers have availability and tasks have requirements set." This happens even after a succesful assignation.
- [ ] After asignation. GET the assignation data inmediatly to avoid display errors.