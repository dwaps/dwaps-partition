/**
* Auteur : 	DWAPS Formation - Michael Cornillon
* Mail : 	contact@dwaps.fr
* Tel :		0651279211
* Site : 	http://dwaps.fr
* Date : 	21/11/2016
**/


angular.module( 'dwapsPartition', [
                    'DWAPS_BUILDER_PART',
                    'dwapsLog'
                    ] )


    // CONTANTES
    .constant( 'LOG_ACTIVE', true )
    .constant( 'PARTITION', {} )

    .config( configure )
    .run( runner )
    .controller( 'partCtrl', partCtrl )
	.factory( 'partXmlFactory', partXmlFactory )
;



///////////////
// FONCTIONS //
///////////////

// CONFIGURATION
function configure( $httpProvider )
{	
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
    $httpProvider.defaults.useXDomain = true;
}


// RUN
function runner(
				$rootScope,
				$window,
				dwapsLog,
				dwapsBuilderPart,
				LOG_ACTIVE )
{
    angular.element( document ).ready( function()
    {
        // ACTIVATION / DESACTIVATON DES LOGS
        dwapsLog.active( LOG_ACTIVE );

		// PART IS READY TO DISPLAY ?
		$rootScope.start = false;

        // ON WINDOW RESIZE :
        // $rootScope.DBP est une instance de dwapsBuilderPart (voir factory adminXML() )
        angular.element( $window ).bind( 'resize', function()
        {
            if( $rootScope.DBP )
                $rootScope.DBP.resize();
        });
    });

}


// CONTROLLER
function partCtrl( partXmlFactory )
{
	partXmlFactory( 1 );
}


// FACTORY
function partXmlFactory(
					$rootScope,
					$http,
					dwapsLog,
					dwapsBuilderPart )
{
	return function ( numChant )
		{
			// REQUETE DE RECUPERATION DU FICHIER MUSICXML
			$http
				.get( 'res/' + numChant + 'msp.xml' )
				.then(
					function(data, status, headers, config)
					{
						xmlPart = data.data;

						// LOG
						dwapsLog.show( "\nLa partition a bien été récupérée !\n" );
						dwapsLog.show( xmlPart );
						dwapsLog.show( "\n" );

						var viewer = null; // Tag html qui doit contenir la partition
				        if( !$rootScope.viewerPart )
				        		viewer = $rootScope.viewerPart = document.querySelector( "div#dwaps-viewer" );


				        // GESTION DE LA PARTITION MUSICXML
				        $rootScope.DBP = dwapsBuilderPart( viewer, xmlPart );

				        // LOG
				        dwapsLog.show( "\nL'objet dwapsPartition a bién été récupéré !\n" );
				        dwapsLog.show( $rootScope.DBP );
				        dwapsLog.show( "\n" );

				        $rootScope.start = true;
					},
					function(error)
					{
						// LOG
						dwapsLog.show("\nRécupération partition xml impossible !\n");
						dwapsLog.show(error);
					}
				)
			;
		}
	;
}