const { fetch, buildFileName } = require( './shared' );

const getCategoryDetails = async ( categoryRef ) => {
  const response = await fetch( categoryRef.href);
  const categoryData = await response.json();
  return categoryData[0];
};

const getCategoryDetails = async ( categoryRef ) => {
  const response = await fetch( categoryRef.href);
  const categoryData = await response.json();
  return categoryData[0];
};

const generatePostContent = async ( post ) => {
  const replacedTitle = post.title.rendered.replace( /&#8217;/g, "'" );
  const categoryRefs = post._embedded[ 'wp:term' ];
  
  let out = '';
  out += `---\n`;
  out += `author: '${ post.meta.gc_author_name }'\n`;
  // Process categories
  out += `date: '${ post.date }'\n`;
  out += `description: >-\n  '${ post.markdown.excerpt.rendered }'\n`;
  if ( post._embedded[ 'wp:featuredmedia' ] ){
    out += `image: ${ post._embedded[ 'wp:featuredmedia' ][ 0 ].media_details.sizes.full.source_url }\n`;
    out += `image-alt: ${ post._embedded[ 'wp:featuredmedia' ][ 0 ].alt_text }\n`;
    out += `thumb: ${ post._embedded[ 'wp:featuredmedia' ][ 0 ].media_details.sizes.full.source_url }\n`;
  }
  
  // Process categories
  out += `layout: blog\n`;
  
  // Process categories
  if ( categoryRefs ) {
    const categories = await Promise.all(
      categoryRefs[ 0 ].map( catRef => getCategoryDetails( catRef ) )
    );
    const categoryArray = categories.map( cat => `'${ cat.name }'` );
    out += `tags: [ ${ categoryArray } ]\n`;
  } else {
    out += `tags: [ '' ]\n`;
  }
  out += `title: '${ replacedTitle }'\n`;
  out += `translationKey: ${ post.slug }\n`;
  out += `---\n`;
  out += `${ post.content.rendered }\n`;

  return out;
};

const getBlogPostsFromGCArticles = async function( lang ) {
  try {
    const url = lang === "en" 
      ? process.env.GC_ARTICLES_ENDPOINT_EN
      : process.env.GC_ARTICLES_ENDPOINT_FR

    if ( !url ) {
      throw new Error(`Missing endpoint configuration for language: ${ lang }`);
    }

    const response = await fetch( `${ url }posts?markdown=true&_embed` );
    if ( !response.ok ) {
      throw new Error( `HTTP error! status: ${ response.status }` );
    }

    const data = await response.json();
    if ( !Array.isArray( data ) ) {
      throw new Error( 'Expected array of posts from API' );
    }

    return await Promise.all( data.map( async post => {
      const content = await generatePostContent( post );
      const fileName = buildFileName( post.title.rendered );
      return { body: content, fileName: `${ fileName }.md` };
    } ) );
  } catch ( error ) {
    console.error( 'Failed to fetch blog posts:', error );
    throw error;
  }
}

module.exports = getBlogPostsFromGCArticles;