if (process.env.NODE_ENV != "Production") {
  const envResult = require('dotenv').config()
}
const github = require('@actions/github');
const Base64 = require('js-base64').Base64;

const myToken = process.env.TOKEN;
const octokit = github.getOctokit(myToken);

const getBlogPosts = require("./content_fetch/fetch_blog_posts");
const getJobPosts = require("./content_fetch/fetch_job_posts");

const getTeamMembers = require("./content_fetch/fetch_team_members");


async function closePRs() {
  // Close old auto PRs
  const {data: prs} = await octokit.pulls.list({
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    state: 'open'
  });

  prs.forEach( async pr => {
    if(pr.title.startsWith("[AUTO-PR]")) {
      await octokit.pulls.update({
        owner: 'cds-snc',
        repo: 'digital-canada-ca',
        pull_number: pr.number,
        state: "closed"
      });
      await octokit.git.deleteRef({
        owner: 'cds-snc',
        repo: 'digital-canada-ca',
        ref: `heads/${pr.head.ref}`
      });
    }
  })
}

const getHeadSha = async (repo, branch = 'master') => {
  const { data: data } = await octokit.repos.getBranch({
    owner: 'cds-snc',
    repo,
    branch,
  });
  return data.commit.sha;
}

const getExistingContent = async (path) => {
  const { data: data } = await octokit.repos.getContent({
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    path: path,
  });
  //console.log(data)
  return data;
}

const createAndUpdateFiles = async (newFiles, oldFiles, path, branchName) => {
  // for each modified or changed file:
  for (f in newFiles) {
    // === if file new or modified code here! ====
    // If single file, github returns an object instead of an array
    var exists = (oldFiles.name && oldFiles.name == newFiles[f].fileName) ? [oldFiles] : oldFiles.filter(oldFile => oldFile.name == newFiles[f].fileName);
    let content = Base64.encode(newFiles[f].body)

    if (exists.length == 0) {
      // Create new File
      await octokit.repos.createOrUpdateFileContents({
        owner: 'cds-snc',
        repo: 'digital-canada-ca',
        path: path + newFiles[f].fileName,
        content: content,
        branch: branchName,
        message: "Added new file: " + newFiles[f].fileName
      })
    } else {
      await octokit.repos.getContent({
        owner: 'cds-snc',
        repo: 'digital-canada-ca',
        path: exists[0].path
      }).then(async result => {
        if (Base64.decode(result.data.content) != newFiles[f].body) {
          // Update existing file
          await octokit.repos.createOrUpdateFileContents({
            owner: 'cds-snc',
            repo: 'digital-canada-ca',
            sha: exists[0].sha, // if update this is required
            path: exists[0].path,
            content: content,
            branch: branchName,
            message: "Updated file: " + newFiles[f].fileName
          })
        }
      })
    }
  }
}

/*

Steps to update:

1. Strapi webhook calls this on a change in Strapi
2. Pull down digital-canada-ca
3. Run build content script to generate / update markdown
4. Do a pull request onto digital-canada-ca with the new content

*/

async function run() {
  /*
  // whole repo
  const { data: data } = await octokit.repos.getContent({
    owner: 'cds-snc',
    repo: 'digital-canada-ca'
  });
  //console.log(data)
  */

  // blog posts - en / fr
  blogPostsEnExisting = await getExistingContent('/content/en/blog/posts');
  blogPostsFrExisting = await getExistingContent('/content/fr/blog/posts');
  // job postings (en / fr)
  jobPostsEnExisting = await getExistingContent('/content/en/join-our-team/positions');
  jobPostsFrExisting = await getExistingContent('/content/fr/join-our-team/positions');
  // products (en / fr)


  // team members
  let teamMembersExisting = await getExistingContent('/data/team.yml');

  // Get CMS Content
  // Blog Posts
  var blogPostsEnNew = await getBlogPosts("en");
  var blogPostsFrNew = await getBlogPosts("fr");
  // Job Postings
  var jobPostsEnNew = await getJobPosts("en");
  var jobPostsFrNew = await getJobPosts("fr");

  // Team Members
  var teamMembersNew = await getTeamMembers();

  // Create Ref
  const websiteSha = await getHeadSha("digital-canada-ca", "master");
  branchName = `content-release-${new Date().getTime()}`;
  
  let refs = await octokit.git.createRef({
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    ref: `refs/heads/${branchName}`,
    sha: websiteSha
  });
  

  // Create / Update file commits
  // Blog posts
  await createAndUpdateFiles(blogPostsEnNew, blogPostsEnExisting, "content/en/blog/posts/", branchName);
  await createAndUpdateFiles(blogPostsFrNew, blogPostsFrExisting, "content/fr/blog/posts/", branchName);
  // Job Postings
  await createAndUpdateFiles(jobPostsEnNew, jobPostsEnExisting, "content/en/join-our-team/positions/", branchName);
  await createAndUpdateFiles(jobPostsFrNew, jobPostsFrExisting, "content/fr/join-our-team/positions/", branchName);

  // Team Members
  await createAndUpdateFiles(teamMembersNew, teamMembersExisting, "data/", branchName);

  // if there is content - compare shas of most recent commit on the branch and main
  let branchcommit = await octokit.request('GET /repos/{owner}/{repo}/commits/{sha}', {
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    sha: branchName
  });
  let maincommit = await octokit.request('GET /repos/{owner}/{repo}/commits/{sha}', {
    owner: 'cds-snc',
    repo: 'digital-canada-ca',
    sha: "master"
  })
  if (branchcommit.data && branchcommit.data.sha != maincommit.data.sha) {
    closePRs()

    // Make the new PR
    await octokit.pulls.create({
      owner: 'cds-snc',
      repo: 'digital-canada-ca',
      title: `[AUTO-PR] New content release -  ${new Date().toISOString()}`,
      head: branchName,
      base: 'master',
      body: "Testing!",
      draft: false
    });

  } else {
    // no commits, delete the ref
    await octokit.git.deleteRef({
      owner: 'cds-snc',
      repo: 'digital-canada-ca',
      ref: `heads/${branchName}`
    });
  }
  
}
run();