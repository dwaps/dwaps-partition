# DWAPS partition

ATENTION : Ce framework est en cours de développement : il n'est pas encore prêt à être utilisé !

## Modules description

_(Framework réalisé à l'aide de la librairie [vexflow] (https://github.com/0xfe/vexflow/))_

_Création, affichage et gestion de partitions de musique._

_Deux possibilités d'usage :
_
1. Création à partir de zéro.
2. Création à partir du format musicxml (dans ce cas, deux mode d'affichage : statique ou responsive).

## Installation

1/ Cloner le repository

    `git clone https://gogs.timothee.fr/timothee/apym`

2/ Se placer dans le répertoire du projet

    `cd apym`

3/ Installer les dépendances :

	`npm install`
    `bower install`
	`bower install x2js // voir section Remarque ci-dessous` 

	(en une seule ligne : `npm i && bower i && bower i x2js`)


4/ Intégrer le script suivant sans oublier l'attribut dwaps-debug (permet d'activer/désactiver le chargement minifié des dépendances) :
        
    `<script src="lib/dwaps-partition/dist/dbp.js" dwaps-debug="false"></script>`

## Remarque

La dépendance *x2js* ne peut malheureusement pas être installé de façon automatique par bower. C'est pour cette raison que l'installation est décrite plus haut en mode manuel.

---

[® DWAPS Formation] (http://dwaps.fr "Michael Cornillon")
