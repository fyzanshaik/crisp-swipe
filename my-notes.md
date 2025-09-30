Things to add: 
Better resume checking:
    Use pdf extract tool to extract all text then send it to LLM to save tokens
    First verify if a file is resume or not
    If true then proceed with extraction or it can happen in one go

Embedding models for question bank generation and better UX by using pgvector
Using supermemoryai to build a memory brain - add on feature
Email support? Could work
UI Refresh
Deployment setup

 GROUND RULES before implementing: No comments, focus on one code file manual testing fix the type errors then move forward, yea is 2025 ask for updated
docs if facing any type issues, always make components from a optimized memorized manner so that we avoid re renders. If any issues with types check the rpc
client which is connected through Hono server, then move one step down to actual route login and then again, so we understand the foundation. Read
@package.json @frontend/package.json for full context, do not run any servers let me do it for you and they are already running, use shadcn components if
anythings not present i'll add them but do not manually insert themauth