# Bookscrape

A tool for analyzing narrative stories using OpenAI APIs, Pinecone Vectore database, and Langchain RAG pipeline to retrieve information from long text media.

## Goal

Running this program will take the text contents of a book (or other narrative based text media) and produce a graph datastructure of the characters in the story and summaries of their interactions. This analysis tool could be used to visualize sumaries of character dynamics over time when using a graph database such as Neo4j.

## Usage

To run the program, you must first set the environment variables for the APIs used and the asset files to be analyzed.
| Env Var           | Value Description                                        |
| ----------------- | -------------------------------------------------------- |
| OPENAI_API_KEY    | OpenAI API key for accessing the Embedding and Chat APIs |
| LANGCHAIN_API_KEY | Langchain API key for RAG retrieval                      |
| PINECONE_API_KEY  | API key for Pinecone vector datastore                    |
| ASSET_FILE_PATH   | File path to the text to be analyzed                     |

Currently the parser assumes that the file is preprocessed into the format of each chapter starting with a line `CHAPTER [IVX]*.`.

```
$ yarn run build && yarn run start
```
