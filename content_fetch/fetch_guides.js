const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");

var getGuides = async function(lang) {
    return await fetch(process.env.STRAPI_ENDPOINT + "guides-" + lang + "s")
    .then(response => response.json())
    .then( 
       data => {
           let files = [];
           for (p in data) {
               let post = data[p]
               let out = "";
               out += "---\n";
               out += "Title: " + post.Title + "\n";
               out += "TranslationKey: " + post.TranslationID + "\n";
               out += "Description: >-\n";
               out += "  " + post.Description + "\n";
               out += "ButtonText: " + post.ButtonText + "\n"
               out += "ButtonAria: " + post.ButtonAria + "\n"
               out += "Weight: " + post.Weight + "\n"
               out += "TagID: " + post.TagID + "\n"
               out += "LinkToGuide: " + post.LinkToGuide + "\n"
               out += "---\n\n";
               out += post.Body + "\n";

               let slug = buildFileName(post.Title);
               files.push({body: out, fileName: slug + ".md"})
           }
           return files
       } 
    ).catch((e) => {
        console.error(e)
    }) 
}
module.exports = getGuides