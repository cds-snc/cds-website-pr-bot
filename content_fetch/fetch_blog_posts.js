const fetch = require('node-fetch');

var getBlogPosts = async function(lang) {
  return await fetch(process.env.STRAPI_ENDPOINT + "blog-" + lang + "s")
  .then(response => response.json())
  .then(
    data => {
      let files = [];
      for (p in data) {
        let post = data[p]
        
        let out = "";
        out += "---\n";
        out += "layout: blog\n";
        out += "title: " + post.Title + "\n";
        out += "description: " + post.Description + "\n";
        out += "author: '" + post.AuthorAndTitle + "'\n";
        out += "date: '" + post.PublishDate + "'\n";
        out += "image: " + post.BannerImage.url + "\n";
        out += "image-alt: " + post.ImageAltText + "\n";
        out += "thumb: " + post.BannerImage.formats.thumbnail.url + "\n";
        out += "translationKey: " + post.TranslationID + "\n";
        out += "---\n";
        out += post.Body + "\n";
        
        let slug = "";
        post.Title = post.Title.replace(",", "");
        let fields = post.Title.split(" ");
        for (i in fields) {
          slug += fields[i].toLowerCase();
          if (i < fields.length - 1) {
            slug += "-"
          }
        }
        files.push({body: out, fileName: slug + ".md"})
      }
      
      return files;
    }
  )
}

module.exports = getBlogPosts;