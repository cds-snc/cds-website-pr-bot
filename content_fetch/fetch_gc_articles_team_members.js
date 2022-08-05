const fetch = require('node-fetch');

var getTeamMembersFromGCArticles = async function () {
    let url = process.env.GC_ARTICLES_ENDPOINT_EN + "team?_embed";
    var out = "exec:\n";
    out += await fetch(url)
        .then(response => response.json())
        .then(
            data => {
                let txt = "";
                for (p in data) {
                    let member = data[p]
                    if (member.meta.gc_team_member_key_contact == true) {
                        txt += addTeamMember(member)
                    } 
                }

                return txt;
            }
        )
    out += "team:\n";
    out +=  await fetch(url)
    .then(response => response.json())
    .then(
        data => {
            let txt = "";
            for (p in data) {
                let member = data[p];
                if (member.meta.gc_team_member_key_contact == false) {
                    txt += addTeamMember(member)
                } 
            }

            return txt
        }
    )
    return [{body: out, fileName: "team.yml"}];
}
function addTeamMember(member) {
    let txt = "";
    txt += "  - archived: " + member.meta.gc_team_member_archived + "\n"
    txt += "    name: " + member.meta.cds_web_team_member_name + "\n"
    txt += "    title:\n"
    txt += "      en: " + member.meta.cds_web_team_member_title_en + "\n"
    txt += "      fr: " + member.meta.cds_web_team_member_title_fr + "\n"
    txt += "    image: " + member._embedded['wp:featuredmedia'][0].media_details.sizes.medium.source_url + "\n"

    if (member.meta.cds_web_team_member_email)
        txt += "    email: " + member.meta.cds_web_team_member_email + "\n";
    if (member.meta.cds_web_team_member_github)
        txt += "    github: " + member.meta.cds_web_team_member_github + "\n";
    if (member.meta.cds_web_team_member_linkedin)
        txt += "    linkedin: " + member.meta.cds_web_team_member_linkedin + "\n";
    if (member.meta.cds_web_team_member_twitter) 
        txt += "    twitter: " + member.meta.cds_web_team_member_twitter + "\n"
    return txt
}

module.exports = getTeamMembersFromGCArticles;
