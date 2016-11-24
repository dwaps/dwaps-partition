// require( "vexflow" );
// require( "angular" );
// require( "x2js" );



// ATTENTION : il faudra penser à charger la taille du canvas en fonction de l'écran
// par défaut il est à la taille de la partition



// PARAMETRES OPTIONNELS

	var options = {

		use:
		{
			angular: true
		},

		canvas: {
			width: window.innerWidth,
			height: window.innerHeight
		},

		font: {
			family: "Arial",
			size: 10,
			weight: 300
		},

		bgColor: "#eed",

		default: {
			measureWidth: 500,
			sidePadding: 10,
			offsetY: 40,
			time: "4/4",
			responsive: true
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




	var DWAPS_BUILDER_PART = function( tag, stringPart )
	{
		// INITIALISATION

		var
			// d = new DOMParser(),
			// DOMpart = d.parseFromString( stringPart, "text/xml" ),

			x2js = new X2JS(),
			JSONpart = x2js.xml_str2json( stringPart )
		;

		this.initPart( JSONpart[ "score-partwise" ] );

		this.start( tag, options );
	};


	DWAPS_BUILDER_PART.prototype = {
		initObject: function( options )
		{
			this.VF = Vex.Flow;
			this.options = options;

			// this.options.help.clefs( VF );
			// this.options.help.notes( VF );
			// this.options.help.accidentals( VF );
			// this.options.help.keys( VF );
			// this.options.help.duration( VF );
			// this.options.help.articulations( VF );
			// this.options.help.ornaments( VF );

			// Gestion responsive			
			this.responsive = this.options.default.responsive;
			this.NB_MAX_MEASURES = 2;
			this.systemOk = true; // Vérifie si le système a son nb de mesures adapté à la taille d'écran

			// TAILLE D'AFFICHAGE
			this.widthViewer = this.responsive ? window.innerWidth : this.partition.infos.page.width;
			this.heightViewer = this.responsive ? window.innerHeight : this.partition.infos.page.height;

			// DECALAGE DE PUIS LE HAUT DE CHAQUE SYSTEME PAR RAPPORT A SON PRECEDENT
			// Au départ, la valeur par défaut
			this.offsetX = this.options.default.sidePadding;
			this.offsetY = this.options.default.offsetY;

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

			// MESURE
			this.measures = [];
			this.SIZES_SYSTEM_AUTO = true; // Active / Désactive la gestion automatique des sytèmes
			this.largTotaleMes = 0; // Valeur en pourcentage : si la largTotaleMes > 100 % il faut passer à un autre système
			this.indexFirstMeasureSystem = 0;
			this.mesWidth = []; // Tableau pour stocker toutes les largeurs des mesures de la portée courante
			this.leftMargin = this.options.default.sidePadding; // Le système courant de la mesure a-t-il une marge de départ à respecter

			// CLEFS
			this.CLE_SOL = "treble";
			this.CLE_FA = "bass";
			this.clef = this.CLE_SOL; // Valeur par défaut

			// CHIFFRAGE
			this.chiffrage = this.options.default.time;

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
				ACTIVE: ""
			};
			this.voices = [];

			this.noteTest = [ "c/4" ];

			return this;
		},

		initCanvas: function( tag )
		{
			this.tag = tag;

			var renderer = this.renderer = new this.VF.Renderer( tag, this.VF.Renderer.Backends.SVG );
				renderer.resize( this.widthViewer, this.heightViewer  );

			var ctx = this.ctx = renderer.getContext();
				ctx
					.setFont(
						options.font.family,
						options.font.size,
						options.font.weight
					)
					.setBackgroundFillStyle( options.bgColor )
				;
		},

		start: function( tag, options )
		{
			if( options.default.responsive )
			{
				this.reload( tag, options );
			}
			else
			{
				this.initObject( options );
				this.initCanvas( tag );
				this.buildPart();
			}
		},

		setOptions: function( options )
		{
			this.options = options;
			// this.reload();
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
					portee2: JSONpart.part[1] ? getMeasureFromJSONpart( 2 ) : false
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

		reload: function( tag, options )
		{
			if(
				this.responsive
				||
				( this.options && this.options.default.responsive )
				||
				( options && options.default.responsive ) )
			{
				console.log( "reloading..." );

				var wWindow = window.innerWidth;


				// Si tag est défini alors this.tag n'existe pas encore
				// car l'objet n'a pas encore été initialisé
				if( tag && options )
				{
					this.initObject( options );
					this.initCanvas( tag );
				}
				else
				{
					this.initObject( this.options );
					this.tag.innerHTML = "";
					this.initCanvas( this.tag );
				}

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

					this.systemOk = false;
				}
				else
				{
					this.systemOk = true;
				}

				this.buildPart();
			}
			else
			{
				if( tag && options ) this.start( tag, options );
			}

		},

		buildPart: function()
		{
			var THIS = this;
			// var ctx = this.renderer.ctx;

			
			// if( !this.responsive )
			// {
			// 	var cptMesure = 0;
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );

			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );

			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
				
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );

			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	this.creerMesure( this.partition.systeme.portee1[ cptMesure ], cptMesure++ );
			// 	// this.creerMesure( { mesJSON: this.partition.systeme.portee1[ cptMesure ] }, cptMesure++ );
			// 	cptMesure = null;
			// }
			// else
			// {
				this.dynamicSizingMeasure();
			// }

			// var mesure2 = this.creerMesure({
			// 	offsetX: mesure.offsetX + mesure.width,
			// 	offsetY: mesure.offsetY,
			// 	width: this.partition.systeme.portee1[0]._width
			// });

			// this.creerMelodieMesure(
			// 	mesure2,
			// 	"4/4",
			// 	this.voix.TENOR,
			// 	[
			// 		[[ this.note.MI , this.figure.BLANCHE, 5 ]],
			// 		[[ this.note.SI , this.figure.NOIRE, 3 ]],
			// 		[[ this.note.RE , this.figure.NOIRE, 4 ]]
			// 	]
			// );
		},

		creerMesure: function( mesJSON, cptMesure )
		{
			var
				THIS = this,
				width = this.options.default.measureWidth,
				tabWidth = [],
				clef = null,
				chiffrage = null,
				armature = null,
				mode = null,
				melodie = []
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
						this.calculOffsetX( cptMesure );
					else
						this.calculOffsetX( cptMesure );
				}

				mes.offsetX = this.offsetX;
				mes.offsetY = this.offsetY;

				this.creerMesure( mes );
				return;
			}


			else // Deuxième appel (récursion) : on peut désormais affecter la mélodie
			{
				if( parseInt( mesJSON.offsetX )  )  offsetX = mesJSON.offsetX;
				if( parseInt( mesJSON.offsetY )  )  offsetY = mesJSON.offsetY;
				if( parseInt( mesJSON.width ) )     width = mesJSON.width;

				if( mesJSON.clef  )  				clef = this.clef;
				if( mesJSON.chiffrage  )  			chiffrage = this.chiffrage;
				// if( mesJSON.armature  )  			armature = this.armature;


				// SI GESTION AUTOMATIQUE DE LA LARGEUR DES MESURES
				if( this.measures.length > 0 ) // Cela signifie qu'on est pas en création manuelle
				{
					this.measures.forEach(
						function( m, i )
						{
							mesure = new THIS.VF.Stave( m.offsetX, m.offsetY, m.width );

							if( m.firstOnNewSystem )
							{
								// ARMATURE
								var armature = chargerArmature( THIS.armature, THIS );
								if( armature ) mesure.addKeySignature( armature );
								else mesure.addKeySignature( THIS.armature );

								if( m.clef ) mesure.addClef( m.clef );
								else mesure.addClef( THIS.clef );

								if( m.chiffrage ) mesure.addTimeSignature( m.chiffrage );
								else mesure.addTimeSignature( THIS.chiffrage );

								// if( THIS.mode ) mesure.addKeySignature( THIS.mode );
							}

							mesure
								.setContext( THIS.ctx )
								.draw()
							;

							genererPhrases(
								THIS,
								mesure,
								THIS.partition.systeme.portee1[ i ]
							);
						}
					);
				}
				else
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


				// FONCTION DE GENERATION DES PHRASES MELODIQUES
				function genererPhrases( THIS, mesFromVF, mesFromPart )
				{
					var
						notes = [],
						phrases = {
							soprano: [],
							alto: [],
							tenor: [],
							basse: [],
							sansVoix: []
						}
					;

					// RECUPERATION DES NOTES ET DES PARAMS ASSOCIES
					mesFromPart.note.forEach(
						function( n, i )
						{
						// 	if( mesFromPart._number == "1" )
						// 	{
								notes.push({
									voix: 	n.voice ? n.voice : "",
									pos: 	n.pitch.octave ? n.pitch.octave : "",
									figure: n.type ? n.type : "",
									ton: 	n.pitch.step ? n.pitch.step : "",
									hampe: 	n.stem ? n.stem : "",
									paroles: []
								});

								if( n.lyric )
								{
									for( j = 0; j < n.lyric.length; j++)
									{
										if( n.lyric[ j ].text != "" )
											notes[ i ].paroles.push( n.lyric[ j ].text );
									}
								}
							// }
						}
					);

					// AFFECTATION DES VOIX
					// Chaque voix possède son groupe de notes
					notes.forEach(
						function( n, i )
						{
							parserNote( n );

							switch( n.voix )
							{
								// case "" :
								// 	phrases.soprano.push( n );
								// 	break;
								case "2" :
									phrases.alto.push( n );
									break;
								case "1" :
									phrases.tenor.push( n );
									break;
								// case "" :
								// 	phrases.basse.push( n );
								// 	break;
								default:
									phrases.sansVoix.push( n );
									break;
							}

							for( var j in phrases )
							{
								if( phrases[ j ].length < (i+1) )
									phrases[ j ].push(null);
							}
						}
					);

					if( mesFromPart._number == "1" )
					{
						console.log( phrases.soprano );
						console.log( phrases.alto );
						console.log( phrases.tenor );
						console.log( phrases.basse );
						console.log( "\n" );
					}

					// PARCOURS DES VOIX
					for( var p in phrases )
					{						
						if( phrases.tenor.length > 0 )
						{
							var phrase = []; // Attention, cette phrase ne peut pas contenir d'accord pour le moment (il faudra coder ça !)

							phrases.tenor.forEach(
								function( n )
								{
									if( n )
									{				
										phrase.push([
											[ n.ton, n.figure, parseInt( n.pos ) ]
										]);
									}
								}
							);

							switch( p )
							{
								case "tenor":
									THIS.creerMelodieMesure(
										mesFromVF,
										THIS.chiffrage,
										THIS.voix.TENOR,
										phrase
									);
									break;
							}
						}
					}
				}


					// CREATION DE LA MELODIE DE LA MESURE

					// THIS.creerMelodieMesure(
					// 	mesure,
					// 	"2/2",
					// 	THIS.voix.BASSE,
					// 	[
					// 		[
					// 			[ THIS.note.LA, THIS.figure.NOIRE, 3 ],
					// 			[ THIS.note.DO , THIS.figure.NOIRE, 4 ],
					// 			[ THIS.note.FA , THIS.figure.NOIRE, 4 ]
					// 		],
					// 		[[ THIS.note.DO , THIS.figure.NOIRE, 4 ]],
					// 		[[ THIS.note.RE, THIS.figure.BLANCHE, 5 ]]
					// 	]
					// );


				function parserNote( note )
				{
					if( note )
					{
						switch( note.figure )
						{
							// ATTENTION: ici, la figure ne tient pas encore compte du chiffrage !!!
							case "half":
								note.figure = THIS.figure.BLANCHE;
								break;
							case "quarter":
								note.figure = THIS.figure.NOIRE;
								break;
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

			}


			// FONCTIONS

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


			THIS = null;
			width = null;
			tabWidth = null;
			clef = null;
			chiffrage = null;
			armature = null;
			mode = null;
			melodie = null;
		},


		calculOffsetX: function( cptMesure )
		{
			var mesureWidth = 0;

			for( var i = 0; i < cptMesure; i ++)
			{
				// width mesure précédente = offsetX mesure courante
				mesureWidth = this.partition.systeme.portee1[ i ]._width;

				if( this.measures[ i ].firstOnNewSystem )
					this.offsetX = this.leftMargin;

				this.offsetX += parseInt( mesureWidth );
			}

			mesureWidth = null;
		},

		creerMelodieMesure: function( mesureVF, chiffrage, voice, notesAndPositions )
		{
			var melodie = [];
			this.voix.ACTIVE = voice ? voice : this.voix.ACTIVE;

			for( var i = 0; i < notesAndPositions.length; i++ )
			{
				// SI LE PARAM COURANT N'EST PAS UN OBJET, ON PEUT CONSTRUIRE LA MELODIE
				if( Array.isArray( notesAndPositions[i] ) )
				{
					switch( this.voix.ACTIVE )
					{
						case this.voix.BASSE :
							melodie.push(
								this.creerNote({				
									measureType: this.CLE_SOL,
									notes: notesAndPositions[i],
									figure: notesAndPositions[i][0][1]
								})
							);
							break;
						case this.voix.TENOR :
							melodie.push(
								this.creerNote({				
									measureType: this.CLE_SOL,
									notes: notesAndPositions[i],
									figure: notesAndPositions[i][0][1]
								})
							);
							break;
						case this.voix.ALTO :
							break;
						case this.voix.SOPRANO :
							break;
					}
				}
			}

			var tab = chiffrage.split( "/" );
			var num = parseInt( tab[0] );
			var denom = parseInt( tab[1] );

			this.voices.push(
				new this.VF.Voice( { num_beats: num, beat_value: denom } ).addTickables( melodie )
			);

			this.VF.Formatter.FormatAndDraw( this.ctx, mesureVF, melodie );
		},

		creerNote: function( params )
		{
			var
				measureType = this.CLE_SOL,
				notes = [ "g/4" ],
				figure = "q",
				positionsDot = [],
				hasDot = false,
				cpt = 0,
				THIS = this
			;

			if( params )
			{
				if( params.measureType  )  	measureType = params.measureType;
				if( params.figure )			figure = params.figure;
			}


			if( params.notes  )
			{
				notes = [];

				// GENERATION DE CHAQUE NOTE AU FORMAT VEXFLOW
				params.notes.forEach(
					function( n )
					{
						// Vérification avant génération de note
						switch( n[0] )
						{
							case THIS.note.DO_POINTEE:
								n = THIS.splitPoint( n );
								positionsDot.push( cpt++ );
								hasDot = true;
								break;
							case THIS.note.RE_POINTEE:
								n = THIS.splitPoint( n );
								positionsDot.push( cpt++ );
								hasDot = true;
								break;
							case THIS.note.MI_POINTEE:
								n = THIS.splitPoint( n );
								positionsDot.push( cpt++ );
								hasDot = true;
								break;
							case THIS.note.FA_POINTEE:
								n = THIS.splitPoint( n );
								positionsDot.push( cpt++ );
								hasDot = true;
								break;
							case THIS.note.SOL_POINTEE:
								n = THIS.splitPoint( n );
								positionsDot.push( cpt++ );
								hasDot = true;
								break;
							case THIS.note.LA_POINTEE:
								n = THIS.splitPoint( n );
								positionsDot.push( cpt++ );
								hasDot = true;
								break;
							case THIS.note.SI_POINTEE:
								n = THIS.splitPoint( n );
								positionsDot.push( cpt++ );
								hasDot = true;
								break;
							default:
								cpt++;
						}

						notes.push( THIS.genererNote( n ) );
					}
				);
			}

			// On vide this.tabNotes qui stockait les
			// THIS.genererNote( true );

			var note = new this.VF.StaveNote({
				clef: measureType,
				keys: notes,
				duration: figure
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

			return note;
		},

		genererNote: function( noteAndPosition )
		{
			return noteAndPosition[0] + "/" + noteAndPosition[2];
		},

		// FONCTION POUR RETIRER LE POINT DU NOM D'UNE NOTE POINTEE
		splitPoint: function( note, positionsDot )
		{
			var tab = note[0].split(".");
			note[0] = tab[0];
			return note;
		},

		calculPercent: function( valueToPercent, p, total )
		{
			return valueToPercent ? p * ( 100 / total ) : ( p / 100 ) * total;
		},

		dynamicSizingMeasure: function()
		{
			var
				THIS = this,
				allMesPart = this.partition.systeme.portee1.length,
				numSys = 0,
				mesWidth = [],
				indexMes = 0
			;

			this.offsetX = this.leftMargin = this.options.default.sidePadding;


			/////////////////////////////////////////////////////////////////////
			// PARCOURS DE TOUTE LA PARTITION                                  //
			// pour connaître la taille totale et les tailles de chaque mesure //
			/////////////////////////////////////////////////////////////////////


			// Stockage des paramètres communs dans this.measures
			for( var i = 0; i < allMesPart; i++)
			{
				var mesXML = this.partition.systeme.portee1[i];

				this.measures.push({});
				this.measures[ i ].num = i+1;



				// Si le nombre de mesures est trop important
				// il faut l'adapter
				if( THIS.systemOk )
				{
					if( mesXML.print &&
										( mesXML.print[ "_new-system" ] == "yes"
											||
										mesXML.print[ "_new-page" ] == "yes" ) )
					{
						this.measures[ i ].firstOnNewSystem = true;
						if( i != 0 )
						{
							this.offsetY += 120;
							this.measures[ i-1 ].lastOnOldSystem = true;
						} 
					}

					// Mise à jour de l'offsetY
					this.measures[ i ].offsetY = this.offsetY;
				}

				// Passage obligatoire !
				// Meme si le système est redéfini
				// (à tout moment le mode peut changer par exemple...)
				this.loadAttributs( mesXML, this.measures[ i ] );

				// La mesure a-telle une marge gauche spécifique ?
				// (début de système)
				if( mesXML.print )
				{
					if( mesXML.print[ "system-layout" ] )
					{
						if( mesXML.print[ "system-layout" ][ "system-margins" ] )
						{
							if( mesXML.print[ "system-layout" ][ "system-margins" ][ "left-margin" ] )
							{
								this.leftMargin = parseInt( mesXML.print[ "system-layout" ][ "system-margins" ][ "left-margin" ] );
								this.measures[ i ].hasLeftMargin = true;
								this.measures[ i ].offsetX = this.leftMargin;
							}
						}
					}
				}

				if( !this.measures[ i ].hasLeftMargin && !this.measures[ i ].firstOnNewSystem )
				{
					if( i > 0 && mesXML._number != "1" )
					{
						this.calculOffsetX( i );
					}
				}


				// Mise à jour de l'offsetX
				if( !this.measures[ i ].hasLeftMargin ) this.measures[ i ].offsetX = this.offsetX;

				mesXML = null;
			}

			// Si trop de mesures pour la taille d'écran
			// on recalcule la taille et l'offset des mesures
			// et leur nombre ne doit pas dépasser NB_MAX_MEASURES
			if( !THIS.systemOk )
			{
				var cpt = 0, concatWidth = 0;

				for( var i = 0; i < allMesPart; i++)
				{
					if( i == 0 || ( cpt == this.NB_MAX_MEASURES && this.responsive ) )
					{
						this.measures[ i ].firstOnNewSystem = true;

						this.loadAttributs( false, this.measures[ i ] );

						if( i != 0 )
						{
							this.measures[ i-1 ].lastOnOldSystem = true;
							this.offsetY += 120;
						}

						cpt = 0;
					}

					// Mise à jour de l'offsetY
					this.measures[ i ].offsetY = this.offsetY;

					// LARGEUR MESURE ET OFFSETX
					this.measures[ i ].width = window.innerWidth / this.NB_MAX_MEASURES;

					if( this.measures[ i ].firstOnNewSystem )
						this.measures[ i ].offsetX = THIS.options.default.sidePadding;
					else
						this.measures[ i ].offsetX = concatWidth + THIS.options.default.sidePadding;

					concatWidth += this.measures[ i ].width;
					cpt++;
				}
			}
			else
			{
				this.measures.forEach(
					function( m, i )
					{
						if( !THIS.responsive )
						{
							var mesXML = THIS.partition.systeme.portee1[i];

							if( m.firstOnNewSystem )
							{
								numSys++;
								console.log( "Système n°" + numSys + " (partition statique)" );

								m.clef      = THIS.clef;
								m.chiffrage = THIS.chiffrage;
								m.armature  = THIS.armature;
								m.mode      = THIS.mode;
							}

							m.width = parseInt( mesXML._width );
						}
						else
						{
							if( m.firstOnNewSystem )
							{
								indexMes = 0;
								numSys++;
								console.log( "Système n°" + numSys + " (partition responsive)" );

								m.clef      = THIS.clef;
								m.chiffrage = THIS.chiffrage;
								m.armature  = THIS.armature;
								m.mode      = THIS.mode;
							}

							indexMes++;
						}

						// console.log( m );
					}
				);
			}

			// Si mode responsive activé :
			// calcul des largeurs des mesures en fonction de la taille de l'écran
			// et mise à jour de l'offsetX de chaque mesure
			if( this.responsive )
						THIS.calculLargeur();

			this.creerMesure( true );

			// Le système a bien été calculé
			this.systemOk = true;

			THIS = null;
			allMesPart = null;
			mesWidth = null;
			indexMes = null;
		},

		loadAttributs: function( mesXML, mes )
		{
			// if( mesXML )
			// {
				// SI LA MESURE A DES ATTRIBUTS (chiffrage, clef, armature)
				if( mesXML.attributes )
				{
					if( mesXML.attributes.time ) 
					{
						this.chiffrage = mesXML.attributes.time.beats + "/" + mesXML.attributes.time[ "beat-type" ];
						mes.chiffrage = this.chiffrage;
					}
					if( mesXML.attributes.clef ) 
					{
						this.clef = mesXML.attributes.clef.sign == "G" ? this.CLE_SOL : this.CLE_FA;
						mes.clef = this.clef;
					}
					if( mesXML.attributes.key ) 
					{
						if( mesXML.attributes.key.fifths ) 
						{
							this.armature = mesXML.attributes.key.fifths;
							mes.armature = this.armature;
						}
						if( mesXML.attributes.key.mode ) 
						{
							this.mode = mesXML.attributes.key.mode;
						}
					}
				}
			// }
			// else
			// {
			// 	mes.mode = this.mode;
			// 	mes.clef = this.clef;
			// 	mes.chiffrage = this.chiffrage;
			// 	mes.armature = this.armature;
			// }
		},


		calculLargeur: function()
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
				indexFirstMes = [],
				indexLastMes = [],
				newSpecialMarginCurrentSys = 0,
				specialLeftMargin = 0,
				toAdd = 0, // récupère le padding de la partition
							// et le redistribue proportionnellement à chaque largeur de mesure

				p = 0 // Pour stocker les pourcentages
			;


			// console.log( "Taille écran - marges : " + screenSizeWithoutMargins );
			// console.log( "Taille partition : " + partSize );
						// console.log( "\n" );


			this.measures.forEach(
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

						var cpt = 0;
						for( var j = m.num-1; j < THIS.measures.length; j++ )
						{
							allCurrentSysMesWidth.push( parseFloat( THIS.partition.systeme.portee1[ j ]._width ) );
							totalSizeCurrentSystem += allCurrentSysMesWidth[ cpt ];

							cpt++;

							if( THIS.measures[ j ].lastOnOldSystem )
								break;
						}

						// Calcul de la taille à répartir en addition à chaque mesure du système
						// (définie par les marges blanches de chaque côté de la partition originale)
						toAdd = (newSpecialMarginCurrentSys != 0) ? newSpecialMarginCurrentSys / allCurrentSysMesWidth.length : 0;		

						partSizeWithoutMargins = partSize - totalSizeCurrentSystem - specialLeftMargin;
						p =	THIS.calculPercent( true, partSizeWithoutMargins, partSize );
						newWidthMargins = THIS.calculPercent( false, p, screenSizeWithoutMargins );
						toAdd += newWidthMargins / allCurrentSysMesWidth.length;


						// LOG
						// 
						// console.log( "Taille des marges de la partition : " + partSizeWithoutMargins );
						// console.log( "\tNouvelle taille des marges : " + newWidthMargins );
						// console.log( "\n" );
						// console.log( "Taille système courant : " + totalSizeCurrentSystem );
						// console.log( "Marge système courant : " + specialLeftMargin );
						// console.log( "Nouvelle marge : " + newSpecialMarginCurrentSys );
						// console.log( "\n" );
						// console.log( "Taille des marges à répartir : " + toAdd );
						// console.log( "Taille de chaque mesure du système courant : " );
						// console.log( "\t" + allCurrentSysMesWidth );


						cpt = 0, concatWidth = 0;
						for( var j = m.num-1; j < THIS.measures.length; j++ )
						{
							// pourcentage de la mesure dans la partition originale
							p = THIS.calculPercent( true, allCurrentSysMesWidth[ cpt ], THIS.partition.infos.page.width );
							// console.log( "\tPourcentage mes " + (j+1) + " : " + p );

							// Mise à jour de la taille de la mesure et stockage
							THIS.measures[ j ].width = THIS.calculPercent( false, p , screenSizeWithoutMargins ) + toAdd;
							// console.log( "\t\tNouvelle taille mes " + (j+1) + " : " + THIS.measures[ j ].width );

							// Concaténation de la largeur de la mesure courante
							// pour pouvoir mettre à jour correctement l'offsetX de chacune

							// Mise à jour de l'offsetX
							if( cpt == 0 )
								THIS.measures[ j ].offsetX = THIS.options.default.sidePadding;
							else
							{
								THIS.measures[ j ].offsetX = concatWidth + THIS.options.default.sidePadding;
							}
							concatWidth += THIS.measures[ j ].width;
							// console.log( "\t\toffsetX mes " + (j+1) + " : " + THIS.measures[ j ].offsetX );

							cpt++;

							if( THIS.measures[ j ].lastOnOldSystem )
								break;
						}

						totalSizeCurrentSystem = 0;
						specialLeftMargin = 0;
						newSpecialMarginCurrentSys = 0;
						allCurrentSysMesWidth = [];
						totalSizeCurrentSystem = 0;
					}
				}
			);


			screenSizeWithoutMargins = null;
			partSize = null;
			partSizeWithoutMargins = null;
			newWidthMargins = null;
			mesure = null;
			totalSizeCurrentSystem = null;
			allCurrentSysMesWidth = null,
			indexFirstMes = null,
			indexLastMes = null,
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