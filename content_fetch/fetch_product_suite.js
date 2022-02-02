const fetch = require('node-fetch');
const buildFileName = require("../utils/buildFileName");

var getProductSuite = async function(lang) {
    return await fetch(process.env.STRAPI_ENDPOINT  + "product-suite-" + lang + "s")
    .then(response => response.json())
    .then(
        data => {
            let files = [];
            for (p in data) {
                let post = data[p]
                let out = "";
                out += "---\n";
                out += "title: " + post.Title + "\n";
                out += "subtitle: " + post.Subtitle + "\n";
                out += "translationKey: " + post.TranslationID + "\n";
                out += "description: >-\n";
                out += "  " + post.Description + "\n";
                out += "secondDescription: >-\n";
                out += "  " + post.SecondDescription + "\n";
                out += "buttonText: " + post.ButtonText + "\n"
                out += "buttonAria: " + post.ButtonAria + "\n"
                out += "weight: " + post.Weight + "\n"
                out += "url: " + post.Url + "\n"
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

module.exports  = getProductSuite;