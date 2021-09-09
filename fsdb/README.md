# Purple Cheetah Module - FSDB

![Logo](https://i.imgur.com/f2Mv4QD.png)

> Install `npm i --save @becomes/purple-cheetah-mod-fsdb`

It is a small, nice module for local development. It provides the same API as [MongoDB module](/becomesco/purple-cheetah-modules/mongodb) which makes it quite easy to migrate between them.

**IMPORTANT:** This package is not design to be used as production database. It is save to use for very small databases in production and for some light caching but cannot replace the MongoDB, MySQL or any other real database. This is due to package design which will be explained in the document.

## Core concepts

Since this package emulates the MongoDB, core concepts are pretty similar. Data is stored in collections and each collection holds entities/documents. Each collection is represented with a *Repository* which provides some basic methods for querying and mutating collection items. Data is stored in the database as shown below:

```text
Repository 1
  ---> Entity 1
  ---> Entity 2
  ---> .....
Repository 2
  ---> Entity 1
  ---> Entity 2
  ---> .....
Repository 3
  ---> Entity 1
  ---> Entity 2
  ---> .....
.....
```

Once FSDB module is mounted in a [Purple Cheetah](https://github.com/becomesco/purple-cheetah) application, first, it will search for database file at specified path (default path is `$CWD/db/.fsbd.json`). If file exists, it will load it and save it in-memory. This is the only time in lifecycle of the app that database file is read. 
