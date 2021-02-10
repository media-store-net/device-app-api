db.auth("root", "Pa$$w0rd");
db.createUser(
  {
    user: "arturvoll",
    pwd: "JDSKb35QSw8!vR",
    roles: [{
      role: "readWrite",
      db: powasert
    }]
  }
);
