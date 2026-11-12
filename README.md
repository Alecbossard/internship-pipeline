# Internship Pipeline

**Human-in-the-loop LLM orchestration for internship applications.** A Python service coordinates the search, review and application workflow through a mobile web app and Telegram. This repository presents the architecture and a standalone demonstration of the offer triage interface.

[Try the interactive demo](https://alecbossard.github.io/internship-pipeline/demo/) · [Browse the demo source](demo/)

![Offer triage demo showing a fictional robotics internship with dismiss, save and review approval controls](preview.png)

The demo runs in the browser on three fictional offers. Swipe right to open an approval dialog, swipe left to dismiss, or save the offer for later. To run it locally, download the repository and open `demo/index.html`.

## How the live workflow works

The user starts a search or imports an offer. The service applies eligibility criteria, deduplicates results and records source links. The user reviews an offer and explicitly approves it before application work can start.

```mermaid
flowchart TD
    Intake[Search or import] --> Queue[Offer queue]
    Queue --> Decision{User decision}
    Decision -->|Dismiss or save| Queue
    Decision -->|Approve standard workflow| Verify[Check and capture original posting]
    Verify -->|Evidence incomplete| Wait[Wait for clarification]
    Wait --> Verify
    Verify -->|Evidence confirmed| Draft[Draft résumé and cover letter]
    Draft --> Review[Independent document review]
    Review -->|Corrections requested| Draft
    Review -->|Reviewed artifacts verified| Submit[Browser submission]
    Submit --> Evidence[Record portal evidence or check email receipt]
```

The app also offers a document-only path for users who prefer to submit manually. This path ends with reviewed PDFs ready to download.

## Engineering decisions

| Decision | How it works |
| --- | --- |
| Approval tied to the offer shown | The service checks the offer ID and revision before accepting the user's decision. |
| Separate tools by role | An isolated public browser captures the posting. Other workers handle writing, review, submission and receipt verification. |
| Evidence linked to reviewed documents | The captured posting and document hashes are associated with the dossier. The service checks the reviewed files before submission. |
| Recoverable work | A single service writes durable queue and dossier state. If the result of a submission attempt is uncertain, the dossier waits for verification before another attempt. |

**Stack** · Python, Codex CLI, Playwright MCP, JavaScript, Telegram, Google Docs, Linux and systemd.

## My contribution

I defined the requirements, designed the approval workflow and refined the interface and edge cases through real use. I directed implementation and Linux deployment with substantial assistance from coding agents.

## Repository scope

The source here implements the standalone interface demo. The case study describes the deployed personal application. The live service and candidate records are private.
