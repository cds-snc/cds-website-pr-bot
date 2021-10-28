const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");

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
        out += "type: job_post\n";
        out += "title: '" + post.Title + "'\n";
        out += "description: >-\n";
        out += "  " + post.Description + "\n";
        out += "archived: " + post.Archived + "\n";
        out += "translationKey: " + post.TranslationID + "\n";
        out += "leverId: " + post.LeverId + "\n";
        out += "---\n\n";
        out += post.Body + "\n";

        let slug = buildFileName(post.Title);
        
        files.push({body: out, fileName: slug + ".md"})
      }
      
      return files;
    }
  )
}

module.exports = getJobPosts;