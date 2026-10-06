# Book discovery providers

The search API uses a provider interface (`lib/books/providers.ts`) so an unavailable catalog does not fail the complete search. Results are metadata records; a result is marked readable in GwenBooks only when a provider exposes a supported text source that the reader currently handles.

| Provider | Current use | Reading treatment | Notes |
| --- | --- | --- | --- |
| Project Gutenberg via Gutendex | Search catalog metadata and formats | GwenBooks links to the canonical Gutenberg book page; it does not stream Gutenberg-hosted text or inline its cover art | The API is Gutendex, not Gutenberg-site scraping. Gutenberg's terms ask third-party discovery sites to link to canonical landing pages and prohibit wrapping its site/content and large-scale direct file linking. Confirm jurisdiction-specific rights before redistribution. |
| Open Library | Human-initiated metadata search and cover lookup | Link to the Open Library record; never assume full text access from publication year or a full-text flag | Cache results; identify the application with `User-Agent`. Configure `OPEN_LIBRARY_CONTACT_EMAIL` for an operator contact. Open Library states its APIs are for human-centered discovery, not bulk/high-traffic commercial backends. |
| Google Books | Metadata and access/preview metadata when `GOOGLE_BOOKS_API_KEY` is configured | External preview/info link only; previews are not presented as a GwenBooks full-text reader | Public API requests require an API key. Availability and viewability depend on the user's location. Never proxy/download restricted text. |
| Wikisource | English Wikisource search and extract endpoint | Extracts can render in the existing reader; retain the Wikisource source link | Text rights and reuse depend on the work and the relevant Wikimedia project page. |

Search is cached per running application instance for five minutes (20 seconds for partial results after a provider failure). This is a cost/load reduction measure, not a durable shared cache; separate serverless instances can still query providers independently. Provider requests time out independently after six seconds. A timeout or provider error is reported alongside partial results. The public API also applies a 30-search-per-10-minute per-IP limit using Upstash Redis; if the limiter is temporarily unavailable, search stays available and logs the condition.

Internet Archive search is deliberately not used to grant in-app reading access. The previous implementation inferred public-domain status from a publication year cutoff; publication date alone is not a reliable rights determination. Archive items should be added only after an explicit rights/access policy and metadata-specific checks are implemented.

## Official references

- [Open Library API usage and rate-limit guidance](https://openlibrary.org/developers/api)
- [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers)
- [Google Books API usage, authorization, query and viewability fields](https://developers.google.com/books/docs/v1/using)
- [Google Books volumes list API](https://developers.google.com/books/docs/v1/reference/volumes/list)
- [Gutendex API](https://gutendex.com/)
- [Project Gutenberg terms of use](https://www.gutenberg.org/policy/terms_of_use.html)
- [Project Gutenberg linking policy](https://www.gutenberg.org/policy/linking.html)
