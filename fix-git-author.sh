#!/bin/sh

# Credits: http://stackoverflow.com/a/750191

git filter-branch -f --env-filter "
    GIT_AUTHOR_NAME='Simone Schäfer'
    GIT_AUTHOR_EMAIL='imkreislaufen@googlemail.com'
    GIT_COMMITTER_NAME='Simone Schäfer'
    GIT_COMMITTER_EMAIL='imkreislaufen@googlemail.com'
  " HEAD