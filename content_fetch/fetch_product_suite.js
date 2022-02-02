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
                out += "title: '" + post.title + "'\n";
                out += "subtitle: '" + post.subtitle + "'\n";
                out += "translationKey: " + post.TranslationID + "\n";
                out += "description: >-\n";
                out += "  " + post.description + "\n";
                out += "secondDescription: >-\n";
                out += "  " + post.secondDescription + "\n";
                out += "buttonText: " + post.buttonText + "\n"
                out += "buttonAria: " + post.buttonAria + "\n"
                out += "weight: " + post.weight + "\n"
                out += "url: " + post.url + "\n"
                out += "---\n\n";
                out += post.Body + "\n";

                let slug = buildFileName(post.title);
                files.push({body: out, fileName: slug + ".md"})
            }

            return files
        }
    )

}

module.exports  = getProductSuite;