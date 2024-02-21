const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");

var getBlogPostsFromGCArticles = async function(lang) {
  let url = lang == "en" ? process.env.GC_ARTICLES_ENDPOINT_EN + "posts?markdown=true&_embed" : process.env.GC_ARTICLES_ENDPOINT_FR + "posts?markdown=true&_embed"
  return await fetch(url)
  .then(response => response.json())
  .then(
    data => {
      let files = [];
      for (p in data) {
        let post = data[p]
        let replacedTitle = post.title.rendered.replace(/&#8217;/g, "’")
        let category = post._embedded['wp:term']
        let out = "";
        out += "---\n";
        out += "layout: blog\n";
        out += "title: '" + replacedTitle + "'\n";
        out += "description: >-\n";
        out += "  " + post.markdown.excerpt.rendered + "\n";
        out += "author: '" + post.meta.gc_author_name + "'\n";
        out += "date: '" + post.date + "'\n";

        out += "image: " + post._embedded['wp:featuredmedia'][0].media_details.sizes.full.source_url + "\n";
        out += "image-alt: " + post._embedded['wp:featuredmedia'][0].alt_text + "\n";
        out += "thumb: " + post._embedded['wp:featuredmedia'][0].media_details.sizes.full.source_url + "\n";
        // if (category) {
        //   out += "category: " + category[0][0].name + "\n"
        // } else {
        //   out += "category: none" + "\n"
        // }

        if (category) {
          let innerCategory = category[0]
          let categoryArray = []

          for (let i = 0; i < innerCategory.length; i++ ) {
            categoryArray.push(`'${innerCategory[i].name}'`)
          }

          out += "category: " + `[${categoryArray}]`
        } else {
          out += "category ['none']"
        }
        out += "translationKey: " + post.slug + "\n";
        out += "---\n";

        // Convert any body image URLS to Cloudfront

        out += post.content.rendered + "\n";
        
        let slug = buildFileName(replacedTitle);

        files.push({body: out, fileName: slug + ".md"})
      }
      
      return files;
    }
  )
}

module.exports = getBlogPostsFromGCArticles;