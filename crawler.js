//. crawler.js
var client = require( 'cheerio-httpcli' );
var fs = require( 'fs' );

client.set( 'browser', 'chrome' );
client.set( 'referer', false );

var out_dir = './out/';
var base_url = 'http://www.uta-net.com/name_list/';
async_main( base_url ).then( function(){} );

async function async_main( url ){
  return new Promise( async function( resolve, reject ){
    for( var i = 0; i <= 70; i ++ ){
      fs.mkdirSync( out_dir + i );
      var artists = await getNamesHrefs( url + i, '.anchor_box .artist_list dd ul li p.name a' );
      for( var j = 0; j < artists.length; j ++ ){
        var artist = artists[j];
        await crawlArtist( i, artist.name, 'http://www.uta-net.com' + artist.href );
      }
    }
    resolve( true );
  });
}

async function getNamesHrefs( url, selector ){
  return new Promise( async function( resolve, reject ){
    //console.log( 'getNamesHrefs: url = ' + url );
    client.fetch( url, {}, 'UTF-8', function( err, $, res, body ){
      if( err ){
        //console.log( err );   // 404 error
        resolve( [] );
      }else{
        var names_hrefs = [];
        $( selector ).each( function(){
          var href = $(this).attr( 'href' );
          var name = $(this).text();
          names_hrefs.push( { name: name, href: href } );
        });
        resolve( names_hrefs );
      }
    });
  });
}

async function crawlArtist( capital, artist_name, url ){
  return new Promise( async function( resolve, reject ){
    console.log( 'artist ' + artist_name + ' : ' + url );

    var b = true;
    var idx = 1;
    while( b ){
      var page_url = url + '0/' + idx + '/';
      var songs = await getNamesHrefs( page_url, '.result_table table tbody td.td1 a' );
      if( !songs || songs.length == 0 ){
        b = false;
      }else{
        for( var i = 0; i < songs.length; i ++ ){
          var song = songs[i];
          await crawlSong( capital, artist_name, song.name, 'http://www.uta-net.com' + song.href );
        }
        idx ++;
      }
    }

    resolve( true );
  });
}

async function crawlSong( capital, artist_name, song_name, url ){
  return new Promise( async function( resolve, reject ){
    client.fetch( url, {}, 'UTF-8', function( err, $, res, body ){
      if( err ){
        resolve( false );
      }else{
        getLyric( $ ).then( async function( lyric ){
          getLyricist( $ ).then( async function( lyricist ){
            getComposer( $ ).then( async function( composer ){
              console.log( 'song ' + artist_name + ' - ' + song_name + ' : ' + url );
              await saveSong( capital, artist_name, song_name, url, lyric, lyricist, composer );
              resolve( true );
            });
          });
        });
      }
    });
  });
}

async function getLyric( $ ){
  return new Promise( async function( resolve, reject ){
    var lyric = '';
    $( '#kashi_area' ).each( async function(){
      lyric = $(this).text();
    });
    resolve( lyric );
  });
}

async function getLyricist( $ ){
  return new Promise( async function( resolve, reject ){
    var lyricist = '';
    $( 'h4[itemprop="lyricist"]' ).each( async function(){
      lyricist = $(this).text();
    });
    resolve( lyricist );
  });
}

async function getComposer( $ ){
  return new Promise( async function( resolve, reject ){
    var composer = '';
    $( 'h4[itemprop="composer"]' ).each( async function(){
      composer = $(this).text();
    });
    resolve( composer );
  });
}

async function saveSong( capital, artist_name, song_name, url, lyric, lyricist, composer ){
  return new Promise( async function( resolve, reject ){
    artist_name = artist_name.split( '/' ).join( '／' ).split( '\\' ).join( '￥' );
    lyricist = lyricist.split( '/' ).join( '／' ).split( '\\' ).join( '￥' );
    composer = composer.split( '/' ).join( '／' ).split( '\\' ).join( '￥' );
    song_name = song_name.split( '/' ).join( '／' ).split( '\\' ).join( '￥' );
    var filename = out_dir + capital + '/' + artist_name + ' - ' + song_name + '.json';
    var data = {
      artist: artist_name,
      title: song_name,
      lyricist: lyricist,
      composer: composer,
      url: url,
      lyric: lyric
    };
    //console.log( data );

    try{
      fs.writeFileSync( filename, JSON.stringify( data, null, 2 ) );
    }catch( e ){
      console.log( e );
    }
    resolve( true );
  });
}
