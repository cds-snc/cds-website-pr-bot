// const fetch = require('node-fetch');
// const buildFileName = require("../utils/buildFileName");

// var getProductSuite = async function(lang) {
//     return await fetch(process.env.STRAPI_ENDPOINT  + "product-suite-" + lang + "s")
//     .then(response => response.json())
//     .then(
//         data => {
//             let files = [];
//             for (p in data) {
//                 let post = data[p]
//                 let out = "";
//                 out += "---\n";
//                 out += "Title: " + post.Title + "\n";
//                 out += "Subtitle: " + post.Subtitle + "\n";
//                 out += "TranslationKey: " + post.TranslationID + "\n";
//                 out += "Description: >-\n";
//                 out += "  " + post.Description + "\n";
//                 out += "SecondDescription: >-\n";
//                 out += "  " + post.SecondDescription + "\n";
//                 out += "ButtonText: " + post.ButtonText + "\n"
//                 out += "ButtonAria: " + post.ButtonAria + "\n"
//                 out += "Weight: " + post.Weight + "\n"
//                 out += "LinkToProductSuite: " + post.LinkToProductSuite + "\n"
//                 out += "TagID: " + post.TagID + "\n"
//                 out += "---\n\n";

//                 let slug = buildFileName(post.Title);
//                 files.push({body: out, fileName: slug + ".md"})
//             }

//             return files
//         }
//     ).catch((e) => {
//         console.error(e)
//     }) 

// }

// module.exports  = getProductSuite;