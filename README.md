# cds-website-pr-bot
Bot to generate PRs in digital-canada-ca when changes are made in the CMS.


## How it works

The CDS Website uses [strapi](https://strapi.io/) as its' Content Management System (CMS). Strapi uses webhooks to call this Github Action when changes are made to data that necessitate a site rebuild.

This Bot builds markdown files based on the data managed by Strapi, and creates a PR on [digital-canada-ca](https://github.com/cds-snc/digital-canada-ca) with any file additions or modifications.

Objects that are deleted in Strapi will not be deleted in the repo. The "Archive" function achieves the same goal. If a file needs to be removed from the website, it must be done manually.
