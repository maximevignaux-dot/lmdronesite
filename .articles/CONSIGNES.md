# Rédaction des articles « Conseils » de lm-drone.fr

Ce dossier commence par un point : GitHub Pages ne le publie pas.

## Le déroulé d'une publication

1. Prendre le premier sujet non coché de `sujets.md`. Si Maxime a déposé des photos de chantier
   dans `.articles/chantiers/`, le sujet « chantier » passe en priorité.
2. Écrire la fiche `fiches/<slug>.json` (modèle : `fiches/exemple.json`).
3. Lancer `python3 .articles/publier.py .articles/fiches/<slug>.json` et corriger jusqu'à « OK ».
4. Créer une branche `article/<slug>`, y commiter l'article, la page Conseils, le sitemap, llms.txt,
   la fiche, et cocher le sujet dans `sujets.md` avec la date. Pousser la branche, PAS `main`.
5. Envoyer à Maxime le titre, le chapô, la liste des intertitres et le texte complet, puis lui demander :
   « Je publie ? ». Ne rien mettre en ligne sans son accord.
6. S'il dit oui : fusionner la branche dans `main` et pousser `main` (le site se met à jour en quelques
   minutes). S'il demande des changements : les faire sur la branche, régénérer, redemander.
   S'il dit non : laisser la branche, décocher le sujet.

## Ce qu'on ne fait jamais

- **Aucun prix** : ni €, ni « à partir de », ni tarif au m². Le devis est gratuit, c'est tout.
- **Rien d'inventé** : pas de faux chantier, faux client, faux avis, faux chiffre, fausse étude.
  Un chantier n'est cité que si Maxime l'a fourni (photos + commune).
- Pas de nom de client (Pierre & Vacances, etc.) sans accord écrit de Maxime.
- Pas de contenu creux pour « faire du volume » : chaque article répond à une vraie question
  qu'un particulier, un syndic, une mairie ou un camping se pose.
- Pas de promesse de résultat garanti, pas de dénigrement nommé d'un concurrent.

## Ce qui est vrai chez LM Drone (à respecter)

- Basé à Longuenée-en-Anjou, près d'Angers. Intervient dans tous les Pays de la Loire
  (Maine-et-Loire, Loire-Atlantique, Vendée, Sarthe, Mayenne) et au-delà sur demande.
- Télépilote certifié DGAC (RS5235), assuré RC Pro.
- Produit appliqué : un **fongicide + hydrofuge en une seule application** (pas d'hydrofuge séparé).
  Pulvérisé à basse pression. Les mousses meurent en quelques semaines, la pluie rince.
- Drone pour les toitures et les hauteurs, **perche télescopique de 10 m** pour le reste.
- Pas d'échafaudage, pas de nacelle, pas de passage sur le toit, pas de haute pression.
- Devis et déplacement gratuits, réponse sous 48 h. Téléphone : 06 44 30 23 73.

## Forme

- 700 à 1 100 mots, en français simple, phrases courtes, vouvoiement.
- Titre ≤ 70 caractères avec le mot-clé principal ; description 120 à 155 caractères.
- Le chapô donne la réponse courte tout de suite (c'est ce que reprennent Google et les IA).
- 4 à 6 intertitres qui sont de vraies questions ou affirmations claires.
- Ancrer localement quand c'est vrai : climat humide de l'Anjou et de la côte, ardoise d'Anjou,
  tuffeau du Saumurois, tuile canal en Vendée, bocage, Loire.
- 2 à 4 liens internes vers les pages utiles (service, ville, secteur, autre guide), écrits en HTML
  dans le texte : `<a href="/nettoyage-facade-angers">nettoyage de façade à Angers</a>`.
- 3 à 4 questions-réponses courtes dans `faq` quand le sujet s'y prête.
- Image : uniquement une photo existante du dossier `uploads/` (voir la liste dans `sujets.md`).
