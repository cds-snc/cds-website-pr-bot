const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");

const getGCArticlesPages = ( page ) => {
  const replacedTitle = page.title.rendered.replace( /&#8217;/g, "'" );

  let out = '';
  out += `---\n`;
  out += `date: '${ page.date }'\n`;
  out += `description: >-\n  '${ page.markdown.excerpt.rendered }'\n`;
  if ( page._embedded[ 'wp:featuredmedia' ] ){
    out += `image: ${ page._embedded[ 'wp:featuredmedia' ][ 0 ].media_details.sizes.full.source_url }\n`;
    out += `image-alt: ${ page._embedded[ 'wp:featuredmedia' ][ 0 ].alt_text }\n`;
    out += `thumb: ${ page._embedded[ 'wp:featuredmedia' ][ 0 ].media_details.sizes.full.source_url }\n`;
  }
  out += `layout: ${ page.layout }\n`
  out += `title: '${ replacedTitle }'\n`;
  out += `translationKey: ${ page.slug }\n`;
  if ( page.type ) {
    out += `type: ${ page.type }\n`
  }
  out += `---\n`;
  out += `${ page.content.rendered }\n`;

  return out;
};

const getGCArticlesPagesFromAPI = async function( lang ) {
  try {
    const url = lang === "en" 
      ? process.env.GC_ARTICLES_ENDPOINT_EN
      : process.env.GC_ARTICLES_ENDPOINT_FR

    if ( !url ) {
      throw new Error( `Missing endpoint configuration for language: ${ lang }` );
    }

    const response = await fetch( `${ url }pages?markdown=true&_embed` );
    if ( !response.ok ) {
      throw new Error( `HTTP error! status: ${ response.status }` );
    }

    const data = await response.json();
    if ( !Array.isArray( data ) ) {
      throw new Error( 'Expected array of pages from API' );
    }

    return data.map( page => {
      const content = getGCArticlesPages( page );
      const fileName = buildFileName( page.title.rendered );
      return { body: content, fileName: `${ fileName }.md` };
    } );

  } catch ( error ) {
    console.error( 'Failed to fetch pages:', error );
    throw error;
  }
}
module.exports = getGCArticlesPagesFromAPI;