// Compatibility entry point; the original V2 sample lives in scripts/legacy/.
import { main } from './build_iran_briefing_pdf_v3.mjs';
main().catch(error => { console.error(error.message); process.exitCode = 1; });
