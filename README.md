# cds-website-pr-bot
Bot to generate PRs in digital-canada-ca-website when changes are made in the CMS.


## How it works

The CDS Website uses a Content Management System (CMS) to manage its content. Webhooks trigger calls to this Github Action when changes are made to data that necessitate a site rebuild.

This Bot builds markdown files based on the data managed by the CMS, and creates a PR on [digital-canada-ca-website](https://github.com/cds-snc/digital-canada-ca-website) with any file additions or modifications.

Objects that are deleted in the CMS will not be deleted in the repo. If a file needs to be removed from the website, it must be done manually.
