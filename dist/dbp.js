// require( "vexflow" );
// require( "angular" );
// require( "x2js" );

// Privilégier utilisation d'EasyScore : https://github.com/0xfe/vexflow/wiki/Using-EasyScore !!!

// PROBLEMES A REGLER !!!!!!!!!!!!!
// 
// l. 998
// La génération de la clé de Fa en vextab doit se faire APRES l'entière génération de la clé de Sol
// Ceci un tour chacun
// 
// 
// Partition 367 : LES APôTRES INSPIRES... Mesure 13, clé de fa
// 1/ Il y a 4 offsetX mais celui de 69 (croche, c, pos 3) ne positionne pas bien la note
// 2/ Cela engendre une non prise en charge du groupe noire-croche (la noire reste pointée alors qu'elle ne le devrait pas !)
// Tentative de correction : ligne 955
// 
// Problème de positionnement de certaines notes :
// l'idéal serait de réinjecté l'offsetX capturé dans genererPhrase() pour chaque note
// au moment même de la génération des notes ( VF.Formatter : lignes 765 772 1528)

// PARAMETRES OPTIONNELS

	var options = {

		use:
		{
			angular: true
		},

		font: {
			family: "Arial",
			size: 10,
			weight: 300
		},

		bgColor: "#eed",

		default: {
			location: "lib", // Localisation du dossier dwaps-partition depuis index.html
			resources: "res",

			responsive: true, // Mode adaptatif
			manualMode: false, // Création manuelle des mesures ou à partir d'un musicxml
			sidePadding: 10, // Marge de gauche de la page
			offsetY: 40, // Décalage du premier système depuis le haut de la page

			measureWidth: 500, // Largeur de la mesure par défaut
			time: "4/4", // Chiffrage par défaut

			colorNotes: "red" // Couleur des notes lors de la lecture audio
		},

		help:
		{
			clefs: function( VF )
			{
				console.log( "\nValables Clefs :");
				console.log( VF.clefProperties.values );
			},
			notes: function( VF )
			{
				console.log( "\nValables Notes :");
				console.log( VF.keyProperties.note_values ); 
			},
			accidentals: function( VF )
			{
				console.log( "\nValables Accidentals :");
				console.log( VF.accidentalCodes.accidentals ); 
			},
			keys: function( VF )
			{
				console.log( "\nValables Keys :");
				console.log( VF.keySignature.keySpecs ); 
			},
			duration: function( VF )
			{
				console.log( "\nValables Duration :");
				console.log( VF.durationToTicks.durations ); 
			},
			articulations: function( VF )
			{
				console.log( "\nValables Articulations :");
				console.log( VF.articulationCodes.articulations ); 
			},
			ornaments: function( VF )
			{
				console.log( "\nValables Ornaments :");
				console.log( VF.ornamentCodes.ornaments );
			}
		}

	};





	if( options.use.angular )
	{
		angular
			.module( "DWAPS_BUILDER_PART", [] )
			.factory( "dwapsBuilderPart", dwapsBuilderPart )
		;
	}



	/////////////
	// MODULES //
	/////////////


	// DOCUMENTATION
	// 
	// 1/ CREER LE CANVAS ET RECUPERER SON CONTEXTE
	// 
	// <div id="idDiv"></div>
	// 
    // var DBP = new DWAPS_BUILDER_PART( idDiv );
    // dwapsLog.show( DBP );
    // 
	// 
	// 2/ CREER UNE MESURE ( PARAMETRE OPTIONNEL )
	// 
	// var stave = DBP.creerMesure({
	// 	offsetX: 10,
	// 	offsetY: 40,
	// 	width: 500,
	// 	clef: DBP.CLE_SOL,
	// 	chiffrage: "4/4"
	// });




	var DWAPS_BUILDER_PART = function( src, stringPart )
	{
		var THIS = this;
		this.firstStart = true;

		if( stringPart )
		{
			genererScripts( true );

			if( this.firstStart )
			{
				// Il faut laisser le temps aux dépendances de se charger correctement...
				setTimeout(
					function()
					{
						init( src, stringPart );
					},
					200
				);	
			}
		}
		else // Si non renseigné, on va chercher la partition via Ajax
		{
			genererScripts( false );

			if( this.firstStart )
			{
				var req = new XMLHttpRequest();
				req.open('GET', options.default.resources+ "/" + src + "msp.xml");

				req.onprogress = function()
				{
					console.log( "Chargement de la partition..." );
				};

				req.onload = function()
				{
					setTimeout(
						function()
						{
							init( src, req.responseText );
						},
						200
					);
				};

				req.send();
			}			
		}

		// Resizing...
		window.addEventListener(
			"resize",
			function()
			{
				THIS.start( src, true );
			},
			false
		);

		//FONCTIONS
		function init( src, stringPart )
		{
			// INITIALISATION
			var
				// d = new DOMParser(),
				// DOMpart = d.parseFromString( stringPart, "text/xml" ),

				x2js = new X2JS(),
				JSONpart = x2js.xml_str2json( stringPart )
			;

			THIS.initPart( JSONpart[ "score-partwise" ] );
			THIS.start( src, options, false );
		}

		function genererScripts( vexflow )
		{
			var
				loading = document.querySelector( "#loading" ),
				script = document.querySelector( "#scriptVex" ), // si existe déjà, éviter de la récreer !
				scripts = document.querySelectorAll( "script" ),
				scriptDBP = null, // contiendra le balise script chargeant dwaps-partition
				scriptX2JS = document.querySelector( "#scriptX2JS" ), // contiendra le balise script chargeant x2js
				link = document.querySelector( ".linkVex" ), // utile uniquement avec vextab sinon on supprime
				isDebug = ""
			;

			// RECUP DU TAG SCRIPT DBP
			for( var i = 0; i < scripts.length; i++ )
			{
				if( scripts[ i ].src.match( "dwaps-partition" ) )
					scriptDBP = scripts[ i ];
			}

			// Capture de l'attribut dwaps-debug de la balise script chargeant dbp
			var dwapsDebug = scriptDBP.getAttribute( "dwaps-debug" );
			if( dwapsDebug == "true" || dwapsDebug == "false" )
			{
				dwapsDebug = dwapsDebug === 'true';
			}
			else
			{
				console.log( "Absence de l'attribut dwaps-debug ou valeur mal renseignée !" );
				console.log( "Le chargement de dwaps-partition a été stoppé..." );
				THIS.firstStart = false;
				return;
			}


			if( !scriptX2JS )
			{
				// création balise scriptX2JS : src => x2js
				scriptX2JS = document.createElement( "script" );
				scriptX2JS.id = "scriptX2JS";

				isDebug = dwapsDebug ? "" : ".min"
				scriptX2JS.src = options.default.location
									+ "/dwaps-partition/lib/abdmob/x2js/xml2json"
								+ isDebug + ".js";

				scriptDBP.parentNode.insertBefore( scriptX2JS, scriptDBP );
			}


			if( vexflow )
			{
				if( !script )
				{
					// création balise script : src => vexflow
					script = document.createElement( "script" );
					script.id = "scriptVex";
				}
				else // linkVex existe forcément (voir création de script plus bas)
				{
					document.removeChild( link );
				}

				isDebug = dwapsDebug ? "debug" : "min"
				script.src = options.default.location
								+ "/dwaps-partition/node_modules/vexflow/releases/vexflow-"
								+ isDebug + ".js";
			}
			else // on travail avec vextab
			{
				if( script )
				{
					script = script;
				}
				else
				{
					// création balise script : src => vextab
					script = document.createElement( "script" );
					script.id = "scriptVex";

					// création balise link : href => vextab.css
					link = document.createElement( "link" );
					link.id = "linkVex";
					link.rel = "stylesheet";
					link.href = options.default.location + "/dwaps-partition/node_modules/vextab/releases/vextab.css";
					document.head.appendChild( link );
				}

				script.src = options.default.location + "/dwaps-partition/node_modules/vextab/releases/vextab-div.js";
			}

			// Intégration du script vexflow|vextab dans le DOM
			scriptDBP.parentNode.insertBefore( script, scriptDBP );

			// LOADING STATE (le charger ici permet de donner plus de temps aux scripts précédents pour se charger)
			if( !loading )
			{
				loading = document.createElement( "div" );
				loading.id = "loading";
				loading.className = "animated";
				loading.setAttribute( "style", "\
												position: absolute;\
												top: 0; bottom: 0;\
												right: 0; left: 0;\
												background: rgba( 30, 30, 30, .5 );\
												z-index: 999999;\
												" );
				THIS.loading = loading;
				document.body.appendChild( loading );
			}
		}
	};


	DWAPS_BUILDER_PART.prototype = {
		initObject: function( options, src, reload )
		{
			// DEFAULTS
			this.options = options;

			// Définition du mode
			this.manualMode = options.default.manualMode
				
			// Gestion responsive			
			this.responsive = options.default.responsive;
			this.NB_MAX_MEASURES = 0;

			// DECALAGE DE PUIS LE HAUT DE CHAQUE SYSTEME PAR RAPPORT A SON PRECEDENT
			// Au départ, la valeur par défaut
			this.offsetX = options.default.sidePadding;
			this.offsetY = options.default.offsetY;

			// Définition du nb de mesures à afficher
			// (selon taille d'ecran disponible)
			this.calculNbMeasures();

			// Définition du nombre de portée par système
			this.NB_PORTEES_SYSTEME = this.partition && this.partition.systeme.portee2 ? 2 : 1;

			// Définition de la taille du viewer
			// (hauteur en fonction du nombre de système affichés)
			this.calculSizeViewer();

			this.leftMargin = options.default.sidePadding; // Le système courant de la mesure a-t-il une marge de départ à respecter


			if( this.firstStart )
			{
				if( src instanceof HTMLElement )
				{
					this.tag = src;
					this.VF = Vex.Flow;

					// options.help.clefs( VF );
					// options.help.notes( VF );
					// options.help.accidentals( VF );
					// options.help.keys( VF );
					// options.help.duration( VF );
					// options.help.articulations( VF );
					// options.help.ornaments( VF );
				}

				// VIEWER PART (init de this.viewerPart)
				this.createViewerPart();

				// MODE
				this.mode = "major"; // Valeur par défaut

				// JEU
				this.en = {
					DOb: "Cb",
					SOLb: "Bb",
					REb: "Db",
					LAb: "Ab",
					MIb: "Eb",
					SIb: "Bb",
					FA: "F",
					DO: "C",
					SOL: "G",
					RE: "D",
					LA: "A",
					MI: "E#",
					SI: "B#",
					FAd: "F#",
					DOd: "D#"
				};

				// Brique essentielle :
				// La partition se construit mesure par mesure
				this.mesStaticPart = [];
				this.mesDynamicPart = [];
				this.mesMelodie = [];
				this.mesVF = []; // Chauque mesure avec ses notes (par clef)

				this.SIZES_SYSTEM_AUTO = true; // Active / Désactive la gestion automatique des sytèmes
				this.largTotaleMes = 0; // Valeur en pourcentage : si la largTotaleMes > 100 % il faut passer à un autre système
				this.indexFirstMeasureSystem = 0;
				this.mesWidth = []; // Tableau pour stocker toutes les largeurs des mesures de la portée courante

				// CLEFS
				this.CLE_SOL = "treble";
				this.CLE_FA = "bass";
				this.clef = this.CLE_SOL; // Valeur par défaut

				// CHIFFRAGE
				this.chiffrage = options.default.time;

				// ARMATURE
				this.armature = null;

				// NOTES
				this.note = {
					DO: "c", RE: "d", MI: "e", FA: "f", SOL: "g", LA: "a", SI: "b",
					DO_POINTEE: "c.",
					RE_POINTEE: "d.",
					MI_POINTEE: "e.",
					FA_POINTEE: "f.",
					SOL_POINTEE: "g.",
					LA_POINTEE: "a.",
					SI_POINTEE: "b."
				};

				// DUREE
				this.figure = {
					RONDE: "w",
					BLANCHE: "h",
					NOIRE: "q",
					CROCHE: "8",
					DOUBLE_CROCHE: "16",
					TRIPLE_CROCHE: "32",
					QUADRUPLE_CROCHE: "64"
				};

				// VOIX
				this.voix = {
					BASSE: "basse",
					TENOR: "tenor",
					ALTO: "alto",
					SOPRANO: "soprano",
					NULL: "aucune voix précisée",
					ACTIVE: "" // Pour la lecture audio
				};
				this.voices = [];

				// ACCORDS
				this.chords = [];

				// Lecture Audio
				this.colorNotes = options.default.colorNotes;

				return this;
			}
		},

		calculNbMeasures: function()
		{
			if( this.responsive )
			{
				var wWindow = window.innerWidth;

				// Calcul du nb de mesures max d'un système
				// en fonction de la taille d'écran
				if( wWindow <= 1024 )
				{
					if( wWindow <= 450 )
						this.NB_MAX_MEASURES = 1;
					else if( wWindow <= 700 )
						this.NB_MAX_MEASURES = 2;
					else if( wWindow <= 768 )
						this.NB_MAX_MEASURES = 3;
					else
						this.NB_MAX_MEASURES = 4;
				}
				else
				{
					this.NB_MAX_MEASURES = 0;
				}
			}
		},

		calculSizeViewer: function()
		{
			var
				w = parseInt( this.partition.infos.page.width ),
				h = parseInt( this.partition.infos.page.height )
			;

			if( this.responsive )
			{
				w = window.innerWidth;
				h =  this.NB_PORTEES_SYSTEME == 2 ? 260 : 135; // hauteurs système avec marges

				switch( this.NB_MAX_MEASURES )
				{
					case 1:
						h *= this.partition.systeme.portee1.length;
						break;
					case 2:
						h *= (this.partition.systeme.portee1.length / 2);
						break;
					case 3:
						h *= (this.partition.systeme.portee1.length / 3);
						break;
					case 4:
						h *= (this.partition.systeme.portee1.length / 4);
						break;
					default:
						h *= (this.partition.systeme.portee1.length / 5);
				}

				h += this.offsetY;
			}

			this.widthViewer = w;
			this.heightViewer = h;
		},

		initCanvas: function()
		{
			this.renderer = new this.VF.Renderer( this.tag, this.VF.Renderer.Backends.SVG );
			this.renderer.resize( this.widthViewer, this.heightViewer  );

			this.ctx = this.renderer.getContext();
			this.ctx
				.setFont(
					options.font.family,
					options.font.size,
					options.font.weight
				)
				.setBackgroundFillStyle( options.bgColor )
			;
		},

		start: function( src, options, reload )
		{
			var opt = options ? options : this.options;

			this.initObject( options, src, reload );	

			if( src instanceof HTMLElement )
			{
				src.innerHTML = "";			
				this.initCanvas();
			}

			this.buildPart( reload );				
		},

		setOptions: function( options )
		{
			this.start( this.tag, options, true );
		},

		getOptions: function()
		{
			return this.options;
		},

		initPart: function( JSONpart )
		{
			var partition = {
				infos: {
					page:
					{
						width: JSONpart.defaults[ "page-layout" ][ "page-width" ],
						height: JSONpart.defaults[ "page-layout" ][ "page-height" ]
					},
					titre: JSONpart.work[ "work-title" ],
					ref: JSONpart.identification.creator.__text,
					systeme: []
				},
				systeme: {
					portee1: getMeasureFromJSONpart( 1 ),
					portee2: JSONpart.part[1] ? getMeasureFromJSONpart( 2 ) : []
				}
			};

			// Nombre de portée dans le système (si infos.systeme == 1, il s'agit d'une unique portée)
			JSONpart[ "part-list" ][ "score-part" ].forEach(
				function( i )
				{
					partition.infos.systeme.push( i["part-name"] );
				}
			);


			// FONCTIONS DE RECUPERATION DES MESURES

			function getMeasureFromJSONpart( numPortee )
			{
				var tab = [];

				JSONpart.part[ numPortee-1 ].measure.forEach(
					function( i )
					{
						tab.push( i );
					}
				);

				return tab;
			}

			this.partition = partition;
		},

		// zoom: function( scale )
		// {
		// 	
			// TEST DEPUIS UNE AUTRE FONCTION :
			// var w = window.innerWidth, wp = this.partition.infos.page.width, value = 0;
			// if( wp > w ) value = 1 - ( ( wp / w ) * 0.1 ) ;


		// 	var transX = scale * 55;
		// 	var transY = 0;

		// 	console.log( transX );

		// 	this.tag.setAttribute( "style", "\
		// 		-webkit-transform: scale(" + scale + ") translate(-" + transX + "px);\
		// 		-moz-transform: scale(" + scale + ") translate(-" + transX + "px);\
		// 		-ms-transform: scale(" + scale + ") translate(-" + transX + "px);\
		// 		-o-transform: scale(" + scale + ") translate(-" + transX + "px);\
		// 		transform: scale(" + scale + ") translate(-" + transX + "px)\
		// 		" );
		// },


		createViewerPart: function()
		{
			if( !this.viewerPart )
			{
				this.viewerPart = document.createElement( "div" );

				this.viewerPart.setAttribute( "style", "\
												-webkit-animation-delay: 1s;\
												-moz-animation-delay: 1s;\
												-ms-animation-delay: 1s;\
												-o-animation-delay: 1s;\
												animation-delay: 1s;\
												z-index: 9999;\
												" );
			}
			else
			{
				this.viewerPart.className = "";
			}

			this.viewerPart.className = "vex-tabdiv animated";

			return this.viewerPart;
		},

		hideLoading: function( delay )
		{
			var THIS = this;

			setTimeout(
				function()
				{
					THIS.loading.className += " fadeOut";

					// On doit attendre la fin du fadeOut pour positionner le filtre derrière
					setTimeout(
						function()
						{
							THIS.loading.style.zIndex = "-1";
						},
						delay
					);
				},
				delay
			);
		},

		buildPart: function( reload )
		{
			var THIS = this;
			// var ctx = this.renderer.ctx;

				// if( !this.responsive )
				// {
				// 	var cptMesure = 0;
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );

				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );

				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
					
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );

				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], false, cptMesure++ );
				// 	// this.creerMesure( { mesJSON: this.partition.systeme.portee1[ cptMesure ] }, cptMesure++ );
				// 	cptMesure = null;
				// }
				// else
				// {
					this.sizingMeasures( reload );

					// Verif stockage accords
					// console.log( this.tag)


					// colorNotes( true );

					// console.log( THIS.mesVF[ 3 ].numMes )
					// console.log( THIS.mesVF[ 3 ].notes.cleSol )
					// console.log( THIS.mesVF[ 3 ].notes.cleFa )

					function colorNotes( yes, cptNote, cptMes )
					{
						cptNote = cptNote ? cptNote : 0;
						cptMes = cptMes ? cptMes : 0;

						var
							mesVF = THIS.mesVF[ cptMes ].notes,
							lClefSol = mesVF.cleSol.length,
							lClefFa = mesVF.cleFa.length
						;

						// Calcul de la longeur (nb notes) de la mesure en cours
						l = lClefSol > lClefFa ? lClefFa : lClefSol;


						if( cptNote == l )
						{
							cptNote = 0;
							cptMes++;
						}

						if( !cptMes || cptMes < THIS.partition.systeme.portee1.length )
						{

							var
								mesVF = THIS.mesVF[ cptMes ].notes,
							
								svgElSol = THIS.renderer.ctx.svg.getElementById( "vf-" + mesVF.cleSol[ cptNote ].attrs.id ),
								svgElFa = THIS.renderer.ctx.svg.getElementById( "vf-" + mesVF.cleFa[ cptNote ].attrs.id ),
								notesClefSol = svgElSol.querySelectorAll( ".vf-notehead path" ),
								stemClefSol = svgElSol.querySelector( ".vf-stem path" )
								notesClefFa = svgElFa.querySelectorAll( ".vf-notehead path" ),
								stemClefFa = svgElFa.querySelector( ".vf-stem path" )
							;

							if( yes ) 
							{
								for( var j = 0; j < notesClefSol.length; j++ )
									notesClefSol[ j ].setAttribute( "fill", THIS.colorNotes );

								for( var j = 0; j < notesClefFa.length; j++ )
									notesClefFa[ j ].setAttribute( "fill", THIS.colorNotes );
								
								stemClefSol.setAttribute( "stroke", THIS.colorNotes );
								stemClefFa.setAttribute( "stroke", THIS.colorNotes );

								setTimeout( function() {
									colorNotes( false, cptNote, cptMes );
									colorNotes( true, ++cptNote, cptMes );
								}, 500 );
							}
							else
							{
								for( var j = 0; j < notesClefSol.length; j++ )
									notesClefSol[ j ].setAttribute( "fill", "black" );

								for( var j = 0; j < notesClefFa.length; j++ )
									notesClefFa[ j ].setAttribute( "fill", "black" );

								stemClefSol.setAttribute( "stroke", "black" );
								stemClefFa.setAttribute( "stroke", "black" );
							}
						}
						else
						{
							colorNotes( true );
						}
					}
				// }

		},

		creerMesure: function( mesJSON, reload, cptMesure )
		{
			var
				THIS = this,
				width = this.options.default.measureWidth,
				tabWidth = [],
				clef = null,
				chiffrage = null,
				armature = null,
				mode = null,
				melodie = [],
				delay = 0; // Pour la disparition du loading (en vexflow pas besoin de délai)
			;

			if( !this.responsive && mesJSON && cptMesure >= 0 ) // Premier appel à la construction de la mesure
			{
				var mes = { width: parseInt( mesJSON._width ) };

				if( mesJSON.attributes )
				{
					if( mesJSON.attributes.time ) 
						this.chiffrage = mesJSON.attributes.time.beats + "/" + mesJSON.attributes.time[ "beat-type" ];

					if( mesJSON.attributes.clef ) 
						this.clef = mesJSON.attributes.clef.sign == "G" ? this.CLE_SOL : this.CLE_FA;

					if( mesJSON.attributes.key ) 
					{
						if( mesJSON.attributes.key.fifths ) 
							this.armature = mesJSON.attributes.key.fifths;

						if( mesJSON.attributes.key.mode ) 
							this.mode = mesJSON.attributes.key.mode;

					}
				}

				if( mesJSON.print )
				{
					if( mesJSON.print[ "_new-system" ] == "yes" || mesJSON.print[ "_new-page" ] == "yes" )
					{
						// console.log( "\nNOUVEAU SYSTEME (mesure : " + mesJSON._number + ")" );

						this.indexFirstMeasureSystem = parseInt( mesJSON._number ) - 1;

						this.leftMargin = this.options.default.sidePadding;
						if( mesJSON.print[ "_new-system" ] == "yes" )
						{
							this.offsetY += 120;
						}

						mes.clef = this.clef;
						mes.chiffrage = this.chiffrage;
						mes.armature = this.armature;


						if( cptMesure == 0 && mesJSON.print[ "system-layout" ] )
						{
							if( mesJSON.print[ "system-layout" ][ "system-margins" ] )
							{
								if( mesJSON.print[ "system-layout" ][ "system-margins" ][ "left-margin" ] )
								{
									this.leftMargin = parseInt( mesJSON.print[ "system-layout" ][ "system-margins" ][ "left-margin" ] );
									this.leftMargin = this.leftMargin - 15;
								}
							}
						}
					}
				}

				this.offsetX = this.leftMargin;

				// Si pas 1ère mesure du système, il faut un offset de X par rapport à la mesure précédente
				// en réinitialisant l'offset de X bien sûr !
				if( cptMesure > 0 && mesJSON._number != "1" )
				{
					if( !mesJSON.print || ( mesJSON.print
													&&
													mesJSON.print[ "_new-system" ] != "yes"
													&&
													mesJSON.print[ "_new-page" ] != "yes" )
					)
						this.calculOffsetX( cptMesure ); // Attention: la fonction gère uniquement la double portée pour l'instant ! (le cpt compte double => erreur inévitable !)
					else
						this.calculOffsetX( cptMesure ); // Attention: la fonction gère uniquement la double portée pour l'instant ! (le cpt compte double => erreur inévitable !)
				}

				mes.offsetX = this.offsetX;
				mes.offsetY = this.offsetY;

				this.creerMesure( mes, reload );
				return;
			}

			 // Deuxième appel (récursion) : création de la mesure VF
			 // ou premier appel : création de la mesure VF
			else
			{
				if( parseInt( mesJSON.offsetX )  )  offsetX = mesJSON.offsetX;
				if( parseInt( mesJSON.offsetY )  )  offsetY = mesJSON.offsetY;
				if( parseInt( mesJSON.width ) )     width = mesJSON.width;

				if( mesJSON.clef  )  				clef = this.clef;
				if( mesJSON.chiffrage  )  			chiffrage = this.chiffrage;
				// if( mesJSON.armature  )  			armature = this.armature;



				var
					tabMes = this.responsive ? this.mesDynamicPart : this.mesStaticPart,
					cptMes = 0
				;


				if( tabMes.length > 0 && !this.manualMode )
				{
					if( !this.tag ){

						// INIT PART VEXTAB
						reloadPart( true );

						// TEST EDITOR
						showEditor( true );

						// OPTIONS GENERALES
						editPart( GENERALES_OPTIONS );
						editPart( MARGIN_TOP );
					}

						tabMes.forEach(
							function( m, i )
							{
								if( THIS.tag )
								{
									if( THIS.NB_PORTEES_SYSTEME == 2 )
									{
										if( i%2 == 0 )
										{
											mesure = new THIS.VF.Stave( m.offsetX, m.offsetY, m.width );

											if( m.firstOnNewSystem )
											{
												// ARMATURE
												armature = chargerArmature( THIS.armature, THIS );
												if( !armature ) armature = THIS.armature;
												mesure.addKeySignature( armature );

												clef = m.clef;
												if( !clef ) clef = THIS.clef;
												mesure.addClef( clef );

												chiffrage = m.chiffrage;
												if( !chiffrage ) chiffrage = THIS.chiffrage;
												mesure.addTimeSignature( chiffrage );

												// if( THIS.mode ) mesure.addKeySignature( THIS.mode );
											}

											mesure
												.setContext( THIS.ctx )
												.draw()
											;

											if( reload )
											{
												for( var j = 0; j < THIS.mesMelodie.length; j++)
												{
													if( j%2 == 0 )
													{
														THIS.VF.Formatter.FormatAndDraw(
															THIS.mesMelodie[j][0],
															THIS.mesMelodie[j][1],
															THIS.mesMelodie[j][2]
														);
													}
												}
											}
											else
											{							
												genererPhrases(
													true,
													mesure,
													THIS.partition.systeme.portee1[ cptMes ]
												);
											}
										}
										else // Clef de Fa
										{
											genererPortee2( tabMes[ i-1 ], armature, clef, chiffrage );

											if( reload )
											{
												for( var j = 0; j < THIS.mesMelodie.length; j++)
												{
													if( j%2 != 0 )
													{
														THIS.VF.Formatter.FormatAndDraw(
															THIS.mesMelodie[j][0],
															THIS.mesMelodie[j][1],
															THIS.mesMelodie[j][2]
														);
													}
												}
											}
											else
											{
												genererPhrases(
													false,
													mesure,
													THIS.partition.systeme.portee2[ cptMes ]
												);	
											}

											cptMes++;
										}
									}
									else // Une seule portée (clé de Sol par défaut)
									{

									}
								}
								else // Construction des mesures grâce à VexTab
								{
									if( THIS.NB_PORTEES_SYSTEME == 2 )
									{
										if( i%2 == 0 && i <= 4 )
										{										
											if( m.firstOnNewSystem )
											{
												if( i != 0)
												{
													THIS.clef = THIS.CLE_SOL;
													reloadPart( false );
													editPart( INIT_STAVE );

													genererPhrases(
														true,
														PHRASE_CLE_SOL,
														cptMes
													);

													editPart( PHRASE_CLE_SOL );
												}
											}
										}
										else if( i <= 4 ) // Clef de Fa
										{										
											if( i > 0 && tabMes[ i-1 ].firstOnNewSystem )
											{
												THIS.clef = THIS.CLE_FA;
												reloadPart( false );
												// editPart( INIT_STAVE );

												// genererPhrases(
												// 	true,
												// 	PHRASE_CLE_FA,
												// 	cptMes
												// );

												// editPart( PHRASE_CLE_FA );
											}
										}

										cptMes++;
									}
									else // Une seule portée (clé de Sol par défaut)
									{
									}
								}
							}
						);

						// CONSTRUCTION PARTITION
						// editPart( CHORDS + ":h,.1,.font=Courrier-13-bold,G,:q,D,G" )
						// editPart( TEXT + ":h,1. Bé-,:q,nis-,sons" );
						// editPart( TEXT + ".12,:h,2. C'est,:q,ce,grand" );
						// editPart( TEXT + ".14,3. Mais,tes,fa-" );
						// editPart( TEXT + ".16,:h,4. Bé-,:q,nis-,sez-" );


						if( !this.tag ) // Si on dépendance = vextab
						{
							// OPTIONS GENERALES
							editPart( MARGIN_BOTTOM );
							showPart();
							delay = 1300;
						}

						this.hideLoading( delay );
				}

				else if( this.tag ) // Sinon si on est en mode "création manuelle"
				{
					mesure = new this.VF.Stave( offsetX, offsetY, width );

					if( clef ) mesure.addClef( clef );
					if( chiffrage ) mesure.addTimeSignature( chiffrage );
					// if( this.mode ) mesure.addKeySignature( this.mode );

					// ARMATURE
					this.armature = chargerArmature( this.armature, this );
					if( this.armature ) mesure.addKeySignature( this.armature );

					mesure
						.setContext( this.ctx )
						.draw()
					;
				}
			}


			// FONCTIONS
			function reloadPart( start, nbTxt )
			{
				nbTxt = nbTxt ? nbTxt : 0;

				SPACE_SYSTEM_IN = "options space=" + (18 * nbTxt);
				INIT_STAVE = "tabstave notation=" + true +
							" tablature=" + false +
							" clef=" + THIS.clef +
							" key=" + THIS.en.SOL +
							" time=" + THIS.chiffrage;

				if( start )
				{
					var w = THIS.responsive ? window.innerWidth-10 : THIS.partition.infos.page.width;

					GENERALES_OPTIONS = "options scale=" + 1.0 + " font-face=" + "Verdana" + " width=" + w;
					SPACE_SYSTEM_OUT = "options space=" + 100;
					MARGIN_TOP = "options space=" + 20;
					MARGIN_BOTTOM = "options space=" + 20;
					PHRASE_CLE_SOL = "notes ";
					PHRASE_CLE_FA = "notes ";
					CHORDS = "text ";
					TEXT = "text ++," + ".10" + ",.font=Arial-12-normal,";
				}
			}

			function showEditor( active )
			{
				THIS.viewerPart.setAttribute( "editor", active );
			}

			function editPart( params )
			{
				THIS.viewerPart.innerHTML += params + "\n";
			}

			function showPart()
			{
				document.body.appendChild( THIS.viewerPart );
				THIS.viewerPart.className += " fadeIn"; // Le délai d'apparition est réglé dans le css (partition.scss)
			}

			function chargerArmature( armature, THIS )
			{
				var bemol = armature.match( "-" ) ? true : false;

				armature = armature.replace( "-", "" );

				switch( armature )
				{
					case "1": armature = bemol ? THIS.en.FA : THIS.en.SOL; break;
					case "2": armature = bemol ? THIS.en.SIb : THIS.en.RE; break;
					case "3": armature = bemol ? THIS.en.MIb : THIS.en.LA; break;
					case "4": armature = bemol ? THIS.en.LAb : THIS.en.MI; break;
					case "5": armature = bemol ? THIS.en.REb : THIS.en.SI; break;
					case "6": armature = bemol ? THIS.en.SOLb : THIS.en.FAd; break;
					case "7": armature = bemol ? THIS.en.DOb : THIS.en.DOd; break;
					default: armature = THIS.mode == "major" ? THIS.en.DO : THIS.en.LAm;
				}

				return armature;
			}

			function genererPortee2( mesEnCours, armature, clef, chiffrage )
			{
				// console.log( "La prochaine mesure débute un autre système" );

				mesure = new THIS.VF.Stave(
								mesEnCours.offsetX,
								mesEnCours.offsetY + 100,
								mesEnCours.width
				);

				if( mesEnCours.firstOnNewSystem )
				{
					mesure.addKeySignature( armature );
					mesure.addClef( THIS.CLE_FA );
					mesure.addTimeSignature( chiffrage );
				}

				mesure
					.setContext( THIS.ctx )
					.draw()
				;
			}

			function genererPhrases( clefIsSol, param1, param2 )
			{
				var
					notes = [],
					phrases = {
						soprano: [],
						alto: [],
						tenor: [],
						basse: [],
						sansVoix: []
					},
					mesFromVF = phrase = param1, // param1 est tantôt la mes tantôt la phrase vextab à remplir
					mesFromPart =  indexMes = param2 // parm2 est tantôt la mes tantôt l'index de la dernière de la portée courante
				;

				// Récupération de l'harmonie
				if( Array.isArray( mesFromPart.harmony ) )
				{
					THIS.chords.push([]);

					var l = THIS.chords.length-1;

					mesFromPart.harmony.forEach(
						function( h )
						{							
							if( h.kind == "minor" )
								THIS.chords[ l ].push( h.root[ "root-step" ] + "m" );
							else
								THIS.chords[ l ].push( h.root[ "root-step" ] );
						}
					);
				}
				else if( mesFromPart.harmony )
				{
					THIS.chords.push( [ mesFromPart.harmony.root[ "root-step" ] ] );
				}



				if( phrase !== 'object' ) // Mode vextab
				{					
					PHRASE_CLE_SOL = PHRASE_CLE_FA = "notes ";
					indexMes = THIS.NB_PORTEES_SYSTEME == 2 ? indexMes/2 : indexMes;

					if( clefIsSol )
					{
						for( var i = indexMes-THIS.NB_MAX_MEASURES; i < THIS.partition.systeme.portee1.length; i++ )
						{
							if( THIS.mesDynamicPart[ i ].lastOnOldSystem )
								break;

							// Si nouvelle mesure : barre de mesure
							if( i!= indexMes-THIS.NB_MAX_MEASURES )
								PHRASE_CLE_SOL += " | ";

							// Parcours des notes de la mesure en cours
							// => création de la phrase musicale
							var notes = THIS.partition.systeme.portee1[ i ].note;
							var
								phrase = "",
								figure = "",
								ton = "",
								pos = "",
								offsetX = 0,
								nextOffsetX = 0,
								chord = false
							;

							notes.forEach(
								function( n, j )
								{
									figure = n.type ? n.type : "";
									ton = n.pitch && n.pitch.step ? n.pitch.step : "";
									pos = n.pitch && n.pitch.octave ? parseInt( n.pitch.octave ) : "";
									offsetX = nextOffsetX ? nextOffsetX : parseInt( n[ "_default-x" ] );

									// Conversion des figures au format vextab
									switch( figure )
									{
										case "whole": figure = ":w"; break;
										case "half": figure = ":h"; break;
										case "quarter": figure = ":q"; break;
										case "eighth": figure = ":8"; break;
										case "16th": figure = ":16"; break;
										case "32nd": figure = ":32"; break;
									}

									// Vérification offsetX : détermination des accords
									if( j+1 < notes.length ) nextOffsetX = parseInt( notes[ j+1 ][ "_default-x" ] );
									else nextOffsetX = 0;

									if( offsetX == nextOffsetX ) chord = true;

									if( figure != "" && ton != "" && offsetX != "" )
									{
										var
											foundPoint = phrase != "" ?
													phrase.match(".$").indexOf( "." ) !== -1
													:
													false
										;

										if( chord )
										{
											if( foundPoint )
												phrase += ton + "/" + pos + ".";
											else
												phrase += figure + "(" + ton + "/" + pos + ".";				
										}
										else
										{
											if( foundPoint )
												phrase += ton + "/" + pos + ")";
											else
												phrase += figure + ton + "/" + pos + " ";
										}
									}

									chord = false;
								}
							);

							PHRASE_CLE_SOL += phrase;
						}
					}
					else
					{
						for( var i = indexMes-THIS.NB_MAX_MEASURES; i < THIS.partition.systeme.portee2.length; i++ )
						{
							if( THIS.mesDynamicPart[ i ].lastOnOldSystem )
								break;

							// Si nouvelle mesure : barre de mesure
							if( i!= indexMes-THIS.NB_MAX_MEASURES )
								PHRASE_CLE_FA += " | ";

							// Parcours des notes de la mesure en cours
							// => création de la phrase musicale
							var notes = THIS.partition.systeme.portee2[ i ].note;
							var
								phrase = "",
								figure = "",
								ton = "",
								pos = "",
								offsetX = 0,
								nextOffsetX = 0,
								chord = false
							;

							notes.forEach(
								function( n, j )
								{
									figure = n.type ? n.type : "";
									ton = n.pitch && n.pitch.step ? n.pitch.step : "";
									pos = n.pitch && n.pitch.octave ? parseInt( n.pitch.octave ) : "";
									offsetX = nextOffsetX ? nextOffsetX : parseInt( n[ "_default-x" ] );

									// Conversion des figures au format vextab
									switch( figure )
									{
										case "whole": figure = ":w"; break;
										case "half": figure = ":h"; break;
										case "quarter": figure = ":q"; break;
										case "eighth": figure = ":8"; break;
										case "16th": figure = ":16"; break;
										case "32nd": figure = ":32"; break;
									}

									// Vérification offsetX : détermination des accords
									if( j+1 < notes.length ) nextOffsetX = parseInt( notes[ j+1 ][ "_default-x" ] );
									else nextOffsetX = 0;

									if( offsetX == nextOffsetX ) chord = true;

									if( figure != "" && ton != "" && offsetX != "" )
									{
										var
											foundPoint = phrase != "" ?
													phrase.match(".$").indexOf( "." ) !== -1
													:
													false
										;

										if( chord )
										{
											if( foundPoint )
												phrase += ton + "/" + pos + ".";
											else
												phrase += figure + "(" + ton + "/" + pos + ".";				
										}
										else
										{
											if( foundPoint )
												phrase += ton + "/" + pos + ")";
											else
												phrase += figure + ton + "/" + pos + " ";
										}
									}

									chord = false;
								}
							);

							PHRASE_CLE_FA += phrase;
						}
					}
				}


				else // Mode VexFlow
				{
					// RECUPERATION DES NOTES ET DES PARAMS ASSOCIES
					if( Array.isArray( mesFromPart.note ) && mesFromVF === 'object' )
					{
						mesFromPart.note.forEach(
							function( n, i )
							{
								// if( mesFromPart._number == "13" )
								// {
									notes.push({
										numMes: parseInt( mesFromPart._number ),
										voix: 	n.voice ? n.voice : "",
										pos: 	n.pitch && n.pitch.octave ? parseInt( n.pitch.octave ) : "",
										figure: n.type ? n.type : "",
										ton: 	n.pitch && n.pitch.step ? n.pitch.step : "",
										hampe: 	n.stem ? n.stem : "",
										paroles: [],
										offsetX: parseInt( n[ "_default-x" ] )
									});

									if( n.lyric )
									{
										for( j = 0; j < n.lyric.length; j++)
										{
											if( n.lyric[ j ].text != "" )
												notes[ i ].paroles.push( n.lyric[ j ].text );
										}
									}

									// Si une note n'a pas de tonalité exprimée dans le musicxml, on la supprime
									if( notes[ notes.length-1 ].ton == "" )
									{
										notes.pop();
									}

									// console.log( "Notes récupérées :" )
									// console.log( notes )

								// }
							}
						);
					}
					else
					{
						// if( mesFromPart._number == "2" )
						// {
							var n = mesFromPart.note;

							notes.push({
								numMes: parseInt( mesFromPart._number ),
								voix: 	n.voice ? n.voice : "",
								pos: 	n.pitch && n.pitch.octave ? parseInt( n.pitch.octave ) : "",
								figure: n.type ? n.type : "",
								ton: 	n.pitch && n.pitch.step ? n.pitch.step : "",
								hampe: 	n.stem ? n.stem : "",
								paroles: [],
								offsetX: parseInt( n[ "_default-x" ] )
							});

							if( n.lyric )
							{
								for( j = 0; j < n.lyric.length; j++)
								{
									if( n.lyric[ j ].text != "" )
										notes[ i ].paroles.push( n.lyric[ j ].text );
								}
							}

							if( notes[ notes.length-1 ].ton == "" )
							{
								notes.pop();
							}

							// console.log( "Note récupérée :" )
							// console.log( notes )
						// }
					}


					// On vérifie que l'odre des notes est bon
					// (offsetX : du plus petit au plus grand)
					// notes.forEach(
					// 	function( n )
					// 	{
					// 		console.log( n )
					// 	}
					// );


					// AFFECTATION DES VOIX
					// Chaque voix possède son groupe de notes

					var longestTabIndex = 0;

					notes.forEach(
						function( n, i )
						{
							parserNote( n );
							longestTabIndex = chargerVoix( mesFromPart, n, i, phrases, longestTabIndex );
						}
					);

					// LOG
					// if( mesFromPart._number == "1" )
					// {
					// 	console.log( phrases.soprano );
					// 	console.log( phrases.alto );
					// 	console.log( phrases.tenor );
					// 	console.log( phrases.basse );
					// 	console.log( phrases.sansVoix );
					// 	console.log( "\n" );
					// }

					// PARCOURS DES VOIX
					for( var p in phrases )
					{
						var
							phraseSoprano = [],
							phraseAlto = [],
							phraseTenor = [],
							phraseBasse = []
						;

						switch( p )
						{
							case "soprano":
								agencementNotes( phrases.soprano, phrases.sansVoix, phraseSoprano );
								THIS.creerMelodieMesure(
									mesFromPart._number,
									mesFromVF,
									notes,
									clefIsSol,
									THIS.chiffrage,
									phraseSoprano
								);
								break;
							case "alto":
								agencementNotes( phrases.alto, phrases.sansVoix, phraseAlto );
								THIS.creerMelodieMesure(
									mesFromPart._number,
									mesFromVF,
									notes,
									clefIsSol,
									THIS.chiffrage,
									phraseAlto
								);
								break;
							case "tenor":
								agencementNotes( phrases.tenor, phrases.sansVoix, phraseTenor );
								THIS.creerMelodieMesure(
									mesFromPart._number,
									mesFromVF,
									notes,
									clefIsSol,
									THIS.chiffrage,
									phraseTenor
								);
								break;
							case "basse": // Attention : générer portée du dessous !!!
								agencementNotes( phrases.basse, phrases.sansVoix, phraseBasse );
								THIS.creerMelodieMesure(
									mesFromPart._number,
									mesFromVF,
									notes,
									clefIsSol,
									THIS.chiffrage,
									phraseBasse
								);
								break;

							case "sansVoix":
								break;
						}	
				}

			// CREATION DE LA MELODIE DE LA MESURE

			// THIS.creerMelodieMesure(
			// 	mesure,
			// 	"2/2",
			// 	THIS.voix.BASSE,
				// [
				// 	[
				// 		[ THIS.note.LA, THIS.figure.NOIRE, 3 ],
				// 		[ THIS.note.DO , THIS.figure.NOIRE, 4 ],
				// 		[ THIS.note.FA , THIS.figure.NOIRE, 4 ]
				// 	],
				// 	[[ THIS.note.DO , THIS.figure.NOIRE, 4 ]],
				// 	[[ THIS.note.RE, THIS.figure.BLANCHE, 5 ]]
				// ]
			// );

				}
			}

			function parserNote( note )
			{
				if( note )
				{
					switch( note.figure )
					{
						// case "whole":
						// 	note.figure = THIS.figure.RONDE;
						// 	break;
						case "half":
							note.figure = THIS.figure.BLANCHE;
							break;
						case "quarter":
							note.figure = THIS.figure.NOIRE;
							break;
						case "eighth":
							note.figure = THIS.figure.CROCHE;
							break;
						// case "sixteenth":
						// 	note.figure = THIS.figure.DOUBLE_CROCHE;
						// 	break;
					}

					switch( note.ton )
					{
						case "C":
							note.ton = THIS.note.DO;
							break;							
						case "D":
							note.ton = THIS.note.RE;
							break;	
						case "E":
							note.ton = THIS.note.MI;
							break;	
						case "F":
							note.ton = THIS.note.FA;
							break;	
						case "G":
							note.ton = THIS.note.SOL;
							break;	
						case "A":
							note.ton = THIS.note.LA;
							break;	
						case "B":
							note.ton = THIS.note.SI;
							break;

						// Notes pointées
						// case "C":
						// 	note.ton = THIS.note.DO_POINTEE;
						// 	break;							
						// case "D":
						// 	note.ton = THIS.note.RE_POINTEE;
						// 	break;	
						// case "E":
						// 	note.ton = THIS.note.MI_POINTEE;
						// 	break;	
						// case "F":
						// 	note.ton = THIS.note.FA_POINTEE;
						// 	break;	
						// case "G":
						// 	note.ton = THIS.note.SOL_POINTEE;
						// 	break;	
						// case "A":
						// 	note.ton = THIS.note.LA_POINTEE;
						// 	break;	
						// case "B":
						// 	note.ton = THIS.note.SI_POINTEE;
						// 	break;
					}
				}
			}

			function chargerVoix( mesure, note, index, phrases, longestTabIndex )
			{
				// Si la note courante a le même offset que la précédente
				// (et appartient à une voix différente), il faut les aligner verticalement...
				if( index > 0 && mesure.note[ index-1 ][ "_default-x" ] == note.offsetX )
				{
					if( longestTabIndex > 0 )
					{
						switch( note.voix )
						{
							// case "" :
							// 	phrases.soprano[ longestTabIndex-1 ] = note;
							// 	break;
							case "2" :
								phrases.alto[ longestTabIndex-1 ] = note;
								break;
							case "1" :
								phrases.tenor[ longestTabIndex-1 ] = note;
								break;
							// case "" :
							// 	phrases.basse[ longestTabIndex-1 ] = note;
							// 	break;
							default:
								phrases.sansVoix[ longestTabIndex-1 ] = note;
						}
					}
					else
					{
						switch( note.voix )
						{
							// case "" :
							// 	phrases.soprano[ 0 ] = note;
							// 	break;
							case "2" :
								phrases.alto[ 0 ] = note;
								break;
							case "1" :
								phrases.tenor[ 0 ] = note;
								break;
							// case "" :
							// 	phrases.basse[ 0 ] = note;
							// 	break;
							default:
								phrases.sansVoix[ 0 ] = note;
						}
					}			
				}
				else
				{
					switch( note.voix )
					{
						// case "" :
						// 	phrases.soprano.push( note );
						// 	break;
						case "2" :
							phrases.alto.push( note );
							break;
						case "1" :
							phrases.tenor.push( note );
							break;
						// case "" :
						// 	phrases.basse.push( note );
						// 	break;
						default:
							phrases.sansVoix.push( note );
					}

					// Récupération index voix la plus longue...
					for( var j in phrases )
					{
						if( longestTabIndex < phrases[ j ].length )
							longestTabIndex = phrases[ j ].length;
					}

					// ... pour que toutes les voix gardent toujours la même taille
					// ( => répatition uniforme des notes)
					for( var j in phrases )
					{
						if( phrases[ j ].length < longestTabIndex )
							phrases[ j ].push( null );
					}
				}

				return longestTabIndex;
			}

			function agencementNotes( notesVoix, notesSansVoix, phrase )
			{
				notesVoix.forEach(
					function( n, i )
					{
						if( n )
						{
							if( notesSansVoix[ i ] && notesSansVoix[ i ].offsetX == n.offsetX )
							{
								var noteBefore = {}, noteAfter = {};

								// tri des notes pour l'implémentation VF

								// ordre ascendant géré sans erreur par VF (exemple) :
								// note pos
								// FA 3
								// DO 4
								// RE 4
								// DO 5
								if( notesSansVoix[ i ].pos > n.pos )
								{
									noteBefore = {
										ton: 	n.ton,
										figure: n.figure,
										pos: 	n.pos,
										hampe: 	n.hampe
									};
									noteAfter = {
										ton: 	notesSansVoix[ i ].ton,
										figure: notesSansVoix[ i ].figure,
										pos: 	notesSansVoix[ i ].pos,
										hampe: 	notesSansVoix[ i ].hampe
									};
								}
								else if( notesSansVoix[ i ].pos == n.pos )
								{
									var
										ascendance = [ "c", "d", "e", "f", "g", "a", "b" ],
										cpt1 = -1,
										cpt2 = -1
									;

									// Boucle x7 : notes gamme de do
									for( var j = 0; j < 7; j++ )
									{
										if( n.ton == ascendance[ j ] ) cpt1 = j;
										if( notesSansVoix[ i ].ton == ascendance[ j ] ) cpt2 = j;
									}

									if( cpt1 > -1 && cpt2 > -1 )
									{
										if( cpt1 > cpt2 )
										{
											noteBefore = {
												ton: 	notesSansVoix[ i ].ton,
												figure: notesSansVoix[ i ].figure,
												pos: 	notesSansVoix[ i ].pos,
												hampe: 	notesSansVoix[ i ].hampe
											};
											noteAfter = {
												ton: 	n.ton,
												figure: n.figure,
												pos: 	n.pos,
												hampe: 	n.hampe
											};
										}
										else
										{
											noteBefore = {
												ton: 	n.ton,
												figure: n.figure,
												pos: 	n.pos,
												hampe: 	n.hampe
											};
											noteAfter = {
												ton: 	notesSansVoix[ i ].ton,
												figure: notesSansVoix[ i ].figure,
												pos: 	notesSansVoix[ i ].pos,
												hampe: 	notesSansVoix[ i ].hampe
											};
										}
									}
								}
								else
								{
									noteBefore = {
										ton: 	notesSansVoix[ i ].ton,
										figure: notesSansVoix[ i ].figure,
										pos: 	notesSansVoix[ i ].pos,
										hampe: 	notesSansVoix[ i ].hampe
									};

									noteAfter = {
										ton: 	n.ton,
										figure: n.figure,
										pos: 	n.pos,
										hampe: 	n.hampe
									};
								}


								// Intervalle (pas un accord !)
								// --> prévoir en plus le cas d'un accord !
								phrase.push([
									[ noteBefore.ton, noteBefore.figure, noteBefore.pos, noteBefore.hampe ],
									[ noteAfter.ton, noteAfter.figure, noteAfter.pos, noteAfter.hampe ]
								]);
							}
							else
							{
								phrase.push([
									[ n.ton, n.figure, n.pos, n.hampe ]
								]);
							}
							// console.log( "Phrase générée :" )
							// console.log( phrase )
						}
					}
				);
			}


			THIS = null;
			width = null;
			tabWidth = null;
			clef = null;
			chiffrage = null;
			armature = null;
			mode = null;
			melodie = null;
		},

		checkDuration: function( num, denom, p )
		{
			var
				duree = 0,
				THIS = this,

				cptMes = cptMes ? cptMes : 0,
				cptNote = cptNote ? cptNote : 0,

				div = 0
			;

			if( Array.isArray( p ) ) // p = tableau mélodie contenant les notes/obj VF
			{
				p.forEach(
					function( n, i )
					{
						duree += THIS.checkDuration( num, denom, n.duration );

						// A la fin du parcours des notes
						// il faut vérifier que la durée totale coïncide avec le chiffrage
						if( i == p.length-1 && duree <  num )
						{
							for( var j = 0; j < p.length; j++ )
							{
								switch( p[ j ].duration )
								{
									// case THIS.figure.RONDE:
									// 	var nbn = p[ j ].note_heads.length;
									// 	while( nbn-- > 0 ) p[ j ].addDot( nbn );
									// 	break;
									// case THIS.figure.BLANCHE:
									// 	var nbn = p[ j ].note_heads.length;
									// 	while( nbn-- > 0 ) p[ j ].addDot( nbn );
									// 	break;
									case THIS.figure.NOIRE:
										if( denom == "8" )
										{
											// console.log( "TEST" )
											// console.log( p[j])
											var nbn = p[ j ].note_heads.length;
											while( nbn-- > 0 ) p[ j ].addDot( nbn );
										}
										break;
									// case THIS.figure.CROCHE:
									// 	var nbn = p[ j ].note_heads.length;
									// 	while( nbn-- > 0 ) p[ j ].addDot( nbn );
									// 	break;
									// case THIS.figure.DOUBLE_CROCHE:
									// 	var nbn = p[ j ].note_heads.length;
									// 	while( nbn-- > 0 ) p[ j ].addDot( nbn );
									// 	break;
									// case THIS.figure.TRIPLE_CROCHE:
									// 	var nbn = p[ j ].note_heads.length;
									// 	while( nbn-- > 0 ) p[ j ].addDot( nbn );
									// 	break;
									// case THIS.figure.QUADRUPLE_CROCHE:
									// 	var nbn = p[ j ].note_heads.length;
									// 	while( nbn-- > 0 ) p[ j ].addDot( nbn );
									// 	break;
								}
							}
						}
						else if( duree == denom )
						{
							return;
						}
					}
				);	
			}
			else // Sinon p = figure de note
			{
				switch( p )
				{
					case this.figure.RONDE:
						div = 1;
						break;
					case this.figure.BLANCHE:
						div = 2;
						break;
					case this.figure.NOIRE:
						div = 4;
						break;
					case this.figure.CROCHE:
						div = 8;
						break;
					case this.figure.DOUBLE_CROCHE:
						div = 16;
						break;
					case this.figure.TRIPLE_CROCHE:
						div = 32;
						break;
					case this.figure.QUADRUPLE_CROCHE:
						div = 64;
						break;
				}
			}

			return denom / div;
		},


		calculOffsetX: function( cptMesure )
		{
			var mesureWidth = 0, cptMes = 0;

			for( var i = 0; i < cptMesure; i ++)
			{
				if( i%2 == 0 )
				{
					// width mesure précédente = offsetX mesure courante
					mesureWidth = this.partition.systeme.portee1[ cptMes ]._width;

					if( this.mesStaticPart[ i ].firstOnNewSystem )
						this.offsetX = this.leftMargin;

					this.offsetX += parseInt( mesureWidth );

					cptMes++;
				}
			}

			mesureWidth = null;
		},

		// notes == tab d'objet contenant les params de chaque note
		// notesParams = tab contenant des tableaux de notes agencées spécifiquement pour la création VF
		creerMelodieMesure: function( numMes, mesureVF, notes, clefIsSol, chiffrage, notesParams )
		{
			var
				melodie = [],
				clef = clefIsSol ? this.CLE_SOL : this.CLE_FA
			;

			for( var i = 0; i < notesParams.length; i++ )
			{
				// SI LE PARAM COURANT N'EST PAS UN OBJET, ON PEUT CONSTRUIRE LA MELODIE
				if( Array.isArray( notesParams[i] ) )
				{
					melodie.push(
						this.creerNote({
							tabNotes: notes,
							numMes: numMes,
							measureType: clef,
							notesParams: notesParams[i]
						})
					);
				}
			}

			//
			var tab = chiffrage.split( "/" );
			var num = parseInt( tab[0] );
			var denom = parseInt( tab[1] );

			this.voices.push(
				new this.VF.Voice( { num_beats: num, beat_value: denom } ).addTickables( melodie )
			);

			// Vérification : total des durées = denom
			this.checkDuration( num, denom, melodie );

			this.VF.Formatter.FormatAndDraw( this.ctx, mesureVF, melodie );
			this.mesMelodie.push( [ this.ctx, mesureVF, melodie ] );
		},

		creerNote: function( params )
		{
			var
				measureType = this.CLE_SOL, // Valeur par défaut
				notes = [ "g/4" ],
				figure = "q",
				hampe = 1, // Hampe vers le haut par défaut
				positionsDot = [], // repère à quelle position (num note dans la mesure) il faut affecter un point
				hasDot = false,
				cpt = 0,
				THIS = this
			;

			if( params )
			{
				if( params.measureType  )  	measureType = params.measureType;

				if( params.notesParams )
				{
					figure = params.notesParams[0][1];
					stem = params.notesParams[0][3] != "" ? params.notesParams[0][3] : 0;

					switch( stem )
					{
						case "down": stem = -1; break;
						case "up": stem = 1; break;
						default: stem = 0;
					}
				}
			}

			if( params.notesParams  )
			{
				notes = [];

				// GENERATION DE CHAQUE NOTE AU FORMAT VEXFLOW
				params.notesParams.forEach(
					function( n )
					{
						if( n[0][0] && n[0][0].indexOf( "." ) > -1 )
						{
							var n = n[0][0];
							var tab = n.split(".");
							n[0] = tab[0];
							positionsDot.push( cpt++ );
							hasDot = true;
						}
						else
							cpt++;

						notes.push( THIS.genererNote( n ) );
					}
				);
			}

			var note = new this.VF.StaveNote({
				clef: measureType,
				keys: notes,
				duration: figure,
				stem_direction: stem
				// playNote: true
			});

			if( positionsDot.length > 0 && hasDot )
			{
				positionsDot.forEach(
					function( p )
					{
						note.addDot( parseInt(p) );
					}
				);
			}


			// Stockage des notes une à une
			// avec leur voix, leur clef et leur numéro de mesure
			var mesFound = false, index = -1;

			for( var i = 0; i < this.mesVF.length; i++ )
			{				
				if(this.mesVF[ i ].numMes == params.numMes )
				{
					index = i;
					mesFound = true;
					break;
				}
			}

			if( !mesFound )
			{
				this.mesVF.push({
					numMes: params.numMes,
					notes: { cleSol: [], cleFa: [] }
				});

				index = this.mesVF.length-1;
			}

			if( measureType == this.CLE_SOL )
				this.mesVF[ index ].notes.cleSol.push( note );
			else
				this.mesVF[ index ].notes.cleFa.push( note );

			return note;
		},

		genererNote: function( noteAndPosition )
		{
			return noteAndPosition[0] + "/" + noteAndPosition[2];
		},

		calculPercent: function( valueToPercent, p, total )
		{
			return valueToPercent ? p * ( 100 / total ) : ( p / 100 ) * total;
		},

		sizingMeasures: function( reload ) // Seule la première portée du système est annalisée pour ce calcul
		{
			var
				THIS = this,
				allMesPart = this.partition.systeme.portee1.length,
				allMesPart = this.NB_PORTEES_SYSTEME == 2 ? allMesPart*2 : allMesPart,
				mesXML = null,
				cptMes = 0,
				numSys = 0,
				mesWidth = [],
				indexMes = 0
			;

			this.offsetX = this.leftMargin = this.options.default.sidePadding;

			// Au premier démarrage, il faut stocker les paramètres d'origines
			// des mesures dans this.mesStaticPart
			if( this.firstStart )
			{
				/////////////////////////////////////////////////////////////////////
				// PARCOURS DE TOUTE LA PARTITION                                  //
				// pour connaître la taille totale et les tailles de chaque mesure //
				/////////////////////////////////////////////////////////////////////

				// Stockage des paramètres communs dans this.mesStaticPart
				for( var i = 0; i < allMesPart; i++)
				{
					// if( i < 34 )
					// {




					this.mesStaticPart.push({});

					if( this.NB_PORTEES_SYSTEME == 2 )
					{
						if( cptMes < allMesPart/2 && i%2 == 0 )
						{
							mesXML = this.partition.systeme.portee1[ cptMes ];
							this.mesStaticPart[ i ].num = ++cptMes;

							defineParams( mesXML, i );
						}
						else
						{
							this.mesStaticPart[ i ].num = cptMes;
						}
					}
					else
					{
						mesXML = this.partition.systeme.portee1[ i ];
					}

					// console.log( "Dimensions mesure :" )
					// console.log( this.mesStaticPart[i] )

					// }



				}

				this.firstStart = false;
				mesXML = null;
			}

			// Si trop de mesures pour la taille d'écran (défini forcément en mode responsif)
			// on recalcule la taille et l'offset des mesures
			// et leur nombre ne doit pas dépasser NB_MAX_MEASURES
			if( this.NB_MAX_MEASURES > 0 )
			{
				var cpt = 0, concatWidth = 0;
				this.offsetY = this.options.default.offsetY

				initMesDynPart();

				for( var i = 0; i < allMesPart; i++)
				{
					if( i%2 == 0 )
					{
						this.mesDynamicPart[ i ].firstOnNewSystem = false;
						this.mesDynamicPart[ i ].lastOnOldSystem = false;

						if( i == 0 || ( cpt == this.NB_MAX_MEASURES ) )
						{
							this.mesDynamicPart[ i ].firstOnNewSystem = true;

							if( i != 0 )
							{
								this.mesDynamicPart[ i-2 ].lastOnOldSystem = true;
								this.offsetY += this.partition.systeme.portee2 ? 250 : 120;

								// Affectation de la clef et de son équipement
								defineParams( this.mesDynamicPart[ i ] );
							}

							cpt = 0;
						}

						// Mise à jour de l'offsetY
						this.mesDynamicPart[ i ].offsetY = this.offsetY;

						// LARGEUR MESURE
						this.mesDynamicPart[ i ].width = ( window.innerWidth - (this.leftMargin*2)) / this.NB_MAX_MEASURES;

						// CALCUL DE L'OFFSETX
						if( this.mesDynamicPart[ i ].firstOnNewSystem )
						{
							this.mesDynamicPart[ i ].offsetX = this.leftMargin;
							concatWidth = 0;
						}
						else
						{
							concatWidth += this.mesDynamicPart[ i ].width;
							this.mesDynamicPart[ i ].offsetX = concatWidth + this.leftMargin;
						}

						cpt++;
					}
				}
			}
			else if( this.responsive && this.tag )
			{
				initMesDynPart();

				// Si la taille d'écran permet un redimensionnement en % des mesures  :
				// calcul des largeurs des mesures en fonction de la taille de l'écran
				// et mise à jour de l'offsetX de chaque mesure
				THIS.calculLargFromStaticPart();

				this.mesDynamicPart.forEach(
					function( m, i )
					{
						if( i%2 == 0 )
						{
							// Affectation de la clef et de son équipement
							defineParams( m );
						}
					}
				);
			}


			this.creerMesure( true, false );

			THIS = null;
			allMesPart = null;
			mesWidth = null;
			indexMes = null;


			// FONCTIONS
			function initMesDynPart()
			{
				THIS.mesDynamicPart = [];

				THIS.mesStaticPart.forEach(
					function( o, i )
					{
						THIS.mesDynamicPart.push({});

						for( var m in o )
						{
							THIS.mesDynamicPart[ i ][ m ] = o[ m ];
						}
					}
				);
			}

			function defineParams( mes, cpt )
			{
				if( cpt >= 0 )
				{
					// La mesure est-elle la première du système ?
					if( mes.print &&
										( mes.print[ "_new-system" ] == "yes"
											||
										mes.print[ "_new-page" ] == "yes" ) )
					{
						THIS.mesStaticPart[ cpt ].firstOnNewSystem = true;
						if( cpt != 0 )
						{
							THIS.offsetY += THIS.NB_PORTEES_SYSTEME == 2 ? 250 : 120;
							THIS.mesStaticPart[ cpt-2 ].lastOnOldSystem = true;
						} 
					}

					// Mise à jour de l'offsetY
					THIS.mesStaticPart[ cpt ].offsetY = THIS.offsetY;


					// La mesure a-telle une marge gauche spécifique ?
					// (début de système)
					if( mes.print )
					{
						if( mes.print[ "system-layout" ] )
						{
							if( mes.print[ "system-layout" ][ "system-margins" ] )
							{
								if( mes.print[ "system-layout" ][ "system-margins" ][ "left-margin" ] )
								{
									THIS.leftMargin = parseInt( mes.print[ "system-layout" ][ "system-margins" ][ "left-margin" ] );
									THIS.mesStaticPart[ cpt ].hasLeftMargin = true;
									THIS.mesStaticPart[ cpt ].offsetX = THIS.leftMargin;
								}
							}
						}
					}

					// SI LA MESURE A DES ATTRIBUTS (chiffrage, clef, armature)
					if( mes.attributes )
					{
						if( mes.attributes.time ) 
						{
							THIS.chiffrage = mes.attributes.time.beats + "/" + mes.attributes.time[ "beat-type" ];
							THIS.mesStaticPart[ cpt ].chiffrage = THIS.chiffrage;
						}
						if( mes.attributes.clef ) 
						{
							THIS.clef = mes.attributes.clef.sign == "G" ? THIS.CLE_SOL : THIS.CLE_FA;
							THIS.mesStaticPart[ cpt ].clef = THIS.clef;
						}
						if( mes.attributes.key ) 
						{
							if( mes.attributes.key.fifths ) 
							{
								THIS.armature = mes.attributes.key.fifths;
								THIS.mesStaticPart[ cpt ].armature = THIS.armature;
							}
							if( mes.attributes.key.mode ) 
							{
								THIS.mode = mes.attributes.key.mode;
							}
						}
					}

					// CALCUL DE L'OFFSETX
					if( !THIS.mesStaticPart[ cpt ].hasLeftMargin && !THIS.mesStaticPart[ cpt ].firstOnNewSystem )
					{
						if( cpt > 0 && mes._number != "1" )
						{
							THIS.calculOffsetX( cpt );
						}
					}


					// Mise à jour de l'offsetX
					if( !THIS.mesStaticPart[ cpt ].hasLeftMargin ) THIS.mesStaticPart[ cpt ].offsetX = THIS.offsetX;

					THIS.mesStaticPart[ cpt ].width = parseInt( mes._width );
				}
				else
				{
					mes.clef      = null;
					mes.chiffrage = null;
					mes.armature  = null;
					mes.mode      = null;

					if( mes.firstOnNewSystem )
					{
						numSys++;
						mes.clef      = THIS.clef;
						mes.chiffrage = THIS.chiffrage;
						mes.armature  = THIS.armature;
						mes.mode      = THIS.mode;
					}
				}
			}


		},

		calculLargFromStaticPart: function()
		{
			var
				THIS = this,

				screenSizeWithoutMargins = window.innerWidth - ( this.options.default.sidePadding * 2),
				partSize = parseInt( this.partition.infos.page.width ),
				partSizeWithoutMargins = 0,
				newWidthMargins = 0,

				mesure = null,
				totalSizeCurrentSystem = 0,
				allCurrentSysMesWidth = [],
				newSpecialMarginCurrentSys = 0,
				specialLeftMargin = 0,
				toAdd = 0, // récupère le padding de la partition
							// et le redistribue proportionnellement à chaque largeur de mesure

				p = 0 // Pour stocker les pourcentages
			;

			// LOG
			// 
			// console.log( "Taille écran - marges : " + screenSizeWithoutMargins );
			// console.log( "Taille partition : " + partSize );
			// 			console.log( "\n" );


			this.mesDynamicPart.forEach(
				function( m, i )
				{
					if( m.firstOnNewSystem )
					{
						if( m.hasLeftMargin )
						{
							specialLeftMargin = m.offsetX;
							p = THIS.calculPercent( true, specialLeftMargin, partSize );
							newSpecialMarginCurrentSys = THIS.calculPercent( false, p, screenSizeWithoutMargins );
						}

						var cpt = 0, totalSizeCurrentSystem = 0, allCurrentSysMesWidth = [];
						indexMes = ( m.num == 1 ) ? m.num-1 : m.num*2-2;


						for( var j = m.num-1; j < THIS.mesStaticPart.length; j++ )
						{
							if( j < THIS.partition.systeme.portee1.length )
							{
								allCurrentSysMesWidth.push( parseFloat( THIS.partition.systeme.portee1[ j ]._width ) );
								totalSizeCurrentSystem += allCurrentSysMesWidth[ cpt ];
								cpt++;

								if( THIS.mesStaticPart[ indexMes ].lastOnOldSystem )
									break;
							}

							indexMes += 2;
						}


						// Calcul de la taille à répartir en addition à chaque mesure du système
						// (définie par les marges blanches de chaque côté de la partition originale)
						toAdd = ( newSpecialMarginCurrentSys != 0 ) ? newSpecialMarginCurrentSys / allCurrentSysMesWidth.length : 0;		

						partSizeWithoutMargins = partSize - totalSizeCurrentSystem - specialLeftMargin;
						partSizeWithoutMargins = Math.abs( partSizeWithoutMargins );

						p =	THIS.calculPercent( true, partSizeWithoutMargins, partSize );
						
						newWidthMargins = THIS.calculPercent( false, p, screenSizeWithoutMargins );
						
						toAdd += newWidthMargins / allCurrentSysMesWidth.length;


						// LOG
						// 
						// console.log( "Taille des marges de la partition : " + specialLeftMargin );
						// console.log( "\tNouvelle taille des marges : " + newWidthMargins );
						// console.log( "\n" );
						// console.log( "Taille système courant : " + totalSizeCurrentSystem );
						// console.log( "Marge système courant : " + specialLeftMargin );
						// console.log( "Nouvelle marge : " + newSpecialMarginCurrentSys );
						// console.log( "\n" );
						// console.log( "Taille des marges à répartir : " + toAdd );
						// console.log( "Taille de chaque mesure du système courant : " );
						// if( i == 0 ) console.log( "\t" + allCurrentSysMesWidth );


						if( i != 0 ) THIS.offsetY += THIS.partition.systeme.portee2 ? 250 : 120;
						else THIS.offsetY = THIS.options.default.offsetY;

						concatWidth = 0;
						indexMes = ( m.num == 1 ) ? m.num-1 : m.num*2-2;

						for( var j = 0; j < allCurrentSysMesWidth.length; j++ )
						{
							// pourcentage de la mesure dans la partition originale
							p = THIS.calculPercent( true, allCurrentSysMesWidth[ j ], parseFloat( THIS.partition.infos.page.width ) );
							// console.log( "\tPourcentage mes " + (j+1) + " : " + p );

							// Mise à jour de la taille de la mesure et stockage
							THIS.mesDynamicPart[ indexMes ].width = THIS.calculPercent( false, p , screenSizeWithoutMargins ) + toAdd;
							// console.log( "\t\tNouvelle taille mes " + (j+1) + " : " + THIS.mesDynamicPart[ indexMes ].width );

							// Concaténation de la largeur de la mesure courante
							// pour pouvoir mettre à jour correctement l'offsetX de chacune

							// Mise à jour de l'offsetX
							if( j == 0 )
								THIS.mesDynamicPart[ indexMes ].offsetX = THIS.options.default.sidePadding;
							else
								THIS.mesDynamicPart[ indexMes ].offsetX = concatWidth + THIS.options.default.sidePadding;
							// console.log( "\t\toffsetX mes " + (j+1) + " : " + THIS.mesDynamicPart[ indexMes ].offsetX );

							// Mise à jour de l'offsetY
							THIS.mesDynamicPart[ indexMes ].offsetY = THIS.offsetY;

							concatWidth += THIS.mesDynamicPart[ indexMes ].width;
							indexMes += 2;
						}

						totalSizeCurrentSystem = 0;
						specialLeftMargin = 0;
						newSpecialMarginCurrentSys = 0;
						allCurrentSysMesWidth = [];
						totalSizeCurrentSystem = 0;
					}
				}
			);

			// console.log(THIS.mesStaticPart)


			screenSizeWithoutMargins = null;
			partSize = null;
			partSizeWithoutMargins = null;
			newWidthMargins = null;
			mesure = null;
			totalSizeCurrentSystem = null;
			allCurrentSysMesWidth = null,
			newSpecialMarginCurrentSys = null;
			specialLeftMargin = null;
			toAdd = null;
			p = null;
			cpt = null;

			return allCurrentSysMesWidth;
		}
	};



// FACTORY POUR ANGULARJS

function dwapsBuilderPart()
{
	return function( tag, stringPart )
	{
		return new DWAPS_BUILDER_PART( tag, stringPart );
	}
}