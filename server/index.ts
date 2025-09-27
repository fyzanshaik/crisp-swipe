import app from "./app";

//NOTE: BY default bun servers from port 3000 else it checks the .env for the PORT env variable
Bun.serve({
  fetch: app.fetch,
});

console.log("Server started on port 3000");
