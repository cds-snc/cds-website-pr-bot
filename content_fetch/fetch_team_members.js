const fetch = require('node-fetch');
//
var getTeamMembers = async function() {
  var out = "exec:\n";
  out += await fetch(process.env.STRAPI_ENDPOINT + "team-members?KeyContact=true&_sort=name:ASC")
  .then(response => response.json())
  .then(
    data => {
      let txt = "";
      for (p in data) {
        let member = data[p]
        txt += addTeamMember(member);
      }
      return txt;
    }
  );
  out += "team:\n";
  out += await fetch(process.env.STRAPI_ENDPOINT + "team-members?KeyContact=false&_sort=name:ASC")
  .then(response => response.json())
  .then(
    data => {
      let txt = "";
      for (p in data) {
        let member = data[p]
        txt += addTeamMember(member);
      }
      return txt;
    }
  )

  // return a single file in an array so existing function can be re-used to process
  return [{body: out, fileName: "team.yml"}];
}

var addTeamMember = function(member) {
  let txt = ""
  txt += "  - archived: " + member.archived + "\n";
  txt += "    name: " + member.name + "\n";
  txt += "    title:\n"
  txt += "      en: " + member.titleEN + "\n";
  txt += "      fr: " + member.titleFR + "\n";

  let hash = (member.Photo.formats.small ? member.Photo.formats.small.hash : member.Photo.hash);
  txt += "    imagehash: " + hash + "\n";
  
  if (member.email)
    txt += "    email: " + member.email + "\n";
  if (member.github)
    txt += "    github: " + member.github + "\n";
  if (member.linkedin)
    txt += "    linkedin: " + member.linkedin + "\n";
  if (member.twitter)
    txt += "    twitter: " + member.twitter + "\n";
  
  return txt;
}

module.exports = getTeamMembers;