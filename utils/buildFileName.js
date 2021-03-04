var buildFileName = function(title) {
  let slug = "";

  // sanitize special characters
  title = title.replace(/\(|\)|,|\//g, " ");

  // collapse spaces
  title = title.replace(/  +/g, " ");

  // remove trailing dash
  if (title.slice(-1) == " ")
    title = title.slice(0, -1)

  // build filename
  let fields = title.split(" ");
  for (i in fields) {
    slug += fields[i].toLowerCase();
    if (i < fields.length - 1) {
      slug += "-"
    }
  }

  return slug;
}

module.exports = buildFileName;