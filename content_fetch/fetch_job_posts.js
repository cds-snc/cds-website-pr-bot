const fetch = require('node-fetch');

var getJobPosts = async function(lang) {
  return await fetch(process.env.STRAPI_ENDPOINT + "job-posting-" + lang + "s")
  .then(response => response.json())
  .then(
    data => {
      let files = [];
      for (p in data) {
        let post = data[p]
        let out = "";
        out += "---\n";
        out += "layout: job-posting\n";
        out += "type: section\n";
        out += "title: " + post.Title + "\n";
        out += "description: " + post.Description + "\n";
        out += "archived: " + post.Archived + "\n";
        out += "translationKey: " + post.TranslationID + "\n";
        out += "leverId: " + post.LeverId + "\n";
        out += "---\n";
        out += post.Body + "\n";

        let slug = "";
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

module.exports = getJobPosts;