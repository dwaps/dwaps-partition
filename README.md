# DWAPS partition

ATENTION : Ce framework est en cours de développement : il n'est pas encore prêt à être utilisé !

## Modules description

_(Framework réalisé à l'aide de la librairie [vexflow] (https://github.com/0xfe/vexflow/))_

_Création, affichage et gestion de partitions de musique._

_Deux possibilités d'usage :_
1. Création à partir de zéro
2. Création à partir du format musicxml (dans ce cas, deux mode d'affichage : statique ou responsive)

## Installation

1/ Cloner le repository

    git clone https://gogs.timothee.fr/timothee/apym

2/ Se placer dans le répertoire du projet

    cd apym

3/ Installer les dépendances :

    bower install // Voir la section suivante : "Note importante !"

4/ Intégrer le script suivant sans oublier l'attribut dwaps-debug (permet d'activer/désactiver le chargement minifié des dépendances) :
        
    <script src="lib/dwaps-partition/dist/dbp.js" dwaps-debug="false"></script>

## Note importante !

La dépendance *x2js* utilisée dans ce projet ne se charge pas correctement lors de l'utilisation de la commande `bower install`.
En lisant le fichier de configuration bower.json, bower ne trouve pas le paquet dans sa base de données et stoppe l'exécution de la commande.

La solution consiste à supprimer la ligne `"abdmob/x2js": "x2js#^1.2.0"` de la liste des dépendances,
et de relancer la commande `bower install`.
Ensuite il faut installer *x2js* en le nommant : `bower install x2js`.

---

[® DWAPS Formation] (http://dwaps.fr "Michael Cornillon")