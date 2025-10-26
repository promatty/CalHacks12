## Inspiration
Modern developers rely on a multitude of AI tools like Cursor, Claude, and Gemini, but each operates in isolation with no shared understanding of the codebase. This fragmentation makes onboarding and collaboration slow, especially in large repositories. We sought to solve this by using Chroma to vectorize and visualize your entire repo, revealing semantic relationships between files.

## What it does
Contextualize parses any GitHub repository, leveraging Chroma Sync to intelligently chunk files and create vector embeddings, allowing for both semantic and regex search. Use the 3D interactive interface to hover over files represented as spheres, find closely related files, and view commit history in a sidebar. When you select a file, Contextualize uses Lava to find and highlight its most related files and generates a copyable context summary that can be pasted into any AI tool. This gives all your assistants a unified understanding of your codebase and creates a shared context layer between developers and AI.

